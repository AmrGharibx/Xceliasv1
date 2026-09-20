import test,{after,before} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fixtures} from './fixtures.mjs';

const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-academy-photo-'));
process.env.DATABASE_MODE='sqlite';process.env.DATABASE_PATH=path.join(directory,'photos.db');process.env.APP_URL='http://localhost:3011';process.env.SEED_SAMPLE_DATA='false';delete process.env.APP_ENV;
const {handleApi,repository}=await import('../server/service.mjs');
let adminCookie='',viewerCookie='',trainee;
async function request(route,{method='GET',cookie='',body}={}){
 const headers=new Headers();if(cookie)headers.set('cookie',cookie);if(method!=='GET'){headers.set('Content-Type','application/json');headers.set('Origin',process.env.APP_URL);headers.set('X-Red-Request','1');}
 const response=await handleApi(new Request(process.env.APP_URL+'/api/'+route,{method,headers,...(method==='GET'?{}:{body:JSON.stringify(body??{})})}));
 const data=response.headers.get('content-type')?.includes('application/json')?await response.json():null;
 return {response,status:response.status,data,cookie:response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')};
}
before(async()=>{
 const repo=await repository();await repo.init();await repo.setup({token:repo.setupToken,email:'owner@example.test',full_name:'Owner',password:'Photo-Test-Password-123!'});
 const login=await request('auth/login',{method:'POST',body:{email:'owner@example.test',password:'Photo-Test-Password-123!'}});adminCookie=login.cookie;
 const rows=fixtures();repo.insert('companies',rows.company);repo.insert('batches',rows.batch);repo.insert('trainees',rows.trainee);trainee=rows.trainee;
 const owner=(await repo.authenticate(adminCookie.split('=',2)[1]));const invite=await repo.invite({email:'viewer@example.test',full_name:'Viewer',role:'viewer'},owner);await repo.acceptInvitation({token:invite.token,password:'Photo-Test-Password-123!'});
 viewerCookie=(await request('auth/login',{method:'POST',body:{email:'viewer@example.test',password:'Photo-Test-Password-123!'}})).cookie;
});
after(async()=>{(await repository()).close();fs.rmSync(directory,{recursive:true,force:true});});

test('trainee portrait endpoints require a signed-in writer to save a portrait',async()=>{
 const route=`trainees/${trainee.id}/photo`;
 assert.equal((await request(route)).status,401);
 const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlqK9sAAAAASUVORK5CYII=';
 assert.equal((await request(route,{method:'PUT',cookie:viewerCookie,body:{photo:image}})).status,403);
 const saved=await request(route,{method:'PUT',cookie:adminCookie,body:{photo:image}});
 assert.equal(saved.status,200);assert.equal(saved.data.ok,true);
 const photo=await request(route,{cookie:viewerCookie});
 assert.equal(photo.status,200);assert.equal(photo.response.headers.get('content-type'),'image/png');assert.equal(photo.response.headers.get('cache-control'),'no-store');assert.equal(photo.response.headers.get('x-content-type-options'),'nosniff');
 assert.deepEqual([...new Uint8Array(await photo.response.arrayBuffer())].slice(0,8),[137,80,78,71,13,10,26,10]);
 const state=await request('state',{cookie:adminCookie});assert.ok(!JSON.stringify(state.data).includes('iVBORw0KGgo'));
});

test('portrait validation rejects a mismatched image and supports private removal',async()=>{
 const route=`trainees/${trainee.id}/photo`;
 assert.equal((await request(route,{method:'PUT',cookie:adminCookie,body:{photo:'data:image/png;base64,/9j/2Q=='}})).status,400);
 assert.equal((await request(route,{method:'PUT',cookie:adminCookie,body:{photo:null}})).status,200);
 assert.equal((await request(route,{cookie:adminCookie})).status,404);
});
