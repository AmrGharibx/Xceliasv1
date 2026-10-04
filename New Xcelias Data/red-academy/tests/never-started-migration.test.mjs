import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SQLiteRepository} from '../server/sqlite.mjs';

test('SQLite upgrade adds Never Started without losing trainee-linked records',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'red-never-started-migration-')),filename=path.join(directory,'academy.db');
 const schema=fs.readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8').replaceAll('\r\n','\n');
 const legacy=schema.replace("CHECK(enrollment_status IN ('Active','Stopped Attending','Never Started'))","CHECK(enrollment_status IN ('Active','Stopped Attending'))").replace('PRAGMA user_version = 18;','PRAGMA user_version = 17;');
 assert.notEqual(legacy,schema);
 const old=new DatabaseSync(filename),stamp='2026-10-01T08:00:00.000Z';old.exec(legacy);
 old.prepare('INSERT INTO companies(id,name,created_at,updated_at) VALUES(?,?,?,?)').run('company','Example Co',stamp,stamp);
 old.prepare('INSERT INTO batches(id,batch_name,status,start_date,end_date,session_dates,capacity,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run('batch','Batch 43','Active','2026-10-01','2026-10-02','["2026-10-01","2026-10-02"]',1,stamp,stamp);
 old.prepare('INSERT INTO trainees(id,trainee_name,company_id,batch_id,enrollment_status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run('trainee','No Show','company','batch','Active',stamp,stamp);
 old.prepare('INSERT INTO daily_attendance(id,trainee_id,batch_id,date,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run('absence','trainee','batch','2026-10-01','Absent',stamp,stamp);
 old.prepare('INSERT INTO assessments(id,trainee_id,batch_id,assessment_title,mapping,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').run('grade','trainee','batch','Historical score',4,stamp,stamp);
 old.prepare('INSERT INTO attendance_10day(id,trainee_id,batch_id,period_start,period_end,days,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run('checklist','trainee','batch','2026-10-01','2026-10-02','[false,false,false,false,false,false,false,false,false,false]',stamp,stamp);
 old.close();
 const upgraded=new SQLiteRepository(filename);
 try{
  await upgraded.init();
  assert.equal(upgraded.db.prepare('PRAGMA user_version').get().user_version,18);
  assert.equal(upgraded.db.prepare('SELECT enrollment_status FROM trainees WHERE id=?').get('trainee').enrollment_status,'Active');
  for(const table of ['daily_attendance','assessments','attendance_10day'])assert.equal(upgraded.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,1);
  upgraded.db.prepare("UPDATE trainees SET enrollment_status='Never Started' WHERE id='trainee'").run();
  assert.equal(upgraded.db.prepare('SELECT enrollment_status FROM trainees WHERE id=?').get('trainee').enrollment_status,'Never Started');
  assert.deepEqual(upgraded.db.prepare('PRAGMA foreign_key_check').all(),[]);
 }finally{upgraded.close();fs.rmSync(directory,{recursive:true,force:true});}
});
