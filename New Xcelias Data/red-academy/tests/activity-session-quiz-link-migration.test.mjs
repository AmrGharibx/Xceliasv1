import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SQLiteRepository} from '../server/sqlite.mjs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20260925200000_activity_session_quiz_link.sql',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/academy/index.ts',import.meta.url),'utf8');

test('session-to-quiz cloud migration is additive, unique, atomic, and service-role-only',()=>{
 assert.match(migration,/add column if not exists linked_assignment_id text/i);
 assert.match(migration,/foreign key \(linked_assignment_id\)[\s\S]+?references public\.activity_assignments\(id\) on delete set null/i);
 assert.match(migration,/create unique index if not exists ix_red_activity_session_plan_assignment/i);
 assert.match(migration,/red_create_session_quiz_assignment/i);
 assert.match(migration,/from public\.activity_session_plans[\s\S]+?for update/i);
 assert.match(migration,/session_plan\.linked_assignment_id is not null/i);
 assert.match(migration,/session_plan\.session_date > to_char\(now\(\) at time zone 'Africa\/Cairo'/i);
 assert.match(migration,/red_create_activity_assignment\([\s\S]+?p_trainee_ids, p_actor/i);
 assert.match(migration,/set linked_assignment_id = p_id,[\s\S]+?version = version \+ 1/i);
 assert.match(migration,/link-session-quiz/i);
 assert.match(migration,/revoke all on function public\.red_create_session_quiz_assignment[\s\S]+?from public, anon, authenticated/i);
 assert.match(migration,/grant execute on function public\.red_create_session_quiz_assignment[\s\S]+?to service_role/i);
 assert.match(edge,/red_create_session_quiz_assignment/);
 assert.doesNotMatch(migration,/\b(drop|truncate)\s+(table|public\.)/i);
});

test('SQLite upgrades an existing session board additively and preserves every saved plan',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-session-quiz-link-'));
 const filename=path.join(directory,'academy.db');
 const schema=fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8');
 const legacy=schema.replace(' linked_assignment_id TEXT UNIQUE REFERENCES activity_assignments(id) ON DELETE SET NULL,\n','').replace(" confidence TEXT CHECK(confidence IS NULL OR confidence IN ('tentative','confident')),\n",'').replace('PRAGMA user_version = 15;','PRAGMA user_version = 13;');
 assert.notEqual(legacy,schema,'fixture must model the previous unlinked session-plan schema');
 const oldDb=new DatabaseSync(filename);
 oldDb.exec(legacy);
 oldDb.prepare('INSERT INTO batches(id,batch_name,status,start_date,end_date,session_dates,capacity,description,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
  .run('batch-keep','Migration class','Active','2026-10-01','2026-10-01','["2026-10-01"]',20,'',1,'2026-09-24T09:00:00.000Z','2026-09-24T09:00:00.000Z');
 oldDb.prepare('INSERT INTO activity_session_plans(id,batch_id,session_date,title,focus_skill,duration_minutes,activity_id,outline_json,status,version,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
  .run('plan-keep','batch-keep','2026-10-01','Saved discovery class','discovery',30,'quiz-discovery','[{},{},{},{}]','In Progress',4,'trainer@example.test','2026-09-24T09:00:00.000Z','2026-09-24T09:30:00.000Z');
 oldDb.close();

 const repository=new SQLiteRepository(filename);
 try{
  await repository.init();
  const saved=repository.db.prepare('SELECT id,batch_id,title,status,version,linked_assignment_id FROM activity_session_plans WHERE id=?').get('plan-keep');
  assert.deepEqual({...saved},{id:'plan-keep',batch_id:'batch-keep',title:'Saved discovery class',status:'In Progress',version:4,linked_assignment_id:null});
  assert.ok(repository.db.prepare('PRAGMA table_info(activity_session_plans)').all().some(column=>column.name==='linked_assignment_id'));
  assert.equal(repository.db.prepare('PRAGMA user_version').get().user_version,15);
  assert.deepEqual(repository.db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{
  repository.close();
  fs.rmSync(directory,{recursive:true,force:true});
 }
});
