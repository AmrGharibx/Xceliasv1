import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SQLiteRepository} from '../server/sqlite.mjs';

const pulseRevealMigration=fs.readFileSync(new URL('../supabase/migrations/20260924230000_activity_live_pulse_reveal.sql',import.meta.url),'utf8');

test('cloud pulse reveal is additive, service-role-only, and cannot score or disclose quiz records',()=>{
 assert.match(pulseRevealMigration,/create or replace function public\.red_activity_live_pulse_reveal/i);
 assert.match(pulseRevealMigration,/deck_snapshot->>'mode' is distinct from 'pulse'/i);
 assert.match(pulseRevealMigration,/set revealed = true, correct_choice = null, timer_ends_at = null/i);
 assert.match(pulseRevealMigration,/revoke all on function public\.red_activity_live_pulse_reveal\(text, text\) from public, anon, authenticated/i);
 assert.match(pulseRevealMigration,/grant execute on function public\.red_activity_live_pulse_reveal\(text, text\) to service_role/i);
 assert.doesNotMatch(pulseRevealMigration,/\b(update|insert|delete)\s+(into\s+)?public\.activity_live_(players|answers)\b/i);
 assert.doesNotMatch(pulseRevealMigration,/\b(drop|truncate)\s+(table|public\.)/i);
});

test('expanding live teams preserves existing two-team players, answers and foreign keys',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-live-teams-'));
 const filename=path.join(directory,'academy.db');
 const schema=fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8');
 const legacySchema=schema.replace('team_no INTEGER NOT NULL CHECK(team_no BETWEEN 1 AND 4)','team_no INTEGER NOT NULL CHECK(team_no IN (1,2))').replace(" confidence TEXT CHECK(confidence IS NULL OR confidence IN ('tentative','confident')),\n",'').replace('PRAGMA user_version = 15;','PRAGMA user_version = 8;');
 assert.notEqual(legacySchema,schema,'fixture must carry the previous two-team constraint');
 const oldDb=new DatabaseSync(filename);
 oldDb.exec(legacySchema);
 oldDb.prepare('INSERT INTO users(id,email,full_name,password_hash,role,active,created_at) VALUES(?,?,?,?,?,?,?)').run('trainer','trainer@example.test','Trainer','hash','instructor',1,'2026-09-24T00:00:00.000Z');
 oldDb.prepare('INSERT INTO activity_live_rooms(id,code_hash,owner_id,activity_id,deck_snapshot,team_one,team_two,timer_duration,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('room','a'.repeat(64),'trainer','quiz-discovery',JSON.stringify({team_names:['North Stars','Bright Sparks'],questions:[]}),'North Stars','Bright Sparks',30,'2026-09-24T00:00:00.000Z','2026-09-24T00:00:00.000Z','2026-09-25T00:00:00.000Z');
 oldDb.prepare('INSERT INTO activity_live_players(id,room_id,token_hash,nickname,team_no,points,streak,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?,?,?)').run('player','room','b'.repeat(64),'Orbit',2,250,2,'2026-09-24T00:01:00.000Z','2026-09-24T00:01:00.000Z');
 oldDb.prepare('INSERT INTO activity_live_answers(room_id,player_id,round_index,choice,correct,awarded_points,updated_at) VALUES(?,?,?,?,?,?,?)').run('room','player',0,1,1,150,'2026-09-24T00:02:00.000Z');
 oldDb.close();

 const repository=new SQLiteRepository(filename);
 try{
  await repository.init();
  assert.deepEqual({...repository.db.prepare('SELECT id,team_no,points,streak FROM activity_live_players WHERE id=?').get('player')},{id:'player',team_no:2,points:250,streak:2});
  assert.deepEqual({...repository.db.prepare('SELECT room_id,player_id,round_index,choice,confidence,correct,awarded_points FROM activity_live_answers').get()},{room_id:'room',player_id:'player',round_index:0,choice:1,confidence:null,correct:1,awarded_points:150});
  repository.db.prepare('INSERT INTO activity_live_players(id,room_id,token_hash,nickname,team_no,joined_at,last_seen_at) VALUES(?,?,?,?,?,?,?)').run('player-four','room','c'.repeat(64),'Comet',4,'2026-09-24T00:03:00.000Z','2026-09-24T00:03:00.000Z');
  assert.equal(repository.db.prepare('SELECT team_no FROM activity_live_players WHERE id=?').get('player-four').team_no,4);
  assert.deepEqual(repository.db.prepare('PRAGMA foreign_key_check').all(),[]);
  assert.equal(repository.db.prepare('PRAGMA user_version').get().user_version,15);
 }finally{
  repository.close();
  fs.rmSync(directory,{recursive:true,force:true});
 }
});
