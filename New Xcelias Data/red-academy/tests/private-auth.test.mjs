import test from 'node:test';
import assert from 'node:assert/strict';
import {SQLiteRepository,tokenHash} from '../server/sqlite.mjs';
import {TABLES} from '../public/modules/core.mjs';
const PASSWORD='Private-Test-Password-123!';
async function database(fn,{configured=true}={}){
 const repo=new SQLiteRepository(':memory:');const logger=console.log;
 try{
  console.log=()=>{};await repo.init();console.log=logger;
  let owner=null;
  if(configured){await repo.setup({token:repo.setupToken,email:'owner@example.test',full_name:'Test Owner',password:PASSWORD});owner=(await repo.users())[0];}
  await fn(repo,owner);
 }finally{console.log=logger;repo.close();}
}
const invitation=(repo,owner,changes={})=>repo.invite({email:'member@example.test',full_name:'Invited Member',role:'viewer',...changes},owner);
test('Fresh server has zero operational rows, no users, and a setup grant',()=>database(async repo=>{
 for(const table of [...TABLES,'audit_log','assessment_history','users','sessions','invitations'])assert.equal(repo.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0,table);
 assert.equal(await repo.needsSetup(),true);assert.match(repo.setupToken,/^[A-Za-z0-9_-]{43}$/);
 const stored=repo.db.prepare('SELECT token_hash FROM setup_grants').get();assert.notEqual(stored.token_hash,repo.setupToken);assert.equal(stored.token_hash,tokenHash(repo.setupToken));
},{configured:false}));
test('Old seed and bootstrap environment settings cannot create data or default accounts',async()=>{
 process.env.SEED_SAMPLE_DATA='true';process.env.BOOTSTRAP_ADMIN_EMAIL='old@example.test';process.env.BOOTSTRAP_ADMIN_PASSWORD=PASSWORD;
 try{await database(async repo=>{for(const t of [...TABLES,'users'])assert.equal(repo.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n,0);},{configured:false});}
 finally{delete process.env.SEED_SAMPLE_DATA;delete process.env.BOOTSTRAP_ADMIN_EMAIL;delete process.env.BOOTSTRAP_ADMIN_PASSWORD;}
});
test('Incorrect setup code creates no user',()=>database(async repo=>{
 await assert.rejects(repo.setup({token:'x'.repeat(43),email:'owner@example.test',full_name:'Owner',password:PASSWORD}),e=>e.status===403);
 assert.equal((await repo.users()).length,0);
},{configured:false}));
test('Expired setup code is rejected',()=>database(async repo=>{
 repo.db.prepare('UPDATE setup_grants SET expires_at=0').run();
 await assert.rejects(repo.setup({token:repo.setupToken,email:'owner@example.test',full_name:'Owner',password:PASSWORD}),e=>e.status===403);
},{configured:false}));
test('Weak setup password cannot create an administrator',()=>database(async repo=>{
 await assert.rejects(repo.setup({token:repo.setupToken,email:'owner@example.test',full_name:'Owner',password:'short'}),e=>e.status===400);
 assert.equal((await repo.users()).length,0);
},{configured:false}));
test('A valid setup creates only the chosen administrator, never company or trainee records',()=>database(async(repo,owner)=>{
 assert.equal(owner.email,'owner@example.test');assert.equal(owner.role,'admin');assert.equal(owner.active,true);
 assert.equal(await repo.needsSetup(),false);assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM setup_grants').get().n,0);
 for(const t of TABLES)assert.equal(repo.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n,0);
}));
test('Setup cannot be reused after configuration',()=>database(async repo=>{
 await assert.rejects(repo.setup({token:'x'.repeat(43),email:'other@example.test',full_name:'Other',password:PASSWORD}),e=>e.status===409);
 assert.equal((await repo.users()).length,1);
}));
test('Concurrent setup requests produce exactly one administrator',()=>database(async repo=>{
 const body={token:repo.setupToken,email:'owner@example.test',full_name:'Owner',password:PASSWORD};
 const results=await Promise.allSettled([repo.setup(body),repo.setup({...body,email:'other@example.test'})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await repo.users()).length,1);
},{configured:false}));
test('Only administrators can create membership invitations',()=>database(async(repo,owner)=>{
 for(const role of ['viewer','instructor'])await assert.rejects(invitation(repo,{...owner,role}),e=>e.status===403);
 assert.equal((await repo.invitations()).length,0);
}));
test('Invitation secrets are hashed and not returned in invitation lists',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner),rows=await repo.invitations();assert.equal(rows.length,1);
 assert.ok(!('token_hash' in rows[0]));assert.ok(!JSON.stringify(rows).includes(i.token));
 assert.equal(repo.db.prepare('SELECT token_hash FROM invitations').get().token_hash,tokenHash(i.token));
 assert.ok(i.expires_at>Date.now()+47*3600000);
}));
test('An invitation cannot replace an existing account',()=>database(async(repo,owner)=>{
 await assert.rejects(invitation(repo,owner,{email:owner.email}),e=>e.status===409);
}));
test('A fresh invitation does not create an account before activation',()=>database(async(repo,owner)=>{
 await invitation(repo,owner);assert.equal((await repo.users()).length,1);
 await assert.rejects(repo.login('member@example.test',PASSWORD),e=>e.status===401);
}));
test('An accepted invitation has the server-assigned identity and role',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);const result=await repo.acceptInvitation({token:i.token,password:PASSWORD,email:'attacker@example.test',role:'admin',full_name:'Changed'});
 assert.equal(result.email,'member@example.test');const u=(await repo.users()).find(u=>u.email===result.email);
 assert.equal(u.full_name,'Invited Member');assert.equal(u.role,'viewer');assert.equal(u.active,true);
 const signedIn=await repo.login(result.email,PASSWORD);assert.equal((await repo.authenticate(signedIn.token)).role,'viewer');
}));
test('An invitation works only once',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);await repo.acceptInvitation({token:i.token,password:PASSWORD});
 await assert.rejects(repo.acceptInvitation({token:i.token,password:PASSWORD}),e=>e.status===400);
 assert.equal((await repo.users()).length,2);
}));
test('Concurrent invitation redemption creates only one member',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);const results=await Promise.allSettled([repo.acceptInvitation({token:i.token,password:PASSWORD}),repo.acceptInvitation({token:i.token,password:PASSWORD})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await repo.users()).length,2);
}));
test('Expired invitations cannot be activated',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);repo.db.prepare('UPDATE invitations SET expires_at=0 WHERE id=?').run(i.id);
 await assert.rejects(repo.acceptInvitation({token:i.token,password:PASSWORD}),e=>e.status===400);
}));
test('Revoked invitations cannot be activated',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);await repo.revokeInvitation(i.id,owner);
 await assert.rejects(repo.acceptInvitation({token:i.token,password:PASSWORD}),e=>e.status===400);
}));
test('A non-administrator cannot revoke an invitation',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);await assert.rejects(repo.revokeInvitation(i.id,{...owner,role:'instructor'}),e=>e.status===403);
}));
test('Reissuing an invitation invalidates the previous link',()=>database(async(repo,owner)=>{
 const first=await invitation(repo,owner);const second=await invitation(repo,owner,{role:'instructor'});
 await assert.rejects(repo.acceptInvitation({token:first.token,password:PASSWORD}),e=>e.status===400);
 await repo.acceptInvitation({token:second.token,password:PASSWORD});assert.equal((await repo.users()).find(u=>u.email===second.email).role,'instructor');
}));
test('Short activation passwords leave the invitation unused',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);await assert.rejects(repo.acceptInvitation({token:i.token,password:'short'}),e=>e.status===400);
 assert.equal((await repo.invitations())[0].used_at,null);
}));
test('Login normalizes the email consistently',()=>database(async repo=>{
 const result=await repo.login(' OWNER@EXAMPLE.TEST ',PASSWORD);assert.equal(result.user.email,'owner@example.test');
}));
test('Changing a password requires the current password and revokes all old sessions',()=>database(async(repo,owner)=>{
 const a=await repo.login(owner.email,PASSWORD),b=await repo.login(owner.email,PASSWORD);
 await repo.changePassword(owner,PASSWORD,'New-Test-Password-456!');
 assert.equal(await repo.authenticate(a.token),null);assert.equal(await repo.authenticate(b.token),null);
 await assert.rejects(repo.login(owner.email,PASSWORD),e=>e.status===401);
 assert.equal((await repo.login(owner.email,'New-Test-Password-456!')).user.id,owner.id);
}));
test('Incorrect current password cannot modify account credentials',()=>database(async(repo,owner)=>{
 await assert.rejects(repo.changePassword(owner,'Incorrect-Password!','New-Test-Password-456!'),e=>e.status===403);
 assert.equal((await repo.login(owner.email,PASSWORD)).user.id,owner.id);
}));
test('Password changes cannot reuse the current password',()=>database(async(repo,owner)=>{
 await assert.rejects(repo.changePassword(owner,PASSWORD,PASSWORD),e=>e.status===400);
}));
test('Inactive membership blocks sign-in and existing sessions',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);await repo.acceptInvitation({token:i.token,password:PASSWORD});const login=await repo.login(i.email,PASSWORD);
 await repo.updateUser(login.user.id,{role:'viewer',active:false},owner);
 assert.equal(await repo.authenticate(login.token),null);await assert.rejects(repo.login(i.email,PASSWORD),e=>e.status===403);
}));
test('Expired sessions are rejected without reviving access',()=>database(async repo=>{
 const s=await repo.login('owner@example.test',PASSWORD);repo.db.prepare('UPDATE sessions SET expires_at=0').run();assert.equal(await repo.authenticate(s.token),null);
}));
test('Operational snapshots exclude access credentials and invitation secrets',()=>database(async(repo,owner)=>{
 const i=await invitation(repo,owner);const data=JSON.stringify(await repo.state(owner));
 for(const secret of ['password_hash','token_hash',i.token,'setup_grants','invitations'])assert.ok(!data.includes(secret));
}));
