import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {id} from '../public/modules/core.mjs';
import {liveRoster,checkedLiveMappings,liveJoinIdentity} from '../server/activity-live-roster.mjs';
import {activityProfileMarkup} from '../public/modules/activity-profile.mjs';

const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'red-live-roster-'));
process.env.DATABASE_MODE='sqlite';process.env.DATABASE_PATH=path.join(temporary,'test.db');
process.env.APP_URL='http://localhost:3000';process.env.APP_ENV='test';
const {handleApi,repository}=await import('../server/service.mjs');
let repo,owner,cookies={},batch,otherBatch,roster=[],outside,stopped,room,deck,original;
const seats=[];
async function request(route,body,role,method){
 const headers=new Headers();if(role)headers.set('cookie',cookies[role]);
 if(body!==undefined){headers.set('content-type','application/json');headers.set('origin',process.env.APP_URL);headers.set('x-red-request','1');}
 const response=await handleApi(new Request(process.env.APP_URL+'/api/'+route,{method:method||(body===undefined?'GET':'POST'),headers,...(body===undefined?{}:{body:JSON.stringify(body)})}));
 return {status:response.status,data:await response.json(),cookie:response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')};
}
before(async()=>{
 repo=await repository();await repo.setup({token:repo.setupToken,email:'owner@example.test',full_name:'Owner',password:'Live-Roster-Test-Password!'});
 owner=repo.db.prepare('SELECT * FROM users WHERE email=?').get('owner@example.test');
 for(const role of ['instructor','viewer'])repo.insert('users',{id:id(),email:role+'@example.test',full_name:role,password_hash:owner.password_hash,role,active:1,created_at:new Date().toISOString()});
 for(const role of ['owner','instructor','viewer'])cookies[role]=(await request('auth/login',{email:role+'@example.test',password:'Live-Roster-Test-Password!'})).cookie;
 const stamp=new Date().toISOString(),company={id:id(),name:'Class Company',created_at:stamp,updated_at:stamp};repo.insert('companies',company);
 batch={id:id(),batch_name:'40-person class',status:'Active',start_date:'2026-10-01',end_date:'2026-10-01',session_dates:['2026-10-01'],capacity:41,description:'40 active and one stopped enrollment',created_at:stamp,updated_at:stamp};repo.insert('batches',batch);
 otherBatch={...batch,id:id(),batch_name:'Another class'};repo.insert('batches',otherBatch);
 for(let i=0;i<42;i++){
  const trainee={id:id(),batch_id:i===40?otherBatch.id:batch.id,company_id:company.id,trainee_name:`Real Trainee ${String(i+1).padStart(2,'0')}`,email:`private-${i}@example.test`,phone:'private-phone',notes:'private-notes',enrollment_status:i===41?'Stopped Attending':'Active',created_at:stamp,updated_at:stamp};repo.insert('trainees',trainee);
  if(i<40)roster.push(trainee);else if(i===40)outside=trainee;else stopped=trainee;
 }
 repo.insert('assessments',{id:id(),trainee_id:roster[0].id,batch_id:batch.id,assessment_title:'Original final grade',mapping:4,product_knowledge:5,presentability:3,soft_skills:4,assessment_outcome:'Very Good',created_at:stamp,updated_at:stamp});
 repo.insert('daily_attendance',{id:id(),trainee_id:roster[0].id,batch_id:batch.id,date:'2026-10-01',status:'Present',created_at:stamp,updated_at:stamp});
 original=await repo.state(owner);
 deck=(await request('activities/facilitator-deck',undefined,'owner')).data.activities.find(item=>item.id==='quiz-new-cairo');
 const created=await request('activities/live/create',{activity_id:deck.id,competition_mode:'individuals',timer_duration:0,batch_id:batch.id},'owner');assert.equal(created.status,201,JSON.stringify(created.data));room=created.data;
});
after(async()=>{repo.close();fs.rmSync(temporary,{recursive:true,force:true});});

test('roster and mapping validation reject invalid targets, duplicate players and duplicate profile writes',()=>{
 assert.throws(()=>liveRoster({batch_id:batch.id,mode:'pulse'},original),{status:400});
 assert.throws(()=>liveRoster({batch_id:id()},original),{status:400});
 assert.throws(()=>liveJoinIdentity({trainee_id:outside.id},liveRoster({batch_id:batch.id},original)),{status:400});
 assert.throws(()=>liveJoinIdentity({nickname:'X',trainee_id:roster[0].id},null),{status:400});
 const player=id();assert.throws(()=>checkedLiveMappings({room_id:room.room_id,mappings:[{player_id:player,trainee_id:roster[0].id},{player_id:id(),trainee_id:roster[0].id}]}),{status:400});
 assert.throws(()=>checkedLiveMappings({room_id:room.room_id,mappings:[{player_id:player,trainee_id:null},{player_id:player,trainee_id:null}]}),{status:400});
});

test('Never Started trainees cannot join newly opened scored live activities',()=>{
 const noShow={id:id(),batch_id:batch.id,company_id:roster[0].company_id,trainee_name:'Never attended',enrollment_status:'Never Started'};
 const expanded={...original,trainees:[...original.trainees,noShow]};
 const allowed=liveRoster({batch_id:batch.id},expanded).trainees;
 assert.equal(allowed.length,40);
 assert.ok(!allowed.some(trainee=>trainee.id===noShow.id));
});

test('room roster contains exactly 40 eligible names, no contact details, grades or answer keys',async()=>{
 const response=await request('activities/live/info',{code:room.join_code});assert.equal(response.status,200);
 assert.equal(response.data.roster.trainees.length,40);
 assert.ok(response.data.roster.trainees.every(item=>Object.keys(item).sort().join(',')==='company,id,name'));
 const text=JSON.stringify(response.data);for(const secret of ['private-phone','private-notes','private-0@','Original final grade','"answer":','"questions":',outside.id,stopped.id])assert.ok(!text.includes(secret),secret);
 assert.equal((await request('activities/live/join',{code:room.join_code,nickname:'Wrong batch',trainee_id:outside.id})).status,400);
 assert.equal((await request('activities/live/join',{code:room.join_code,nickname:'No name'})).status,400);
});

test('40 trainees join in a burst, choose nicknames or their own names, and keep independent seats',async()=>{
 for(let i=0;i<40;i++){
  const result=await request('activities/live/join',{code:room.join_code,nickname:i?`Player ${i+1}`:'',trainee_id:roster[i===2?1:i].id});assert.equal(result.status,200,JSON.stringify(result.data));seats.push(result.data.seat_token);
  assert.equal(result.data.room.player.nickname,i?`Player ${i+1}`:roster[0].trainee_name);
  assert.ok(!JSON.stringify(result.data.room).includes('private-phone'));
 }
 const host=await request('activities/live/host?room_id='+room.room_id,undefined,'owner');assert.equal(host.data.participant_count,40);assert.equal(host.data.profile_linking.players.length,40);
});

test('only the hosting writable trainer can confirm a completed game; history remains private',async()=>{
 const body={room_id:room.room_id,mappings:(await repo.activityLiveHostState(room.room_id,owner.id)).profile_linking.players.map(player=>({player_id:player.player_id,trainee_id:player.trainee_id}))};
 // Resolve the deliberately duplicated claim first; identity is not trusted from a phone.
 const claimedPlayer=repo.db.prepare('SELECT id FROM activity_live_players WHERE room_id=? AND nickname=?').get(room.room_id,'Player 3');
 body.mappings.find(item=>item.player_id===claimedPlayer.id).trainee_id=roster[2].id;
 assert.equal((await request('activities/live/save-results',body)).status,401);
 assert.equal((await request('activities/live/save-results',body,'viewer')).status,403);
 assert.equal((await request('activities/live/save-results',body,'instructor')).status,403);
 assert.equal((await request('activities/live/save-results',body,'owner')).status,409);
 assert.equal((await request('activities/live/results?trainee_id='+roster[0].id)).status,401);
});

test('all 40 players score independently; missed rounds are explicit rather than invented attendance',async()=>{
 for(let round=0;round<deck.questions.length;round++){
  const question=deck.questions[round];
  for(let i=0;i<40;i++){
   if(i===39&&round>0)continue;
   const answer=await request('activities/live/answer',{seat_token:seats[i],choice:i===1&&round>0?(question.answer+1)%question.options.length:question.answer});assert.equal(answer.status,200,JSON.stringify(answer.data));
  }
  const reveal=await request('activities/live/reveal',{room_id:room.room_id},'owner');assert.equal(reveal.status,200);assert.equal(reveal.data.leaders.length,40);
  assert.equal((await request('activities/live/advance',{room_id:room.room_id},'owner')).status,200);
 }
 const host=(await request('activities/live/host?room_id='+room.room_id,undefined,'owner')).data;
 assert.equal(host.room.status,'Complete');assert.equal(host.profile_linking.players.find(p=>p.nickname==='Player 40').answered_count,1);
});

test('duplicate or cross-batch mappings cannot partially save results; stale rosters fail atomically',async()=>{
 const host=(await repo.activityLiveHostState(room.room_id,owner.id)).profile_linking;
 const mappings=host.players.map(player=>({player_id:player.player_id,trainee_id:roster[player.nickname.startsWith('Player ')?Number(player.nickname.slice(7))-1:0].id}));
 const duplicate=mappings.map((value,index)=>({...value,trainee_id:index===1?mappings[0].trainee_id:value.trainee_id}));
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings:duplicate},'owner')).status,400);
 const invalid=mappings.map((value,index)=>({...value,trainee_id:index===mappings.length-1?outside.id:value.trainee_id}));
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings:invalid},'owner')).status,409);
 repo.db.prepare('UPDATE batches SET archived_at=? WHERE id=?').run(new Date().toISOString(),batch.id);
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings},'owner')).status,409);
 repo.db.prepare('UPDATE batches SET archived_at=NULL WHERE id=?').run(batch.id);
 repo.db.prepare("UPDATE trainees SET enrollment_status='Stopped Attending' WHERE id=?").run(roster[39].id);
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings},'owner')).status,409);
 repo.db.prepare("UPDATE trainees SET enrollment_status='Active' WHERE id=?").run(roster[39].id);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM activity_live_profile_results').get().n,0);
});

test('trainer corrects a claim and saves once; profile accuracy rounds to two decimals and grades stay intact',async()=>{
 const host=(await repo.activityLiveHostState(room.room_id,owner.id)).profile_linking;
 const mappings=host.players.map(player=>({player_id:player.player_id,trainee_id:roster[player.nickname.startsWith('Player ')?Number(player.nickname.slice(7))-1:0].id}));
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings},'owner')).status,200);
 assert.equal((await request('activities/live/save-results',{room_id:room.room_id,mappings},'owner')).status,200);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM activity_live_profile_results').get().n,40);
 const good=(await request('activities/live/results?trainee_id='+roster[0].id,undefined,'viewer')).data.results[0];assert.equal(good.score,100);assert.equal(good.correct_count,9);
 assert.equal(good.earned_xp,900);assert.equal(good.session_date,null);
 const incomplete=(await request('activities/live/results?trainee_id='+roster[39].id,undefined,'owner')).data.results[0];assert.equal(incomplete.score,11.11);assert.equal(incomplete.answered_count,1);
 const corrected=(await request('activities/live/state',{seat_token:seats[2]})).data.profile;assert.equal(corrected.recorded,true);assert.equal(corrected.confirmed_name,roster[2].trainee_name);
 assert.equal(corrected.earned_xp,900);
 const state=await repo.state(owner);for(const table of ['batches','trainees','assessments','daily_attendance','attendance_10day'])assert.deepEqual(state[table],original[table],table);
 assert.equal((await request('activities/live/replay',{room_id:room.room_id},'owner')).status,409);
 assert.equal((await request('mutate',{table:'activity_live_profile_results',action:'delete',id:good.id,expectedVersion:1},'owner')).status,400);
 const markup=activityProfileMarkup([{...incomplete,title:'<img src=x onerror=alert(1)>',nickname:'<script>bad</script>'}]);assert.ok(markup.includes('11.11%'));assert.ok(!markup.includes('<img'));assert.ok(!markup.includes('<script>'));
});

test('confirmed profile history survives room expiry and cannot be fetched by an expired seat',async()=>{
 repo.db.prepare('UPDATE activity_live_rooms SET expires_at=? WHERE id=?').run('2020-01-01T00:00:00.000Z',room.room_id);repo.purgeExpiredActivityLiveRooms();
 assert.equal((await request('activities/live/state',{seat_token:seats[0]})).status,401);
 assert.equal((await request('activities/live/results?trainee_id='+roster[0].id,undefined,'owner')).data.results.length,1);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM activity_live_profile_results').get().n,40);
});

test('batch-linked team games keep per-player profile results and allow a trainer to exclude an unverified seat',async()=>{
 const created=(await request('activities/live/create',{activity_id:deck.id,competition_mode:'teams',teams:['First','Second'],timer_duration:0,batch_id:batch.id},'owner')).data;
 const a=(await request('activities/live/join',{code:created.join_code,nickname:'Verified',trainee_id:roster[0].id,team_no:1})).data;
 const b=(await request('activities/live/join',{code:created.join_code,nickname:'Unverified',trainee_id:roster[0].id,team_no:2})).data;
 for(const question of deck.questions){
  assert.equal((await request('activities/live/answer',{seat_token:a.seat_token,choice:question.answer})).status,200);
  assert.equal((await request('activities/live/reveal',{room_id:created.room_id},'owner')).status,200);
  assert.equal((await request('activities/live/advance',{room_id:created.room_id},'owner')).status,200);
 }
 const host=(await repo.activityLiveHostState(created.room_id,owner.id)).profile_linking;
 const mappings=host.players.map(player=>({player_id:player.player_id,trainee_id:player.nickname==='Verified'?roster[0].id:null}));
 assert.equal((await request('activities/live/save-results',{room_id:created.room_id,mappings},'owner')).status,200);
 assert.equal((await request('activities/live/state',{seat_token:a.seat_token})).data.profile.recorded,true);
 const excluded=(await request('activities/live/state',{seat_token:b.seat_token})).data.profile;assert.equal(excluded.reviewed,true);assert.equal(excluded.recorded,false);
 assert.equal((await request('activities/live/results?trainee_id='+roster[0].id,undefined,'owner')).data.results.length,2);
});

test('confirmed dated participation records attendance independent of accuracy, excludes idle seats, and awards XP once',async()=>{
 const created=(await request('activities/live/create',{activity_id:deck.id,competition_mode:'individuals',timer_duration:0,batch_id:batch.id},'owner')).data;
 const a=(await request('activities/live/join',{code:created.join_code,trainee_id:roster[4].id})).data;
 await request('activities/live/join',{code:created.join_code,trainee_id:roster[5].id});
 await request('activities/live/answer',{seat_token:a.seat_token,choice:(deck.questions[0].answer+1)%4});
 for(const question of deck.questions){await request('activities/live/reveal',{room_id:created.room_id},'owner');await request('activities/live/advance',{room_id:created.room_id},'owner');}
 const host=(await repo.activityLiveHostState(created.room_id,owner.id)).profile_linking,mappings=host.players.map(player=>({player_id:player.player_id,trainee_id:player.trainee_id}));
 assert.equal((await request('activities/live/save-results',{room_id:created.room_id,mappings,session_date:'2099-01-01'},'owner')).status,400);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM activity_live_profile_results WHERE source_room_id=?').get(created.room_id).n,0);
 const body={room_id:created.room_id,mappings,session_date:'2026-10-01'};
 assert.equal((await request('activities/live/save-results',body,'owner')).status,200);assert.equal((await request('activities/live/save-results',body,'owner')).status,200);
 const result=(await request('activities/live/state',{seat_token:a.seat_token})).data.profile;assert.equal(result.earned_xp,0);assert.equal(result.attendance_status,'Present');assert.equal(result.session_date,'2026-10-01');
 const attendance=repo.db.prepare('SELECT * FROM daily_attendance WHERE trainee_id=?').all(roster[4].id);assert.equal(attendance.length,1);assert.equal(attendance[0].arrival_time,null);assert.equal(attendance[0].is_late,0);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM daily_attendance WHERE trainee_id=?').get(roster[5].id).n,0);
 assert.deepEqual((await repo.state(owner)).assessments,original.assessments);
});

test('whole-assignment deletion is authorized/version-checked, recoverable, invalidates links and preserves the batch and records',async()=>{
 const assignment=await repo.createActivityAssignment({batch_id:batch.id,activity_id:deck.id,title:deck.title,instructions:'Delete only this assignment',due_date:null,trainee_ids:[roster[0].id,roster[1].id]},owner);
 const links=await repo.issueActivityLinks(assignment.id,owner),code=links.links[0].code;
 const before=await repo.state(owner),body={id:assignment.id,expected_version:assignment.version};
 assert.equal((await request('activities/delete',body,undefined,'DELETE')).status,401);
 assert.equal((await request('activities/delete',body,'viewer','DELETE')).status,403);
 assert.equal((await request('activities/delete',body,'instructor','DELETE')).status,403);
 assert.equal((await request('activities/delete',{...body,expected_version:100},'owner','DELETE')).status,409);
 assert.equal((await request('activities/delete',body,'owner','DELETE')).status,200);
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM activity_assignment_participants WHERE assignment_id=?').get(assignment.id).n,0);
 const recovery=repo.db.prepare('SELECT * FROM activity_assignment_deletions WHERE id=?').get(assignment.id);assert.equal(JSON.parse(recovery.snapshot).participants.length,2);
 assert.equal((await request('activities/delete',body,'owner','DELETE')).status,404);
 await assert.rejects(repo.openActivityLearner(code),{status:403});
 const after=await repo.state(owner);for(const table of ['batches','trainees','assessments','daily_attendance'])assert.deepEqual(after[table],before[table]);
 assert.equal((await request('mutate',{table:'activity_assignment_deletions',action:'delete',id:assignment.id,expectedVersion:1},'owner')).status,400);
});

test('assigned activity attendance requires staff confirmation, respects pre-existing absence and is idempotent',async()=>{
 const assignment=await repo.createActivityAssignment({batch_id:batch.id,activity_id:'rapid-fire',title:'Attendance fixture',instructions:'',due_date:null,trainee_ids:[roster[6].id,roster[7].id,roster[8].id]},owner);
 repo.db.prepare("UPDATE activity_assignment_participants SET status='Completed' WHERE assignment_id=? AND trainee_id<>?").run(assignment.id,roster[8].id);
 repo.insert('daily_attendance',{id:id(),trainee_id:roster[7].id,batch_id:batch.id,date:'2026-10-01',status:'Absent',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 const body={id:assignment.id,expected_version:1,session_date:'2026-10-01'};
 assert.equal((await request('activities/attendance',body)).status,401);assert.equal((await request('activities/attendance',body,'viewer')).status,403);
 assert.equal((await request('activities/attendance',{...body,session_date:'2026-09-25'},'owner')).status,400);
 const recorded=await request('activities/attendance',body,'owner');assert.equal(recorded.status,200,JSON.stringify(recorded.data));assert.equal(recorded.data.created,1);assert.equal(recorded.data.preserved,1);
 assert.equal((await request('activities/attendance',body,'owner')).data.created,0);
 assert.equal(repo.db.prepare('SELECT status FROM daily_attendance WHERE trainee_id=?').get(roster[7].id).status,'Absent');
 assert.equal(repo.db.prepare('SELECT COUNT(*) n FROM daily_attendance WHERE trainee_id=?').get(roster[8].id).n,0);
});
