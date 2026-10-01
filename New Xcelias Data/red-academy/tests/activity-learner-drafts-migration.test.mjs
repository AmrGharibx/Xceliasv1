import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SQLiteRepository} from '../server/sqlite.mjs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20260925000000_activity_learner_quiz_drafts.sql',import.meta.url),'utf8');
const edge=fs.readFileSync(new URL('../supabase/functions/academy/index.ts',import.meta.url),'utf8');

test('cloud quiz drafts are additive, bounded, and inaccessible to public database roles',()=>{
 assert.match(migration,/add column if not exists learner_draft_answers jsonb not null default '\[\]'/i);
 assert.match(migration,/add column if not exists learner_draft_index integer not null default 0/i);
 assert.match(migration,/add column if not exists learner_draft_version integer not null default 0/i);
 assert.match(migration,/jsonb_array_length\(learner_draft_answers\) <= 12/i);
 assert.match(migration,/learner_draft_index between 0 and 11/i);
 assert.match(migration,/revoke all on function public\.red_save_activity_quiz_draft\(text, jsonb, integer, integer\) from public, anon, authenticated/i);
 assert.match(migration,/grant execute on function public\.red_save_activity_quiz_draft\(text, jsonb, integer, integer\) to service_role/i);
 assert.doesNotMatch(migration,/\b(drop|truncate)\s+(table|public\.)/i);
});

test('cloud quiz drafts validate bearer-link state and successful submit clears them atomically',()=>{
 assert.match(migration,/learner_submitted_at is not null or participant\.status = 'Completed'/i);
 assert.match(migration,/participant\.learner_draft_version <> p_expected_version/i);
 assert.match(migration,/learner_draft_version = learner_draft_version \+ 1/i);
 assert.match(migration,/assignment_row\.status <> 'Open'/i);
 assert.match(migration,/assignment_row\.activity_id not like 'quiz-%'/i);
 assert.match(migration,/set learner_draft_answers = p_answers,[\s\S]+?learner_draft_index = p_current_index,[\s\S]+?learner_draft_updated_at = now_value/i);
 assert.match(migration,/learner_draft_answers = '\[\]'::jsonb, learner_draft_index = 0, learner_draft_updated_at = null/i);
 assert.match(migration,/revoke all on function public\.red_submit_activity_quiz\(text, jsonb, integer, integer, integer\) from public, anon, authenticated/i);
 assert.match(edge,/activities\/learner\/draft'[\s\S]+?validateStudioQuizDraft\(activity,body\.answers,body\.current_index\)[\s\S]+?red_save_activity_quiz_draft/i);
 assert.match(edge,/RED_ACTIVITY_DRAFT_CONFLICT/);
});

test('upgrading a schema-12 SQLite workspace adds the draft version without changing saved participants',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-draft-version-'));
 const filename=path.join(directory,'academy.db');
 const schema=fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const legacy=schema.replace(' learner_draft_version INTEGER NOT NULL DEFAULT 0 CHECK(learner_draft_version>=0),\n','').replace(' linked_assignment_id TEXT UNIQUE REFERENCES activity_assignments(id) ON DELETE SET NULL,\n','').replace(" confidence TEXT CHECK(confidence IS NULL OR confidence IN ('tentative','confident')),\n",'').replace('PRAGMA user_version = 17;','PRAGMA user_version = 12;');
 assert.notEqual(legacy,schema);
 const oldDb=new DatabaseSync(filename);
 oldDb.exec(legacy);oldDb.exec('PRAGMA foreign_keys=OFF;');
 oldDb.prepare("INSERT INTO activity_assignment_participants(id,assignment_id,trainee_id,batch_id,status,score,trainer_feedback,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").run('kept-participant','old-assignment','old-trainee','old-batch','In Progress',null,'',7,'2026-09-24T09:00:00.000Z','2026-09-24T09:30:00.000Z');
 oldDb.close();
 const repository=new SQLiteRepository(filename);
 try{
  await repository.init();
  assert.equal(repository.db.prepare('PRAGMA user_version').get().user_version,17);
  assert.deepEqual({...repository.db.prepare('SELECT id,assignment_id,trainee_id,batch_id,status,version,learner_draft_version FROM activity_assignment_participants WHERE id=?').get('kept-participant')},{id:'kept-participant',assignment_id:'old-assignment',trainee_id:'old-trainee',batch_id:'old-batch',status:'In Progress',version:7,learner_draft_version:0});
 }finally{repository.close();fs.rmSync(directory,{recursive:true,force:true});}
});
