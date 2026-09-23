// @ts-nocheck -- runtime validation is shared with the tested JavaScript app.
import {createHash,randomBytes,scrypt as nodeScrypt,timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';
import {promisify} from 'node:util';
import {assessmentFor,attendanceStats,checklist,checklistFor,emptyState,id,scores} from '../../../public/modules/core.mjs';
import {ApiError,isId} from '../../../server/validation.mjs';
import {prepareCloudOperations} from './operations.ts';

const scrypt=promisify(nodeScrypt);
const MAX_BODY=150000;
const PHOTO_BUCKET='red-academy-portraits';

class BackendError extends Error {
 constructor(code,status){super(code||'BACKEND_FAILURE');this.code=code||'';this.status=status;}
}

function runtimeSecretKey(){
 try{const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');return typeof keys?.default==='string'?keys.default:'';}catch{return '';}
}
function settings(){
 const url=Deno.env.get('SUPABASE_URL'),secretKey=Deno.env.get('ACADEMY_SUPABASE_SECRET_KEY')||runtimeSecretKey()||Deno.env.get('SUPABASE_SECRET_KEY')||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!secretKey)throw new Error('Cloud database configuration is unavailable.');
 const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Cloud database configuration is unavailable.');
 return {url:parsed.href.replace(/\/$/,''),secretKey,legacySecret:secretKey.startsWith('eyJ')};
}
function allowedOrigins(){
 const configured=(Deno.env.get('ACADEMY_ALLOWED_ORIGINS')||'').split(',').map(value=>value.trim()).filter(Boolean);
 if(!configured.length)throw new Error('Cloud origin configuration is unavailable.');
 const origins=new Set();
 for(const value of configured){const parsed=new URL(value);if(parsed.protocol!=='https:'||parsed.pathname!=='/'||parsed.search||parsed.hash)throw new Error('Cloud origin configuration is unavailable.');origins.add(parsed.origin);}
 return origins;
}
function appUrl(){
 const value=Deno.env.get('ACADEMY_APP_URL')||'';const parsed=new URL(value);
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('Cloud application URL is unavailable.');
 return parsed.href.replace(/\/$/,'');
}
function headersFor(request){
 const headers=new Headers({'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Vary':'Origin'});
 try{const origin=request.headers.get('origin');if(origin&&allowedOrigins().has(origin)){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, X-Red-Request');headers.set('Access-Control-Allow-Methods','GET, POST, PUT, PATCH, DELETE, OPTIONS');headers.set('Access-Control-Max-Age','600');}}catch{}
 return headers;
}
function json(request,body,status=200){return new Response(JSON.stringify(body),{status,headers:headersFor(request)});}
function checkOrigin(request){
 const origin=request.headers.get('origin');
 if(!origin||!allowedOrigins().has(origin)||request.headers.get('x-red-request')!=='1')throw new ApiError(403,'Request origin could not be verified. Open the app from its configured company address.');
}
function routeOf(request){
 const pathname=new URL(request.url).pathname;
 const marker='/academy/';const index=pathname.indexOf(marker);
 if(index>=0)return pathname.slice(index+marker.length);
 const path=pathname.replace(/^\/+/, '');return path==='academy'?'':path;
}
function tokenOf(request){
 const value=request.headers.get('authorization')||'';const match=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(value);return match?.[1]||null;
}
function tokenHash(token){return createHash('sha256').update(token).digest('hex');}
function safeToken(){return randomBytes(32).toString('base64url');}
function secretMatches(token,hash){if(typeof token!=='string'||token.length>256||typeof hash!=='string')return false;const actual=Buffer.from(tokenHash(token),'hex'),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);return `${salt}:${Buffer.from(hash).toString('hex')}`;}
async function verifyPassword(password,stored){try{const[salt,hash]=String(stored).split(':');const actual=Buffer.from(await scrypt(password,salt,64)),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}catch{return false;}}
async function bodyOf(request){const text=await request.text();if(text.length>MAX_BODY)throw new ApiError(413,'Request is too large.');try{const body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}catch{throw new ApiError(400,'Invalid JSON request.');}}
function validatePassword(password){if(typeof password!=='string'||password.length<12||password.length>256)throw new ApiError(400,'Use a password between 12 and 256 characters.');}
function validateSecret(token){if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))throw new ApiError(400,'Enter a valid setup or invitation code.');}
function validateAccount(body,withPassword=true){
 if(typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email.trim())||body.email.length>254||typeof body.full_name!=='string'||!body.full_name.trim()||body.full_name.length>160)throw new ApiError(400,'Enter your full name and a valid work email.');
 if(withPassword)validatePassword(body.password);
}
function canWrite(user){if(!['admin','instructor'].includes(user.role))throw new ApiError(403,'Your role is read-only.');}
function requireAdmin(user){if(user.role!=='admin')throw new ApiError(403,'Administrator access is required.');}
function databaseError(error){
 if(!(error instanceof BackendError))return error;
 const messages={
  RED_CONFLICT:[409,'This record changed in another session. Refresh and try again.'],RED_NOT_FOUND:[404,'Record not found.'],RED_DUPLICATE:[409,'A matching record already exists. Refresh the page before retrying.'],RED_LINKED:[409,'This record is linked to other data. Reassign the linked records first.'],RED_INVALID_RECORD:[400,'The record could not be saved. Check the supplied values.'],RED_INVALID_OPERATION:[400,'The requested change is not valid.'],RED_EMAIL_EXISTS:[409,'This email already has an account. Manage its existing access instead.'],RED_INVITATION_INVALID:[400,'This invitation is invalid, expired, or already used. Ask your company administrator for a new invitation.'],RED_INVITATION_USED:[409,'This invitation can no longer be used.'],RED_LAST_ADMIN:[400,'You cannot deactivate or demote the last administrator.'],RED_PASSWORD_CONFLICT:[409,'Your account changed. Sign in again before changing the password.'],RED_SETUP_USED:[409,'This workspace is already configured. Sign in with your company account.'],RED_SETUP_INVALID:[403,'The setup code is invalid or expired. Ask the server owner for the current code.']
 };
 const match=messages[error.code];return match?new ApiError(match[0],match[1]):new ApiError(error.status===404?404:500,'The company workspace could not complete that request. Please try again.');
}
async function backend(path,init={}){
 const {url,secretKey,legacySecret}=settings(),headers={apikey:secretKey,...(legacySecret?{Authorization:`Bearer ${secretKey}`}:{}),...(init.headers||{})};const response=await fetch(url+path,{...init,headers});
 if(!response.ok){const text=await response.text().catch(()=>''),code=/\bRED_[A-Z_]+\b/.exec(text)?.[0]||'';throw new BackendError(code,response.status);}
 return response;
}
function query(params){const result=new URLSearchParams();for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null)result.set(key,String(value));return result.toString();}
async function rows(table,params){const response=await backend(`/rest/v1/${table}?${query(params)}`,{headers:{Accept:'application/json'}});const data=await response.json();return Array.isArray(data)?data:[];}
async function row(table,params){return (await rows(table,{...params,limit:1}))[0]||null;}
async function insert(table,value){await backend(`/rest/v1/${table}`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify(value)});}
async function remove(table,params){await backend(`/rest/v1/${table}?${query(params)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});}
async function rpc(name,args){const response=await backend(`/rest/v1/rpc/${name}`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify(args)});return response.json();}
async function rate(key,limit,seconds){return (await rpc('red_rate_limit',{p_key:key,p_limit:limit,p_seconds:seconds}))===true;}
async function sessionStatus(token){
 if(!token)return {user:null,revision:null};
 const result=await rpc('red_session_status',{p_token_hash:tokenHash(token)}),revision=Number(result?.revision);return {user:result?.user||null,revision:Number.isInteger(revision)?revision:null};
}
async function requireUser(request){const token=tokenOf(request);if(!token)throw new ApiError(401,'Sign in to access the internal training system.');const status=await sessionStatus(token);if(!status.user)throw new ApiError(401,'Sign in to access the internal training system.');return {...status,token};}
async function needsSetup(){return !(await rows('users',{select:'id'})).length;}
function aiEnabled(){return Deno.env.get('AI_REPORTS_ENABLED')==='true'&&!!Deno.env.get('OPENAI_API_KEY')&&!!Deno.env.get('OPENAI_MODEL');}
async function workspaceState(user){
 const state=await rpc('red_workspace_state',{p_is_admin:user.role==='admin'});if(!state||typeof state!=='object')throw new BackendError('',500);
 state.batches?.sort((a,b)=>String(a.batch_name).localeCompare(String(b.batch_name),undefined,{numeric:true}));
 return {...emptyState(),...state};
}
function portraitOf(value){
 if(value===null)return null;
 if(typeof value!=='string')throw new ApiError(400,'Choose a JPEG, PNG, or WebP portrait.');
 const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
 if(!match||match[2].length%4!==0)throw new ApiError(400,'Choose a JPEG, PNG, or WebP portrait.');
 const bytes=Buffer.from(match[2],'base64');
 if(!bytes.length||bytes.length>80*1024)throw new ApiError(413,'Use a portrait smaller than 80 KB.');
 const valid=match[1]==='image/jpeg'?bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff:match[1]==='image/png'?bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])):bytes.length>=12&&bytes.subarray(0,4).equals(Buffer.from('RIFF'))&&bytes.subarray(8,12).equals(Buffer.from('WEBP'));
 if(!valid)throw new ApiError(400,'The portrait file does not match its image type.');
 return {mime_type:match[1],bytes};
}
function storagePath(path){return String(path).split('/').map(encodeURIComponent).join('/');}
async function aiReport(user,token,body){
 canWrite(user);if(!aiEnabled())throw new ApiError(503,'AI reports are not configured. The built-in summary is available without an API key.');
 if(body.consent!==true)throw new ApiError(400,'Confirm that the selected text or anonymized metrics may be sent to the AI provider.');
 if(body.kind==='polish-comment'){
  if(typeof body.comment!=='string'||!body.comment.trim()||body.comment.length>5000)throw new ApiError(400,'Enter an instructor comment of 1 to 5000 characters.');
  if(!await rate('ai-comment:'+user.id,10,3600))throw new ApiError(429,'AI comment-polish limit reached (10 per user per hour).');
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${Deno.env.get('OPENAI_API_KEY')}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL'),store:false,max_output_tokens:500,instructions:'Carefully polish the instructor-written training comment for clarity, grammar, and constructive professional tone. Preserve the instructor\'s meaning and every factual claim. Do not add a score, diagnosis, personality judgment, motivation claim, employment recommendation, or any fact not present in the draft. Do not address the trainee by name. Return only the revised comment as plain text; an instructor will review and decide whether to use it.',input:JSON.stringify({draft:body.comment.trim()})}),signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw new ApiError(502,'The AI provider could not polish the comment. Your saved data has not been changed.');
  const result=await response.json(),comment=(result.output||[]).flatMap(output=>output.content||[]).filter(content=>content.type==='output_text').map(content=>content.text).join('\n').trim();if(!comment)throw new ApiError(502,'The AI provider returned an empty comment.');return {comment,source:'ai'};
 }
 if(!['attendance','assessment'].includes(body.kind)||!isId(body.traineeId))throw new ApiError(400,'Choose a trainee and report type.');
 if(!await rate('ai:'+user.id,10,3600))throw new ApiError(429,'AI report limit reached (10 per user per hour).');
 const state=await workspaceState(user),trainee=state.trainees.find(record=>record.id===body.traineeId);if(!trainee)throw new ApiError(404,'Trainee not found.');
 const assessment=assessmentFor(state,trainee.id),attendance=checklistFor(state,trainee.id);if(body.kind==='assessment'&&!assessment)throw new ApiError(400,'Save an assessment first.');
 const metrics={type:body.kind,attendance:attendanceStats(state.daily_attendance.filter(record=>record.trainee_id===trainee.id)),checklist:attendance?checklist(attendance.days):null,assessment:assessment?{mapping:assessment.mapping,productKnowledge:assessment.product_knowledge,presentability:assessment.presentability,softSkills:assessment.soft_skills,...scores(assessment),outcome:assessment.assessment_outcome}:null};
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${Deno.env.get('OPENAI_API_KEY')}`,'Content-Type':'application/json'},body:JSON.stringify({model:Deno.env.get('OPENAI_MODEL'),store:false,max_output_tokens:650,instructions:'Write a clear, constructive training report of 130-180 words. Use only the supplied metrics. Never infer personality, motivation, employment suitability, or missing attendance. Distinguish manual late flags from calculated late arrivals. Checklist completion is not attendance. Mention practical next steps. Plain text only. Do not include names or contact details. An instructor will review the report.',input:JSON.stringify(metrics)}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new ApiError(502,'The AI provider could not complete the report. Your data has not been changed.');
 const result=await response.json(),report=(result.output||[]).flatMap(output=>output.content||[]).filter(content=>content.type==='output_text').map(content=>content.text).join('\n').trim();if(!report)throw new ApiError(502,'The AI provider returned an empty report.');return {report,source:'ai'};
}

async function handle(request){
 const requestId=randomBytes(6).toString('hex');
 try{
  const origin=request.headers.get('origin');if(origin&&!allowedOrigins().has(origin))throw new ApiError(403,'Request origin could not be verified. Open the app from its configured company address.');
  if(request.method==='OPTIONS'){if(!origin||!allowedOrigins().has(origin))throw new ApiError(403,'Request origin could not be verified.');return new Response(null,{status:204,headers:headersFor(request)});}
  if(!['GET','HEAD'].includes(request.method))checkOrigin(request);
  const route=routeOf(request),method=request.method;

  if(route==='auth/login'&&method==='POST'){
   const body=await bodyOf(request);if(typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length>256)throw new ApiError(400,'Enter your email and password.');
   const email=body.email.trim().toLowerCase();if(!await rate('login:global',100,60)||!await rate('login:'+tokenHash(email),10,60))throw new ApiError(429,'Too many sign-in attempts. Try again in one minute.');
   const user=await row('users',{select:'id,email,full_name,password_hash,role,active',email:`eq.${email}`}),dummy='00112233445566778899aabbccddeeff:'+ '0'.repeat(128);const correct=await verifyPassword(body.password,user?.password_hash||dummy);
   if(!user||!correct)throw new ApiError(401,'Email or password is incorrect.');if(!user.active)throw new ApiError(403,'Your company account is inactive. Contact your administrator.');
   await remove('sessions',{expires_at:`lte.${Date.now()}`});const token=safeToken();await insert('sessions',{token_hash:tokenHash(token),user_id:user.id,expires_at:Date.now()+12*3600*1000});
   await insert('audit_log',{id:id(),actor:user.email,action:'sign-in',entity:'users',entity_id:user.id,details:'Signed in to the internal training system.',created_at:new Date().toISOString()});
   return json(request,{token,user:{id:user.id,email:user.email,full_name:user.full_name,role:user.role,active:true}});
  }
  if(route==='auth/register')throw new ApiError(403,'This internal system requires an administrator invitation.');
  if(route==='auth/setup'&&method==='POST'){
   if(!await rate('setup',20,3600))throw new ApiError(429,'Too many setup attempts. Try again later.');const body=await bodyOf(request);validateAccount(body);validateSecret(body.token);
   return json(request,await rpc('red_bootstrap',{p_token_hash:tokenHash(body.token),p_email:body.email.trim().toLowerCase(),p_full_name:body.full_name.trim(),p_password_hash:await hashPassword(body.password)}),201);
  }
  if(route==='auth/accept-invitation'&&method==='POST'){
   if(!await rate('accept-invitation',60,3600))throw new ApiError(429,'Too many invitation attempts. Try again later.');const body=await bodyOf(request);validateSecret(body.token);validatePassword(body.password);
   return json(request,await rpc('red_accept_invitation',{p_token_hash:tokenHash(body.token),p_password_hash:await hashPassword(body.password)}),201);
  }
  if(route==='auth/logout'&&method==='POST'){const token=tokenOf(request);if(token)await remove('sessions',{token_hash:`eq.${tokenHash(token)}`});return json(request,{ok:true});}

  if(route==='session'&&method==='GET'){
   const status=await sessionStatus(tokenOf(request));if(!status.user)return json(request,{user:null,mode:'private',sync:'poll',revision:status.revision,setupRequired:await needsSetup(),aiEnabled:false});
   return json(request,{user:status.user,mode:'private',sync:'poll',revision:status.revision,setupRequired:false,aiEnabled:aiEnabled()});
  }
  const session=await requireUser(request),user=session.user;
  if(route==='sync'&&method==='GET')return json(request,{user,revision:session.revision});
  if(route==='auth/password'&&method==='POST'){
   if(!await rate('password:'+user.id,5,900))throw new ApiError(429,'Too many password attempts. Try again in 15 minutes.');const body=await bodyOf(request);validatePassword(body.password);if(typeof body.currentPassword!=='string'||body.currentPassword.length>256)throw new ApiError(400,'Enter your current password.');
   const account=await row('users',{select:'id,password_hash,active',id:`eq.${user.id}`});if(!account||!account.active||!await verifyPassword(body.currentPassword,account.password_hash))throw new ApiError(403,'Your current password is incorrect.');if(body.currentPassword===body.password)throw new ApiError(400,'Choose a different password.');
   await rpc('red_change_password',{p_user_id:user.id,p_old_hash:account.password_hash,p_new_hash:await hashPassword(body.password),p_actor:user.email});return json(request,{ok:true});
  }
  if(route==='invitations'&&method==='GET'){requireAdmin(user);return json(request,await rows('invitations',{select:'id,email,full_name,role,created_at,expires_at,used_at,revoked_at',order:'created_at.desc'}));}
  if(route==='invitations'&&method==='POST'){
   requireAdmin(user);const body=await bodyOf(request);validateAccount(body,false);if(!['admin','instructor','viewer'].includes(body.role))throw new ApiError(400,'Choose an access role.');if(!await rate('invite:'+user.id,30,3600))throw new ApiError(429,'Invitation limit reached. Try again later.');
   const token=safeToken(),invite=await rpc('red_create_invitation',{p_id:id(),p_email:body.email.trim().toLowerCase(),p_full_name:body.full_name.trim(),p_role:body.role,p_token_hash:tokenHash(token),p_invited_by:user.id,p_actor:user.email});
   return json(request,{...invite,token,url:`${appUrl()}/#/join/${token}`},201);
  }
  if(route==='invitations'&&method==='DELETE'){requireAdmin(user);const body=await bodyOf(request);if(!isId(body.id))throw new ApiError(400,'Choose an invitation.');await rpc('red_revoke_invitation',{p_id:body.id,p_actor:user.email});return json(request,{ok:true});}
  if(route==='import/sources'&&method==='GET'){
   const url=new URL(request.url),batch=url.searchParams.get('batch')||'',kind=url.searchParams.get('kind')||'',disposition=url.searchParams.get('disposition')||'',search=(url.searchParams.get('q')||'').slice(0,200),page=Number(url.searchParams.get('page')||1);
   if(batch&&!isId(batch)||kind&&!['batches','trainees','daily','checklists','assessments'].includes(kind)||disposition&&!['imported','consolidated','excluded_demo','excluded_empty'].includes(disposition)||!Number.isInteger(page)||page<1||page>10000)throw new ApiError(400,'Invalid source filter.');
   return json(request,await rpc('red_source_list',{p_batch:batch,p_kind:kind,p_disposition:disposition,p_query:search,p_page:page}));
  }
  if(route.startsWith('import/source/')&&method==='GET'){const sourceId=route.slice('import/source/'.length);if(!/^[a-f0-9]{32}$/.test(sourceId))throw new ApiError(400,'Invalid source identifier.');const source=await row('source_records',{select:'*',id:`eq.${sourceId}`});if(!source)throw new ApiError(404,'Original Notion record not found.');return json(request,source);}
  if(route==='import/review'&&method==='PATCH'){requireAdmin(user);const body=await bodyOf(request);if(!isId(body.id)||typeof body.note!=='string'||body.note.length>3000)throw new ApiError(400,'Enter a valid review note.');await rpc('red_acknowledge_review',{p_id:body.id,p_note:body.note.trim(),p_actor:user.email});return json(request,{ok:true});}
  if(route==='state'&&method==='GET')return json(request,await workspaceState(user));
  const portraitRoute=/^trainees\/([^/]+)\/photo$/.exec(route);
  if(portraitRoute){
   const traineeId=portraitRoute[1];if(!isId(traineeId))throw new ApiError(400,'Choose a valid trainee.');
   if(method==='GET'){
    const photo=await row('trainee_photos',{select:'object_path,mime_type,updated_at',trainee_id:`eq.${traineeId}`});if(!photo)throw new ApiError(404,'No trainee portrait was found.');
    const object=await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(photo.object_path)}`);const headers=headersFor(request);headers.set('Content-Type',photo.mime_type);headers.set('Content-Disposition','inline');return new Response(object.body,{status:200,headers});
   }
   if(method==='PUT'){
    canWrite(user);const body=await bodyOf(request),photo=portraitOf(body.photo),current=await row('trainee_photos',{select:'object_path',trainee_id:`eq.${traineeId}`});
    if(photo){const objectPath=`${traineeId}/portrait`;try{await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(objectPath)}`,{method:'POST',headers:{'Content-Type':photo.mime_type,'x-upsert':'true'},body:photo.bytes});const saved=await rpc('red_set_trainee_photo',{p_trainee_id:traineeId,p_object_path:objectPath,p_mime_type:photo.mime_type,p_actor:user.email});return json(request,saved);}catch(error){throw error;}}
    const saved=await rpc('red_set_trainee_photo',{p_trainee_id:traineeId,p_object_path:null,p_mime_type:null,p_actor:user.email});if(current?.object_path){try{await backend(`/storage/v1/object/${PHOTO_BUCKET}/${storagePath(current.object_path)}`,{method:'DELETE'});}catch{console.error('Academy portrait object cleanup could not be completed.');}}return json(request,saved);
   }
   throw new ApiError(404,'Endpoint not found.');
  }
  if(route==='mutate'&&method==='POST'){const body=await bodyOf(request),state=await workspaceState(user),operations=prepareCloudOperations(body,state,user),records=await rpc('red_commit',{p_operations:operations,p_actor:user.email});return json(request,{records});}
  if(route==='ai'&&method==='POST')return json(request,await aiReport(user,session.token,await bodyOf(request)));
  if(route==='users'&&method==='GET'){requireAdmin(user);return json(request,await rows('users',{select:'id,email,full_name,role,active,created_at',order:'created_at.asc'}));}
  if(route==='users'&&method==='PATCH'){requireAdmin(user);const body=await bodyOf(request);if(!isId(body.id)||!['admin','instructor','viewer'].includes(body.role)||typeof body.active!=='boolean')throw new ApiError(400,'Invalid user permissions.');await rpc('red_update_user_access',{p_target:body.id,p_role:body.role,p_active:body.active,p_actor:user.email});return json(request,{ok:true});}
  throw new ApiError(404,'Endpoint not found.');
 }catch(error){
  const safe=databaseError(error);if(safe instanceof ApiError)return json(request,{error:safe.message},safe.status);
  console.error(`Academy cloud request ${requestId} failed.`);return json(request,{error:'An unexpected error occurred. No changes were confirmed.',requestId},500);
 }
}

Deno.serve(handle);
