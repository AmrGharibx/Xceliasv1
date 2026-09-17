import {EventEmitter} from 'node:events';
import crypto from 'node:crypto';
import {TABLES,id,emptyState,attendanceStats,checklist,scores,assessedRows,assessmentFor,checklistFor} from '../public/modules/core.mjs';
import {validate,ApiError,isId} from './validation.mjs';
export const events=new EventEmitter();events.setMaxListeners(200);
let repositoryPromise;
export function repository(){return repositoryPromise??=(async()=>{
 if(process.env.VERCEL||process.env.DATABASE_MODE && process.env.DATABASE_MODE!=='sqlite')throw new Error('This private edition needs a persistent server and SQLite disk. Do not deploy it to an ephemeral serverless filesystem.');
 const{SQLiteRepository}=await import('./sqlite.mjs');const repo=new SQLiteRepository(process.env.DATABASE_PATH||'./data/red-academy.db');await repo.init();return repo;
})();}
const json=(body,status=200,cookies=[])=>{const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});cookies.forEach(c=>headers.append('Set-Cookie',c));return new Response(JSON.stringify(body),{status,headers});};
function cookie(name,value,age=43200){return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.APP_ENV==='production'||process.env.APP_URL?.startsWith('https://')?'; Secure':''}`;}
function cookiesOf(request){return Object.fromEntries((request.headers.get('cookie')||'').split(';').map(s=>s.trim().split('=')).filter(p=>p.length===2).map(([k,v])=>[k,decodeURIComponent(v)]));}
function checkOrigin(request){const expected=process.env.APP_URL||new URL(request.url).origin;const supplied=request.headers.get('origin');if(supplied!==new URL(expected).origin||request.headers.get('x-red-request')!=='1')throw new ApiError(403,'Request origin could not be verified. Open the app on its configured APP_URL.');}
async function bodyOf(request){const text=await request.text();if(text.length>150000)throw new ApiError(413,'Request is too large.');try{const body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Invalid body');return body;}catch{throw new ApiError(400,'Invalid JSON request.');}}
function canWrite(user){if(!['admin','instructor'].includes(user.role))throw new ApiError(403,'Your role is read-only.');}
function admin(user){if(user.role!=='admin')throw new ApiError(403,'Administrator access is required.');}
export function prepareOperations(body,state,user){
 const table=body.table;if(!TABLES.includes(table))throw new ApiError(400,'Unknown entity.');canWrite(user);
 const inputs=body.records||[body];if(!Array.isArray(inputs)||!inputs.length||inputs.length>100)throw new ApiError(400,'Choose between 1 and 100 records.');
 if(body.records&&table!=='daily_attendance')throw new ApiError(400,'Bulk editing is supported for daily attendance.');const ops=[],targets=new Set();
 for(const input of inputs){const action=input.action||body.action;if(!['create','update','delete'].includes(action))throw new ApiError(400,'Invalid action.');if(action==='delete')admin(user);
  const old=action==='create'?null:state[table].find(r=>r.id===input.id);if(action!=='create'&&(!isId(input.id)||!old))throw new ApiError(404,'Record not found.');
  if(old&&(!Number.isInteger(input.expectedVersion)||input.expectedVersion!==old.version))throw new ApiError(409,'This record changed in another session. Refresh and try again.');
  if(targets.has(input.id)&&input.id)throw new ApiError(400,'A record may only occur once in a request.');if(input.id)targets.add(input.id);
  if(action==='delete'){ops.push({table,action,id:old.id,expectedVersion:old.version});continue;}
  const data=validate(table,input.data,{old});
  if(old&&'trainee_id' in old&&(old.trainee_id!==data.trainee_id||old.batch_id!==data.batch_id))throw new ApiError(400,'Existing source enrollment links cannot be reassigned by a record edit.');
  if(data.trainee_id){const t=state.trainees.find(t=>t.id===data.trainee_id);if(!t||t.batch_id!==data.batch_id)throw new ApiError(400,'The trainee must belong to this batch.');if(old&&(old.trainee_id!==data.trainee_id||old.batch_id!==data.batch_id))throw new ApiError(400,'An existing record cannot be assigned to a different trainee.');}
  if(table==='trainees'){
   const b=state.batches.find(b=>b.id===data.batch_id);if((data.batch_id&&!b)||(data.company_id&&!state.companies.some(c=>c.id===data.company_id)))throw new ApiError(400,'Choose an existing batch and company.');
   if(old&&old.batch_id!==data.batch_id)throw new ApiError(400,'Create a new enrollment to place this trainee in another batch.');
   if(!old&&b?.capacity!=null&&state.trainees.filter(t=>t.batch_id===b.id).length>=b.capacity)throw new ApiError(400,'This batch is at capacity.');
  }
  if(table==='batches'&&old){if(data.capacity!=null&&data.capacity<state.trainees.filter(t=>t.batch_id===old.id).length)throw new ApiError(400,'Capacity cannot be lower than the enrolled headcount.');const scheduleChanged=JSON.stringify(old.session_dates)!==JSON.stringify(data.session_dates)||old.start_date!==data.start_date||old.end_date!==data.end_date;if(scheduleChanged&&!old.source_id&&state.trainees.some(t=>t.batch_id===old.id))throw new ApiError(400,'Enrolled batch dates are locked to preserve attendance history. Create a new batch for a new schedule.');}
  if(table==='daily_attendance'){
   const b=state.batches.find(b=>b.id===data.batch_id);
   if(b?.source_id&&data.date&&!b.session_dates.includes(data.date)&&!ops.some(o=>o.table==='batches'&&o.id===b.id)){const additions=inputs.map(x=>x.data).filter(x=>x?.batch_id===b.id&&x.date).map(x=>x.date);ops.push({table:'batches',action:'update',id:b.id,expectedVersion:b.version,data:{...b,session_dates:[...new Set([...b.session_dates,...additions])].sort()}});}
   if((!b&&!old?.source_id)||(!old?.source_id&&!b?.source_id&&!b?.session_dates.includes(data.date)))throw new ApiError(400,'Attendance must be recorded on one of the 10 scheduled session dates. Edit an empty batch schedule before enrolling trainees.');
   if(data.trainee_id&&state.daily_attendance.some(r=>r.id!==old?.id&&r.trainee_id===data.trainee_id&&r.date===data.date)&&!(old?.source_id&&old.trainee_id===data.trainee_id&&old.date===data.date))throw new ApiError(409,'Attendance already exists for this trainee and date.');
  }
  if(['assessments','attendance_10day'].includes(table)&&data.trainee_id&&!old?.source_id&&state[table].some(r=>r.id!==old?.id&&r.trainee_id===data.trainee_id&&r.batch_id===data.batch_id&&(table!=='attendance_10day'||(r.period_start===data.period_start&&r.period_end===data.period_end))))throw new ApiError(409,'This trainee already has a record in this batch.');
  if(table==='attendance_10day'&&!old?.source_id){const b=state.batches.find(b=>b.id===data.batch_id);if(data.period_start!==b.start_date||data.period_end!==b.end_date)throw new ApiError(400,'The checklist period must match the batch dates.');}
  if(table==='assessments'){
   if(!old&&!data.company_id)data.company_id=state.trainees.find(t=>t.id===data.trainee_id)?.company_id||null;
   const complete=scores(data).overall!==null,notAssessed=/^\s*not\s+assess?ed\s*[.!]?\s*$/i.test(data.instructor_comment);
   if(!old||!['duplicate','multiple_results','shared'].includes(old.source_meta?.assessment_state))data.analytics_included=complete&&!notAssessed&&!!data.trainee_id;
  }
  const newId=old?.id||id();ops.push({table,action,id:newId,expectedVersion:old?.version,data});
  if(table==='trainees'&&!old){const b=state.batches.find(b=>b.id===data.batch_id);if(b?.start_date&&b?.end_date)ops.push({table:'attendance_10day',action:'create',id:id(),data:{trainee_id:newId,batch_id:b.id,period_start:b.start_date,period_end:b.end_date,days:Array(10).fill(false),report:'',report_kind:'template'}});}
 }
 return ops;
}
async function aiReport(repo,user,token,body){
 canWrite(user);if(process.env.AI_REPORTS_ENABLED!=='true'||!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)throw new ApiError(503,'AI reports are not configured. The built-in summary is available without an API key.');
 if(body.consent!==true)throw new ApiError(400,'Confirm that anonymized metrics may be sent to the AI provider.');if(!['attendance','assessment'].includes(body.kind)||!isId(body.traineeId))throw new ApiError(400,'Choose a trainee and report type.');
 if(!await repo.rate('ai:'+user.id,10,3600,token))throw new ApiError(429,'AI report limit reached (10 per user per hour).');
 const state=await repo.state(user,token);const trainee=state.trainees.find(t=>t.id===body.traineeId);if(!trainee)throw new ApiError(404,'Trainee not found.');
 const a=assessmentFor(state,trainee.id),r=checklistFor(state,trainee.id);
 if(body.kind==='assessment'&&!a)throw new ApiError(400,'Save an assessment first.');
 const metrics={type:body.kind,attendance:attendanceStats(state.daily_attendance.filter(r=>r.trainee_id===trainee.id)),checklist:r?checklist(r.days):null,assessment:a?{mapping:a.mapping,productKnowledge:a.product_knowledge,presentability:a.presentability,softSkills:a.soft_skills,...scores(a),outcome:a.assessment_outcome}:null};
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,store:false,max_output_tokens:650,instructions:'Write a clear, constructive training report of 130-180 words. Use only the supplied metrics. Never infer personality, motivation, employment suitability, or missing attendance. Distinguish manual late flags from calculated late arrivals. Checklist completion is not attendance. Mention practical next steps. Plain text only. Do not include names or contact details. An instructor will review the report.',input:JSON.stringify(metrics)}),signal:AbortSignal.timeout(45000)});
 if(!response.ok){console.error('AI provider response',response.status);throw new ApiError(502,'The AI provider could not complete the report. Your data has not been changed.');}
 const result=await response.json();const report=(result.output||[]).flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n').trim();if(!report)throw new ApiError(502,'The provider returned an empty report.');return {report,source:'ai'};
}
function validatePassword(password){if(typeof password!=='string'||password.length<12||password.length>256)throw new ApiError(400,'Use a password between 12 and 256 characters.');}
function validateSecret(token){if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))throw new ApiError(400,'Enter a valid setup or invitation code.');}
function validateAccount(body,withPassword=true){if(typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email.trim())||body.email.length>254||typeof body.full_name!=='string'||!body.full_name.trim()||body.full_name.length>160)throw new ApiError(400,'Enter your full name and a valid work email.');if(withPassword)validatePassword(body.password);}
export async function handleApi(request){
 const requestId=crypto.randomBytes(6).toString('hex');let outgoing=[];
 try{
  const url=new URL(request.url);const route=url.pathname.replace(/^\/api\/?/,'');const method=request.method;const repo=await repository();const cookies=cookiesOf(request);let token=cookies.red_session;
  if(!['GET','HEAD','OPTIONS'].includes(method))checkOrigin(request);
  if(route==='auth/login'&&method==='POST'){
   const body=await bodyOf(request);if(typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length>256)throw new ApiError(400,'Enter your email and password.');
   if(!await repo.rate('login:global',100,60)||!await repo.rate('login:'+crypto.createHash('sha256').update(body.email.trim().toLowerCase()).digest('hex'),10,60))throw new ApiError(429,'Too many sign-in attempts. Try again in one minute.');
   const result=await repo.login(body.email.trim().toLowerCase(),body.password);outgoing=[cookie('red_session',result.token)];if(result.refresh)outgoing.push(cookie('red_refresh',result.refresh,604800));return json({user:result.user},200,outgoing);
  }
  if(route==='auth/register')throw new ApiError(403,'RED Academy is private. Ask your administrator for an invitation.');
  if(route==='auth/setup'&&method==='POST'){
   if(!await repo.rate('setup',20,3600))throw new ApiError(429,'Too many setup attempts. Try again later.');
   const body=await bodyOf(request);validateAccount(body);validateSecret(body.token);
   return json(await repo.setup({...body,email:body.email.trim().toLowerCase(),full_name:body.full_name.trim()}),201);
  }
  if(route==='auth/accept-invitation'&&method==='POST'){
   if(!await repo.rate('accept-invitation',60,3600))throw new ApiError(429,'Too many invitation attempts. Try again later.');
   const body=await bodyOf(request);validateSecret(body.token);validatePassword(body.password);
   return json(await repo.acceptInvitation(body),201);
  }
  if(route==='auth/logout'&&method==='POST'){await repo.logout(token);return json({ok:true},200,[cookie('red_session','',0),cookie('red_refresh','',0)]);}
  const user=await repo.authenticate(token);
  if(!user&&route==='session'&&method==='GET')return json({user:null,mode:'private',setupRequired:await repo.needsSetup(),aiEnabled:false});
  if(!user)throw new ApiError(401,'Sign in to access RED Academy.');
  if(route==='session'&&method==='GET')return json({user,mode:'private',sync:'events',setupRequired:false,aiEnabled:process.env.AI_REPORTS_ENABLED==='true'&&!!process.env.OPENAI_API_KEY&&!!process.env.OPENAI_MODEL},200,outgoing);
  if(route==='auth/password'&&method==='POST'){
   if(!await repo.rate('password:'+user.id,5,900))throw new ApiError(429,'Too many password attempts. Try again in 15 minutes.');
   const body=await bodyOf(request);validatePassword(body.password);if(typeof body.currentPassword!=='string'||body.currentPassword.length>256)throw new ApiError(400,'Enter your current password.');
   const result=await repo.changePassword(user,body.currentPassword,body.password);events.emit('change');return json(result,200,[cookie('red_session','',0)]);
  }
  if(route==='invitations'&&method==='GET'){admin(user);return json(await repo.invitations(),200,outgoing);}
  if(route==='invitations'&&method==='POST'){
   admin(user);const body=await bodyOf(request);validateAccount(body,false);if(!['admin','instructor','viewer'].includes(body.role))throw new ApiError(400,'Choose an access role.');
   if(!await repo.rate('invite:'+user.id,30,3600))throw new ApiError(429,'Invitation limit reached. Try again later.');
   const invite=await repo.invite({...body,email:body.email.trim().toLowerCase(),full_name:body.full_name.trim()},user);events.emit('change');
   return json({...invite,url:(process.env.APP_URL||url.origin).replace(/\/$/,'')+'/#/join/'+invite.token},201,outgoing);
  }
  if(route==='invitations'&&method==='DELETE'){
   admin(user);const body=await bodyOf(request);if(!isId(body.id))throw new ApiError(400,'Choose an invitation.');
   const result=await repo.revokeInvitation(body.id,user);events.emit('change');return json(result,200,outgoing);
  }
  if(route==='import/sources'&&method==='GET'){
   const batch=url.searchParams.get('batch')||'',kind=url.searchParams.get('kind')||'',disposition=url.searchParams.get('disposition')||'',q=(url.searchParams.get('q')||'').slice(0,200),page=Number(url.searchParams.get('page')||1);
   if(batch&&!isId(batch)||kind&&!['batches','trainees','daily','checklists','assessments'].includes(kind)||disposition&&!['imported','consolidated','excluded_demo','excluded_empty'].includes(disposition)||!Number.isInteger(page)||page<1||page>10000)throw new ApiError(400,'Invalid source filter.');
   return json(await repo.sourceList({batch,kind,disposition,q,page}),200,outgoing);
  }
  if(route.startsWith('import/source/')&&method==='GET'){
   const sourceId=route.slice('import/source/'.length);if(!/^[a-f0-9]{32}$/.test(sourceId))throw new ApiError(400,'Invalid source identifier.');
   return json(await repo.sourceRecord(sourceId),200,outgoing);
  }
  if(route==='import/review'&&method==='PATCH'){
   admin(user);const body=await bodyOf(request);if(!isId(body.id)||typeof body.note!=='string'||body.note.length>3000)throw new ApiError(400,'Enter a valid review note.');
   const result=await repo.acknowledgeReview(body.id,body.note.trim(),user);events.emit('change');return json(result,200,outgoing);
  }
  if(route==='state'&&method==='GET')return json(await repo.state(user,token),200,outgoing);
  if(route==='mutate'&&method==='POST'){const body=await bodyOf(request);const state=await repo.state(user,token);const ops=prepareOperations(body,state,user);const records=await repo.commit(ops,user,token);events.emit('change');return json({records},200,outgoing);}
  if(route==='ai'&&method==='POST')return json(await aiReport(repo,user,token,await bodyOf(request)),200,outgoing);
  if(route==='users'&&method==='GET'){admin(user);return json(await repo.users(token),200,outgoing);}
  if(route==='users'&&method==='PATCH'){admin(user);const body=await bodyOf(request);if(!isId(body.id)||!['admin','instructor','viewer'].includes(body.role)||typeof body.active!=='boolean')throw new ApiError(400,'Invalid user permissions.');const result=await repo.updateUser(body.id,{role:body.role,active:body.active},user,token);events.emit('change');return json(result,200,outgoing);}
  if(route==='events'&&method==='GET'){
   let cleanup;const stream=new ReadableStream({start(controller){let closed=false;const send=()=>{if(!closed)controller.enqueue(new TextEncoder().encode('data: {"event":"refresh"}\n\n'));};const timer=setInterval(async()=>{if(!await repo.authenticate(token)){cleanup?.();return;}if(!closed)controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));},20000);const listener=async()=>{if(await repo.authenticate(token))send();else cleanup?.();};events.on('change',listener);cleanup=()=>{if(closed)return;closed=true;clearInterval(timer);events.off('change',listener);try{controller.close();}catch{}};request.signal.addEventListener('abort',cleanup,{once:true});controller.enqueue(new TextEncoder().encode(': connected\n\n'));},cancel(){cleanup?.();}});
   return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'}});
  }
  throw new ApiError(404,'Endpoint not found.');
 }catch(e){if(!(e instanceof ApiError))console.error(`[${requestId}]`,e);return json({error:e instanceof ApiError?e.message:'An unexpected error occurred. No changes were confirmed.',requestId},e instanceof ApiError?e.status:500,outgoing);}
}
