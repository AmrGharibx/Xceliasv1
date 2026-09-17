/** Read-only counts. Never creates, clears, migrates or seeds a database. */
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {loadEnv} from '../server/env.mjs';
loadEnv();
const file=path.resolve(process.env.DATABASE_PATH||'./data/red-academy.db');
if(!fs.existsSync(file)){
 console.log(JSON.stringify({database:file,initialized:false,message:'No database exists. First launch will create an empty private workspace.'},null,2));
}else{
 const db=new DatabaseSync(file,{readOnly:true});
 try{
  const names=['companies','batches','trainees','daily_attendance','attendance_10day','assessments','assessment_history','audit_log','source_records','import_reviews','import_runs','users','invitations'];
  const counts=Object.fromEntries(names.map(name=>[name,db.prepare('SELECT COUNT(*) AS count FROM '+name).get().count]));
  const integrity=db.prepare('PRAGMA quick_check').all();
  console.log(JSON.stringify({database:file,initialized:true,counts,integrity},null,2));
 }finally{db.close();}
}
