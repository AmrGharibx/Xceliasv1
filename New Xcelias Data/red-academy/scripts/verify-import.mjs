/** Read-only import verification. --baseline additionally checks the untouched delivery. */
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {loadEnv} from '../server/env.mjs';
loadEnv();
const file=path.resolve(process.env.DATABASE_PATH||'./data/red-academy.db');
if(!fs.existsSync(file))throw new Error('Database not found: '+file);
const db=new DatabaseSync(file,{readOnly:true}),baseline=process.argv.includes('--baseline'),checks=[];
function check(name,test){assert.ok(test,name);checks.push(name);}
const run=db.prepare('SELECT * FROM import_runs ORDER BY imported_at DESC LIMIT 1').get();
assert.ok(run,'No Notion import recorded in this database.');
const summary=JSON.parse(run.summary),source=db.prepare('SELECT * FROM source_records').all();
check('SQLite integrity',db.prepare('PRAGMA integrity_check').get().integrity_check==='ok');
check('Foreign keys',db.prepare('PRAGMA foreign_key_check').all().length===0);
check('Expected schema version',db.prepare('PRAGMA user_version').get().user_version===3);
check('Every source page retained',source.length===Object.values(summary.source_record_counts).reduce((a,b)=>a+b,0));
check('Every academy CSV row reconciled',summary.csv_reconciliation.length===11&&summary.csv_reconciliation.every(r=>r.status==='passed'&&r.csv_rows===r.matched_rows));
const tables=['companies','batches','trainees','daily_attendance','attendance_10day','assessments'];
const allowed=new Set(tables),sourceIds=new Set(source.map(r=>r.id));
for(const r of source){
 assert.match(r.id,/^[a-f0-9]{32}$/);assert.equal(createHash('sha256').update(r.raw).digest('hex'),r.sha256,'Source hash mismatch '+r.id);
 assert.ok(['imported','consolidated','excluded_empty','excluded_demo'].includes(r.disposition));assert.ok(r.reason.trim());
 for(const ids of Object.values(JSON.parse(r.relations)))for(const id of ids)assert.ok(sourceIds.has(id),'Missing original relation '+id);
 const destinations=JSON.parse(r.app_records);assert.ok(destinations.every(m=>allowed.has(m.table)));
 if(['imported','consolidated'].includes(r.disposition))assert.ok(destinations.length,'No destination for '+r.id);
 if(baseline)for(const m of destinations)assert.ok(db.prepare('SELECT id FROM '+m.table+' WHERE id=?').get(m.id),'Missing destination for '+r.id);
}
checks.push('All source hashes, dispositions, reasons, archived links and destination types');
const counts=Object.fromEntries(tables.map(t=>[t,db.prepare('SELECT COUNT(*) n FROM '+t).get().n]));
if(baseline){
 assert.deepEqual(counts,summary.imported_counts);checks.push('Exact delivered entity counts');
 for(const t of ['users','sessions','invitations','setup_grants'])check('No packaged '+t,db.prepare('SELECT COUNT(*) n FROM '+t).get().n===0);
 const numbers=db.prepare('SELECT batch_name FROM batches').all().map(b=>Number(b.batch_name.replace('Batch ',''))).sort((a,b)=>a-b);
 check('Only the 42 real source batches',JSON.stringify(numbers)===JSON.stringify(Array.from({length:43},(_,i)=>i+1).filter(n=>n!==25)));
 const bad=db.prepare("SELECT COUNT(*) n FROM assessments WHERE (mapping IS NULL OR product_knowledge IS NULL OR presentability IS NULL OR soft_skills IS NULL) AND analytics_included=1").get().n;
 check('Unknown scores excluded from graded averages',bad===0);
 for(const t of ['daily_attendance','attendance_10day','assessments'])check(t+' links match the explicit batch',db.prepare(`SELECT COUNT(*) n FROM ${t} r JOIN trainees t ON t.id=r.trainee_id WHERE t.batch_id IS NOT r.batch_id`).get().n===0);
 check('Missing source capacity not invented',db.prepare('SELECT COUNT(*) n FROM batches WHERE capacity IS NOT NULL').get().n===0);
 check('No fabricated contacts',db.prepare("SELECT COUNT(*) n FROM trainees WHERE email<>'' OR phone<>''").get().n===0);
}
console.log(JSON.stringify({ok:true,mode:baseline?'untouched-import-baseline':'archive-and-database-integrity',checks:checks.length,check_names:checks,source_pages:source.length,source_sha256:run.source_sha256,operational_counts:counts},null,2));
db.close();
