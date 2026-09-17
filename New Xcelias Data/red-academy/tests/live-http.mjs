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
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'red-private-http-'));
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
 const database=path.join(temp,'workspace.db');let server=await start(database);let admin=client(server),anon=client(server);
 let r=await anon.call('session');check('Fresh HTTP session requires setup and reveals no user',r.data.setupRequired&&r.data.user===null);
 for(const route of ['state','users','invitations','events']){r=await anon.call(route);check('Anonymous '+route+' is blocked',r.status===401);}
 r=await anon.call('auth/register','POST',{});check('Public signup is disabled',r.status===403);
 const shell=await fetch(server.base+'/');const html=await shell.text();
 check('HTML is served without personal records',shell.status===200&&!html.includes('QA Enrollment'));
 check('Private shell is not browser-cached',shell.headers.get('cache-control')==='no-store');
 check('Security headers include CSP, frame denial and no indexing',!!shell.headers.get('content-security-policy')&&shell.headers.get('x-frame-options')==='DENY'&&shell.headers.get('x-robots-tag').includes('noindex'));
 for(const target of ['/.env','/server/schema.sql','/data/red-academy.db','/demo/RED-Academy-Demo.html']){const response=await fetch(server.base+target);check('Private/static path blocked: '+target,response.status===404);}
 const account={token:server.code,email:'owner@example.test',full_name:'HTTP Owner',password:'Temporary-HTTP-Password-123!'};
 r=await anon.call('auth/setup','POST',account,{Origin:'https://not-your-academy.example'});check('Wrong Origin rejected before setup',r.status===403);
 r=await anon.call('auth/setup','POST',account,{'X-Red-Request':'0'});check('Missing write verification header rejected',r.status===403);
 r=await anon.call('auth/setup','POST',account);check('Valid first-owner setup succeeds over real HTTP',r.status===201);
 r=await anon.call('auth/setup','POST',account);check('Setup cannot be repeated',r.status===409);
 r=await admin.call('auth/login','POST',{email:account.email,password:account.password});check('Password login creates server session',r.status===200);
 check('Session cookie is HttpOnly, SameSite and scoped',r.headers.get('set-cookie').includes('HttpOnly')&&r.headers.get('set-cookie').includes('SameSite=Lax')&&r.headers.get('set-cookie').includes('Path=/'));
 r=await admin.call('state');check('Fresh private workspace has no seeded companies or records despite legacy flags',['companies','batches','trainees','daily_attendance','attendance_10day','assessments','assessment_history'].every(t=>r.data[t].length===0));
 check('Workspace snapshot excludes authentication secrets',!JSON.stringify(r.data).includes('password_hash')&&!Object.hasOwn(r.data,'users')&&!Object.hasOwn(r.data,'invitations'));
 check('Workspace API is no-store',r.headers.get('cache-control')==='no-store');
 r=await admin.call('mutate','POST','{broken');check('Malformed JSON is rejected',r.status===400);
 r=await admin.call('mutate','POST',{table:'users',action:'create',data:{role:'admin'}});check('Master mutation cannot create user or access tables',r.status===400);
 r=await admin.call('invitations','POST',{email:'viewer@example.test',full_name:'HTTP Viewer',role:'viewer'});const invite=r.data;
 check('Invitation URL uses the configured origin',r.status===201&&invite.url.startsWith(server.origin+'/#/join/'));
 r=await admin.call('invitations');check('Invitation lists do not expose token or hash',!Object.hasOwn(r.data[0],'token')&&!Object.hasOwn(r.data[0],'token_hash'));
 r=await anon.call('auth/accept-invitation','POST',{token:invite.token,password:account.password,role:'admin',email:'attacker@example.test'});check('Invitation accepts its intended account',r.status===201&&r.data.email==='viewer@example.test');
 const viewer=client(server);r=await viewer.call('auth/login','POST',{email:'viewer@example.test',password:account.password});const viewerId=r.data.user.id;
 check('Tampered invitation role cannot elevate access',r.data.user.role==='viewer');
 r=await viewer.call('mutate','POST',{table:'companies',action:'create',data:{name:'Denied'}});check('Read-only user write blocked over HTTP',r.status===403);
 r=await viewer.call('users');check('Read-only user cannot manage team',r.status===403);
 const abort=new AbortController();const stream=await fetch(server.base+'/api/events',{headers:{Cookie:admin.cookie},signal:abort.signal});const reader=stream.body.getReader();
 check('Native HTTP SSE connects with authenticated cookie',stream.headers.get('content-type').includes('text/event-stream')&&new TextDecoder().decode((await reader.read()).value).includes('connected'));
 const waiting=reader.read();
 r=await admin.call('mutate','POST',{table:'companies',action:'create',data:{name:'HTTP QA Organization'}});
 check('Authenticated mutation persists to server',r.status===200&&r.data.records[0].name==='HTTP QA Organization');
 const event=await Promise.race([waiting,delay(2000).then(()=>{throw new Error('SSE update timed out');})]);
 check('Real SSE delivers a post-mutation update',new TextDecoder().decode(event.value).includes('refresh'));
 abort.abort();await reader.cancel().catch(()=>{});
 r=await admin.call('users','PATCH',{id:viewerId,role:'viewer',active:false});check('Administrator can deactivate invited team member',r.status===200);
 r=await viewer.call('state');check('Deactivation revokes existing session immediately',r.status===401);
 const backup=path.join(temp,'verified-backup.db');
 let maintenance=spawnSync(process.execPath,['scripts/backup.mjs',backup],{cwd:root,env:server.env,encoding:'utf8'});
 check('Online SQLite backup command succeeds',maintenance.status===0&&fs.existsSync(backup));
 let db=new DatabaseSync(backup,{readOnly:true});
 check('Backup passes SQLite integrity check',db.prepare('PRAGMA integrity_check').get().integrity_check==='ok');
 check('Backup contains accounts and saved company',db.prepare('SELECT COUNT(*) AS n FROM users').get().n===2&&db.prepare('SELECT COUNT(*) AS n FROM companies').get().n===1);db.close();
 check('Backup is owner-only on POSIX',process.platform==='win32'||(fs.statSync(backup).mode&0o777)===0o600);
 maintenance=spawnSync(process.execPath,['scripts/backup.mjs',backup],{cwd:root,env:server.env,encoding:'utf8'});check('Backup cannot silently overwrite a previous backup',maintenance.status!==0);
 maintenance=spawnSync(process.execPath,['scripts/data-status.mjs'],{cwd:root,env:server.env,encoding:'utf8'});check('Read-only status reports actual table counts',maintenance.status===0&&JSON.parse(maintenance.stdout).counts.companies===1);
 await stop();server=await start(database);admin=client(server);
 r=await admin.call('auth/login','POST',{email:account.email,password:account.password});r=await admin.call('state');check('Saved data persists after process restart',r.status===200&&r.data.companies.length===1);
 await stop();const restored=path.join(temp,'restored.db');fs.copyFileSync(backup,restored);server=await start(restored);admin=client(server);
 r=await admin.call('auth/login','POST',{email:account.email,password:account.password});r=await admin.call('state');check('Backup restores a usable workspace on an isolated instance',r.status===200&&r.data.companies.length===1);
 maintenance=spawnSync(process.execPath,['scripts/reset-password.mjs'],{cwd:root,env:{...server.env,RESET_EMAIL:account.email,RESET_PASSWORD:'Recovered-HTTP-Password-456!'},encoding:'utf8'});check('Owner password recovery command succeeds',maintenance.status===0);
 r=await admin.call('state');check('Maintenance password reset revokes old sessions',r.status===401);
 r=await admin.call('auth/login','POST',{email:account.email,password:'Recovered-HTTP-Password-456!'});check('Recovered password signs in without changing role',r.status===200&&r.data.user.role==='admin');
 await stop();server=await start(restored,true);admin=client(server);
 r=await admin.call('auth/login','POST',{email:account.email,password:'Recovered-HTTP-Password-456!'});check('HTTPS production configuration sets Secure cookie',r.status===200&&r.headers.get('set-cookie').includes('; Secure'));
 check('HTTPS production configuration emits HSTS',r.headers.get('strict-transport-security')==='max-age=31536000');
 await stop();
 const bad=spawnSync(process.execPath,['server.mjs'],{cwd:root,env:{...server.env,APP_URL:'http://localhost:3000',APP_ENV:'production'},encoding:'utf8'});check('Production refuses HTTP-only APP_URL',bad.status!==0&&bad.stderr.includes('HTTPS'));
 const result={suite:'Live HTTP, native SSE, persistence and recovery',passed:checks.length,failed:0,checks,limitations:['Secure cookie and HSTS configuration verified over a loopback proxy simulation, not a live TLS certificate deployment.']};
 const flag=process.argv.indexOf('--results');if(flag>=0){const file=process.argv[flag+1];fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify(result,null,2));
}finally{await stop();fs.rmSync(temp,{recursive:true,force:true});}
