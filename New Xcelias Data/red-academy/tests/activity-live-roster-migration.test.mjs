import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SQLiteRepository} from '../server/sqlite.mjs';

test('cloud profile migration is additive, service-role-only and never rewrites formal business records',()=>{
 const sql=fs.readFileSync(new URL('../supabase/migrations/20261001120000_live_activity_profile_results.sql',import.meta.url),'utf8');
 assert.match(sql,/alter table public\.activity_live_players add column if not exists trainee_id text/i);
 assert.match(sql,/alter table public\.activity_live_rooms add column if not exists profile_results_saved_at text/i);
 assert.match(sql,/activity_live_profile_results enable row level security/i);
 assert.match(sql,/revoke all on public\.activity_live_profile_results from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.red_activity_live_save_results\(text,text,jsonb\) to service_role/i);
 assert.doesNotMatch(sql,/\b(drop|truncate)\b/i);
 assert.doesNotMatch(sql,/\b(update|delete from|insert into) public\.(batches|trainees|assessments|daily_attendance|attendance_10day|activity_assignment_participants)\b/i);
 assert.match(sql,/unique\(source_room_id,trainee_id\)/);
 assert.match(sql,/where id=p_room_id for update/);
});

test('upgrading schema 15 preserves an existing batch, formal grade, player and answer',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-live-profile-migration-')),filename=path.join(directory,'academy.db');
 const schema=fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const legacy=schema.replace(/-- Permanent trainer-confirmed activity history;[\s\S]*?CREATE INDEX IF NOT EXISTS ix_activity_live_profile_history[^;]*;\n/,'').replace('PRAGMA user_version = 18;','PRAGMA user_version = 15;');
 assert.notEqual(legacy,schema);
 const old=new DatabaseSync(filename),stamp='2026-09-13T08:00:00.000Z';old.exec(legacy);
 old.prepare('INSERT INTO users(id,email,full_name,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?)').run('trainer','trainer@example.test','Trainer','hash','instructor',1,stamp);
 old.prepare('INSERT INTO batches(id,batch_name,status,start_date,end_date,session_dates,capacity,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run('batch','Batch 42','Completed','2026-09-13','2026-09-23','["2026-09-13","2026-09-23"]',40,stamp,stamp);
 old.prepare('INSERT INTO trainees(id,trainee_name,batch_id,created_at,updated_at) VALUES(?,?,?,?,?)').run('trainee','Original trainee','batch',stamp,stamp);
 old.prepare('INSERT INTO assessments(id,trainee_id,batch_id,assessment_title,mapping,product_knowledge,presentability,soft_skills,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('grade','trainee','batch','Original assessment',4,5,3,4,stamp,stamp);
 old.prepare('INSERT INTO activity_live_rooms(id,code_hash,owner_id,activity_id,deck_snapshot,team_one,team_two,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('room','a'.repeat(64),'trainer','quiz-discovery','{"questions":[]}','A','B',stamp,stamp,'2030-01-01T00:00:00.000Z');
 old.prepare('INSERT INTO activity_live_players(id,room_id,token_hash,nickname,team_no,points,streak,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?,?)').run('player','room','b'.repeat(64),'Orbit',1,125,1,stamp,stamp);
 old.prepare('INSERT INTO activity_live_answers(room_id,player_id,round_index,choice,correct,awarded_points,updated_at) VALUES(?,?,?,?,?,?,?)').run('room','player',0,1,1,125,stamp);
 const tables=['batches','trainees','assessments','activity_live_answers'],before=Object.fromEntries(tables.map(table=>[table,old.prepare(`SELECT * FROM ${table}`).all()]));old.close();
 const upgraded=new SQLiteRepository(filename);
 try{
  await upgraded.init();for(const table of tables)assert.deepEqual(upgraded.db.prepare(`SELECT * FROM ${table}`).all(),before[table]);
  const player=upgraded.db.prepare('SELECT nickname,points,streak,trainee_id FROM activity_live_players').get();assert.deepEqual({...player},{nickname:'Orbit',points:125,streak:1,trainee_id:null});
  assert.equal(upgraded.db.prepare('SELECT profile_results_saved_at FROM activity_live_rooms').get().profile_results_saved_at,null);
  assert.equal(upgraded.db.prepare('SELECT COUNT(*) n FROM activity_live_profile_results').get().n,0);
  assert.equal(upgraded.db.prepare('PRAGMA user_version').get().user_version,18);assert.deepEqual(upgraded.db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{upgraded.close();fs.rmSync(directory,{recursive:true,force:true});}
});
