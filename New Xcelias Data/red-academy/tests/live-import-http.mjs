/** Dependency-free real HTTP, SSE, persistence and backup checks.
 * Always uses temporary databases, never the operational workspace.
 * Run: node tests/live-http.mjs --results /tmp/red-http-results.json
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-import-http-'));
const checks=[];let child;
function check(name,value){assert.ok(value,name);checks.push(name);}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function start(database,production=false){
 const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
 const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const base=`http://localhost:${port}`,origin=production?'https://academy.example.test':base;
 const env={...process.env,PORT:String(port),HOST:'127.0.0.1',APP_URL:origin,APP_ENV:production?'production':'test',DATABASE_MODE:'sqlite',DATABASE_PATH:database,SEED_SAMPLE_DATA:'true',BOOTSTRAP_ADMIN_EMAIL:'ignored@example.test'};
 child=spawn(process.execPath,['server.mjs'],{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';
 child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
 for(let i=0;i<100;i++){
  if(child.exitCode!==null)throw new Error('Test server failed: '+output.replace(/[A-Za-z0-9_-]{43}/g,'[redacted]'));
  try{await fetch(base+'/api/session');break;}catch{await delay(50);}
 }
 return {base,origin,env,code:output.match(/Setup code: ([A-Za-z0-9_-]{43})/)?.[1]};
}
async function stop(){if(!child)return;child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));child=undefined;}
function client(server){let cookie='';return {async call(route,method='GET',body,headers={}){
 const r=await fetch(server.base+'/api/'+route,{method,headers:{Origin:server.origin,'X-Red-Request':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 if(r.headers.getSetCookie().some(v=>v.startsWith('red_session=')))cookie=r.headers.getSetCookie().find(v=>v.startsWith('red_session=')).split(';')[0];
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,headers:r.headers,data};
 },get cookie(){return cookie;}};}
try{
 const database=path.join(temp,'imported.db');fs.copyFileSync(path.join(root,'data/red-academy.db'),database);
 const access=new DatabaseSync(database);access.exec('DELETE FROM sessions; DELETE FROM invitations; DELETE FROM setup_grants; DELETE FROM users;');access.close();
 let server=await start(database),admin=client(server),anon=client(server),r;
 let db=new DatabaseSync(database,{readOnly:true});const sourceId=db.prepare('SELECT id FROM source_records WHERE kind=? LIMIT 1').get('assessments').id;db.close();
 for(const route of ['state','import/sources','import/source/'+sourceId]){r=await anon.call(route);check('Anonymous imported endpoint blocked: '+route,r.status===401);}
 for(const target of ['/data/red-academy.db','/data/notion-reconciliation.json','/docs/IMPORT_REPORT.md']){r=await fetch(server.base+target);check('Private import file not statically served: '+target,r.status===404);}
 const account={token:server.code,email:'import-owner@example.test',full_name:'Import Test Owner',password:'Temporary-Import-Password-123!'};
 r=await anon.call('auth/setup','POST',account);check('Imported account-free database accepts private owner setup',r.status===201);
 r=await admin.call('auth/login','POST',{email:account.email,password:account.password});check('Owner signs in to populated database',r.status===200);
 r=await admin.call('state');let state=r.data;
 const expected={companies:55,batches:42,trainees:903,daily_attendance:2606,attendance_10day:264,assessments:847};
 for(const [t,n] of Object.entries(expected))check('Full real HTTP snapshot includes '+t+' = '+n,state[t].length===n);
 check('Snapshot includes review and provenance summary, not raw archive or accounts',state.import_reviews.length===153&&state.import_runs[0].summary.source_record_counts.daily===2705&&!Object.hasOwn(state,'source_records')&&!Object.hasOwn(state,'users'));
 r=await admin.call('import/sources');check('Source archive is paginated: 4815 records, 25 per page',r.status===200&&r.data.total===4815&&r.data.rows.length===25);
 const first=r.data.rows.map(x=>x.id);r=await admin.call('import/sources?page=2');check('Source page 2 returns distinct records',r.data.rows.every(x=>!first.includes(x.id)));
 r=await admin.call('import/sources?kind=assessments');check('Assessment source filter includes all 897 source pages',r.status===200&&r.data.total===897);
 r=await admin.call('import/sources?disposition=excluded_demo');check('Excluded demo records remain archived, not operational',r.status===200&&r.data.total===59);
 for(const filter of ['kind=users','page=-1','batch=not-a-uuid']){r=await admin.call('import/sources?'+filter);check('Malformed import filter rejected: '+filter,r.status===400);}
 r=await admin.call('import/source/'+sourceId);const original=r.data;check('Private source detail contains original Markdown, relations and digest',r.status===200&&original.raw.startsWith('#')&&original.sha256.length===64&&typeof original.relations==='object');
 r=await admin.call('invitations','POST',{email:'import-viewer@example.test',full_name:'Import Test Viewer',role:'viewer'});const inv=r.data;
 r=await anon.call('auth/accept-invitation','POST',{token:inv.token,password:account.password});const viewer=client(server);await viewer.call('auth/login','POST',{email:'import-viewer@example.test',password:account.password});
 r=await viewer.call('import/source/'+sourceId);check('Authorized RED viewer can inspect original source',r.status===200);
 const review=state.import_reviews.find(x=>x.status==='open');r=await viewer.call('import/review','PATCH',{id:review.id,note:'Denied test'});check('Viewer cannot acknowledge source reviews',r.status===403);
 const assessment=state.assessments.find(x=>x.mapping===null||x.product_knowledge===null||x.presentability===null||x.soft_skills===null);
 const abort=new AbortController(),stream=await fetch(server.base+'/api/events',{headers:{Cookie:admin.cookie},signal:abort.signal}),reader=stream.body.getReader();await reader.read();const waiting=reader.read();
 r=await admin.call('mutate','POST',{table:'assessments',action:'update',id:assessment.id,expectedVersion:assessment.version,data:{...assessment,instructor_comment:assessment.instructor_comment+'\nQA persistence check.'}});check('Partial imported assessment saves over real HTTP without invented scores',r.status===200&&['mapping','product_knowledge','presentability','soft_skills'].every(k=>r.data.records[0][k]===assessment[k]));
 const event=await Promise.race([waiting,delay(3000).then(()=>{throw new Error('Imported SSE event timed out');})]);check('Real SSE refresh follows historical record update',new TextDecoder().decode(event.value).includes('refresh'));abort.abort();await reader.cancel().catch(()=>{});
 r=await admin.call('import/review','PATCH',{id:review.id,note:'Reviewed in isolated HTTP test.'});check('Admin acknowledgement succeeds without replacing source facts',r.status===200);
 r=await admin.call('import/source/'+sourceId);check('Archived source is unchanged after operational writes',r.data.raw===original.raw&&r.data.sha256===original.sha256);
 const backup=path.join(temp,'imported-backup.db');const saved=spawnSync(process.execPath,['scripts/backup.mjs',backup],{cwd:root,env:server.env,encoding:'utf8'});check('Full imported database backup succeeds',saved.status===0);
 db=new DatabaseSync(backup,{readOnly:true});check('Backup includes every original source page and operational batch',db.prepare('SELECT COUNT(*) n FROM source_records').get().n===4815&&db.prepare('SELECT COUNT(*) n FROM batches').get().n===42);check('Backup includes new assessment history and valid foreign keys',db.prepare('SELECT COUNT(*) n FROM assessment_history').get().n===1&&db.prepare('PRAGMA foreign_key_check').all().length===0);db.close();
 await stop();server=await start(backup);admin=client(server);await admin.call('auth/login','POST',{email:account.email,password:account.password});r=await admin.call('state');check('Restored imported backup signs in and preserves all six entity totals',r.status===200&&Object.entries(expected).every(([t,n])=>r.data[t].length===n));check('Restored backup retains reviewed status and partial-score edit',r.data.import_reviews.find(x=>x.id===review.id).status==='acknowledged'&&r.data.assessments.find(x=>x.id===assessment.id).instructor_comment.endsWith('QA persistence check.'));
 const result={ok:true,checks:checks.length,check_names:checks,limitations:['Actual HTTP, SSE and SQLite backup tested on an isolated copy, not a hosted TLS origin.']};const flag=process.argv.indexOf('--results');if(flag>=0)fs.writeFileSync(process.argv[flag+1],JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await stop();fs.rmSync(temp,{recursive:true,force:true});}
