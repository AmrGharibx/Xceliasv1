// Optional real-Postgres (WASM) migration acceptance. In-memory only; no cloud credentials.
// node tests/live_roster_postgres.mjs /absolute/path/to/@electric-sql/pglite/dist/index.js
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {studioFacilitatorDeck} from '../server/activity-studio.mjs';
if(!process.argv[2])throw new Error('Pass the installed PGlite module path. This test never connects to Supabase.');
const {PGlite}=await import(pathToFileURL(process.argv[2]).href),db=new PGlite();
const read=name=>fs.readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
const schema=read('20260920190000_academy_cloud_schema.sql');
try{
 await db.exec('create role anon;create role authenticated;create role service_role;');
 for(const table of ['companies','batches','trainees','users','audit_log','daily_attendance']){
  const ddl=schema.match(new RegExp('create table if not exists public\\.'+table+' \\([\\s\\S]*?\\n\\);'))?.[0];assert.ok(ddl,table);await db.exec(ddl);
 }
 // Existing prerequisites introduced by the roster and reversible-archive migrations.
 await db.exec("alter table batches add column archived_at text;alter table trainees add column enrollment_status text not null default 'Active' check(enrollment_status in ('Active','Stopped Attending'));");
 await db.exec('alter table daily_attendance add column assessment_day boolean not null default false;');
 const assignmentsSchema=read('20260924120000_trainer_activities.sql');
 for(const table of ['activity_assignments','activity_assignment_participants']){const ddl=assignmentsSchema.match(new RegExp('create table if not exists public\\.'+table+' \\([\\s\\S]*?\\n\\);'))?.[0];assert.ok(ddl,table);await db.exec(ddl);}
 await db.exec('create table activity_session_plans(id text primary key,linked_assignment_id text references activity_assignments(id) on delete set null,version integer default 1,updated_at text);');
 await db.exec("create function public.red_now() returns text language sql as $$ select to_char(now() at time zone 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') $$;");
 for(const name of ['20260924160000_activity_live_rooms.sql','20260924180000_activity_live_four_teams.sql','20260925220000_activity_live_confidence.sql','20261001120000_live_activity_profile_results.sql','20261001140000_activity_outcomes_and_deletion.sql'])await db.exec(read(name));
 const owner=randomUUID(),batch=randomUUID(),stamp=new Date().toISOString(),room=randomUUID();
 await db.query('insert into users(id,email,full_name,password_hash,role,active,created_at) values($1,$2,$3,$4,$5,true,$6)',[owner,'trainer@example.test','Trainer','test-only','instructor',stamp]);
 await db.query('insert into batches(id,batch_name,status,start_date,end_date,session_dates,capacity,created_at,updated_at) values($1,$2,$3,$4,$4,$5::jsonb,40,$6,$6)',[batch,'40-person PG class','Active','2026-10-01',JSON.stringify(['2026-10-01']),stamp]);
 const roster=[],players=[];
 for(let i=0;i<40;i++){
  const trainee=randomUUID(),player=randomUUID();roster.push({id:trainee,name:`Trainee ${i+1}`,company:''});players.push({id:player,trainee_id:trainee,token_hash:(i+1).toString(16).padStart(64,'0')});
  await db.query('insert into trainees(id,trainee_name,batch_id,created_at,updated_at) values($1,$2,$3,$4,$4)',[trainee,`Trainee ${i+1}`,batch,stamp]);
 }
 const activity=studioFacilitatorDeck().find(item=>item.id==='quiz-new-cairo'),snapshot={...activity,competition_mode:'individuals',team_names:['Individuals'],roster:{batch_id:batch,batch_name:'40-person PG class',trainees:roster}};
 const mutate=(action,payload)=>db.query('select red_activity_live_mutate($1,$2::jsonb)',[action,JSON.stringify(payload)]);
 await mutate('create',{id:room,owner_id:owner,code_hash:'a'.repeat(64),activity_id:activity.id,deck_snapshot:snapshot,team_one:'Individuals',team_two:'Individuals',timer_duration:0,expires_at:new Date(Date.now()+3600000).toISOString()});
 await assert.rejects(db.query('select red_activity_live_roster_join($1::jsonb)',[JSON.stringify({code_hash:'a'.repeat(64),player_id:randomUUID(),token_hash:'b'.repeat(64),nickname:'Forged',team_no:1,trainee_id:randomUUID()})]),/RED_ACTIVITY_LIVE_ROSTER/);
 for(let i=0;i<40;i++)await db.query('select red_activity_live_roster_join($1::jsonb)',[JSON.stringify({code_hash:'a'.repeat(64),player_id:players[i].id,token_hash:players[i].token_hash,nickname:`Player ${i+1}`,team_no:1,trainee_id:roster[i===1?0:i].id})]);
 const mappings=players.map(player=>({player_id:player.id,trainee_id:player.trainee_id}));
 const save=(values,date='2026-10-01')=>db.query('select red_activity_live_save_outcomes($1,$2,$3::jsonb,$4)',[room,owner,JSON.stringify(values),date]);
 await assert.rejects(save(mappings),/RED_ACTIVITY_LIVE_RESULTS_STATE/);
 for(let round=0;round<activity.questions.length;round++){
  for(let i=0;i<40;i++){if(i===39&&round>0)continue;await db.query('select red_activity_live_answer($1,$2,$3)',[players[i].token_hash,activity.questions[round].answer,null]);}
  await mutate('reveal',{room_id:room,owner_id:owner});await mutate('advance',{room_id:room,owner_id:owner});
 }
 const duplicate=mappings.map((item,index)=>({...item,trainee_id:index===1?mappings[0].trainee_id:item.trainee_id}));await assert.rejects(save(duplicate),/RED_ACTIVITY_LIVE_RESULTS_MAPPING/);
 const forged=mappings.map((item,index)=>({...item,trainee_id:index===39?randomUUID():item.trainee_id}));await assert.rejects(save(forged),/RED_ACTIVITY_TARGETS/);
 assert.equal((await db.query('select count(*)::int n from activity_live_profile_results')).rows[0].n,0);
 await assert.rejects(save(mappings,'2099-01-01'),/RED_ACTIVITY_ATTENDANCE_DATE/);
 await db.query("insert into daily_attendance(id,trainee_id,batch_id,date,status,created_at,updated_at) values($1,$2,$3,'2026-10-01','Absent',$4,$4)",[randomUUID(),roster[0].id,batch,stamp]);
 await save(mappings);await save(mappings);
 assert.equal((await db.query('select count(*)::int n from activity_live_profile_results')).rows[0].n,40);
 assert.equal((await db.query('select sum(earned_xp)::int xp from activity_live_profile_results')).rows[0].xp,35200);
 assert.equal((await db.query('select count(*)::int n from daily_attendance')).rows[0].n,40);
 assert.equal((await db.query('select attendance_status from activity_live_profile_results where trainee_id=$1',[roster[0].id])).rows[0].attendance_status,'Absent');
 assert.equal((await db.query('select (red_activity_live_xp()->0->>\'earned_xp\')::int xp')).rows[0].xp>0,true);
 const assignment=randomUUID(),participant=randomUUID();
 await db.query("insert into activity_assignments(id,batch_id,activity_id,title,created_by,created_at,updated_at) values($1,$2,'rapidfire','Delete fixture','trainer@example.test',$3,$3)",[assignment,batch,stamp]);
 await db.query("insert into activity_assignment_participants(id,assignment_id,trainee_id,batch_id,status,created_at,updated_at) values($1,$2,$3,$4,'Completed',$5,$5)",[participant,assignment,roster[1].id,batch,stamp]);
 await assert.rejects(db.query('select red_record_activity_attendance($1,1,$2,$3)',[assignment,'2099-01-01','trainer@example.test']),/RED_ACTIVITY_ATTENDANCE_DATE/);
 const attendanceResult=(await db.query('select red_record_activity_attendance($1,1,$2,$3) result',[assignment,'2026-10-01','trainer@example.test'])).rows[0].result;assert.equal(attendanceResult.created,0);assert.equal(attendanceResult.preserved,1);
 await assert.rejects(db.query('select red_delete_activity_assignment($1,1,$2)',[assignment,'not-staff@example.test']),/RED_ACTIVITY_DELETE_FORBIDDEN/);
 await assert.rejects(db.query('select red_delete_activity_assignment($1,99,$2)',[assignment,'trainer@example.test']),/RED_CONFLICT/);
 await db.query('select red_delete_activity_assignment($1,1,$2)',[assignment,'trainer@example.test']);
 assert.equal((await db.query('select count(*)::int n from activity_assignment_participants where assignment_id=$1',[assignment])).rows[0].n,0);
 assert.equal((await db.query('select jsonb_array_length(snapshot->\'participants\') n from activity_assignment_deletions where id=$1',[assignment])).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int n from trainees')).rows[0].n,40);assert.equal((await db.query('select count(*)::int n from daily_attendance')).rows[0].n,40);
 const incomplete=(await db.query('select score,answered_count,room_points from activity_live_profile_results where trainee_id=$1',[roster[39].id])).rows[0];assert.equal(Number(incomplete.score),11.11);assert.equal(incomplete.answered_count,1);assert.equal(incomplete.room_points,100);
 await assert.rejects(mutate('replay',{room_id:room,owner_id:owner}),/RED_ACTIVITY_LIVE_RESULTS_SAVED/);
 assert.equal((await db.query('select count(*)::int n from activity_live_answers')).rows[0].n,352,'failed replay rolls back answer deletion');
 const permissions=(await db.query("select has_table_privilege('anon','activity_live_profile_results','SELECT') can_read,has_function_privilege('anon','red_activity_live_save_results(text,text,jsonb)','EXECUTE') can_save,relrowsecurity from pg_class where oid='activity_live_profile_results'::regclass")).rows[0];assert.deepEqual(permissions,{can_read:false,can_save:false,relrowsecurity:true});
 await db.query('delete from activity_live_rooms where id=$1',[room]);assert.equal((await db.query('select count(*)::int n from activity_live_profile_results')).rows[0].n,40);
 const deletionPermissions=(await db.query("select has_table_privilege('anon','activity_assignment_deletions','SELECT') can_read,has_function_privilege('anon','red_delete_activity_assignment(text,integer,text)','EXECUTE') can_delete,has_function_privilege('authenticated','red_activity_live_save_outcomes(text,text,jsonb,text)','EXECUTE') can_save")).rows[0];assert.deepEqual(deletionPermissions,{can_read:false,can_delete:false,can_save:false});
 console.log('PASS: additive Postgres migrations, 40 joins, atomic scoring/XP/attendance, existing absence preserved, idempotency, recoverable deletion, foreign keys, replay rollback, RLS and expiry persistence.');
}finally{await db.close();}
