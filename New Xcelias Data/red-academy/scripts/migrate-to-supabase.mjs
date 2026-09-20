import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync,backup} from 'node:sqlite';
import {loadEnv} from '../server/env.mjs';

loadEnv();
process.umask(0o077);

const dryRun=process.argv.includes('--dry-run');
const resume=process.argv.includes('--resume');
const source=path.resolve(process.env.DATABASE_PATH||'./data/red-academy.db');
const jsonFields=new Set(['days','session_dates','snapshot','source_meta','summary','properties','relations','app_records','source_ids']);
const booleanFields=new Set(['is_late','active','analytics_included']);
const tables=['companies','batches','trainees','daily_attendance','attendance_10day','assessments','users','invitations','audit_log','assessment_history','import_runs','source_records','import_reviews'];

if(!fs.existsSync(source))throw new Error('No local RED Academy database was found.');

function decode(row){
 const result={...row};
 for(const field of jsonFields)if(typeof result[field]==='string')result[field]=JSON.parse(result[field]);
 for(const field of booleanFields)if(field in result)result[field]=!!result[field];
 return result;
}
function count(db,table){return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);}
function sourceCounts(db){return Object.fromEntries([...tables,'trainee_photos'].map(table=>[table,count(db,table)]));}
function requiredCloudSettings(){
 const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
 if(!url||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY) only in this process environment before running the cloud migration.');
 const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('SUPABASE_URL must be the exact HTTPS Supabase project origin.');
 return {url:parsed.href.replace(/\/$/,''),key,legacyKey:key.startsWith('eyJ')};
}
function timestamp(){return new Date().toISOString().replaceAll(':','-');}
function createSnapshot(){
 const destination=path.resolve('./backups',`red-academy-before-supabase-${timestamp()}.db`);
 if(fs.existsSync(destination))throw new Error('The generated backup destination already exists.');
 fs.mkdirSync(path.dirname(destination),{recursive:true,mode:0o700});
 return destination;
}
async function request(cloud,endpoint,init={}){
 const response=await fetch(cloud.url+endpoint,{...init,headers:{apikey:cloud.key,...(cloud.legacyKey?{Authorization:`Bearer ${cloud.key}`}:{}),...(init.headers||{})}});
 if(!response.ok)throw new Error(`Supabase rejected ${init.method||'GET'} ${endpoint} (${response.status}). Check that the schema migrations were applied to the intended empty project.`);
 return response;
}
function params(values){const result=new URLSearchParams();for(const [key,value] of Object.entries(values))if(value!==undefined&&value!==null)result.set(key,String(value));return result.toString();}
async function remoteCount(cloud,table){
 const response=await request(cloud,`/rest/v1/${table}?${params({select:'id',limit:1})}`,{headers:{Prefer:'count=exact','Range':'0-0'}});
 const contentRange=response.headers.get('content-range')||'';const match=/\/(\d+)$/.exec(contentRange);if(!match)throw new Error(`Could not verify the remote ${table} count.`);return Number(match[1]);
}
async function upsertChunk(cloud,table,records){
 if(!records.length)return;
 await request(cloud,`/rest/v1/${table}?on_conflict=id`,{method:'POST',headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)});
}
async function uploadTable(cloud,db,table){
 const rows=db.prepare(`SELECT * FROM ${table} ORDER BY id`).all().map(decode);let batch=[],size=2,uploaded=0;
 for(const record of rows){
  const encoded=JSON.stringify(record);
  if(batch.length&&(batch.length>=200||size+encoded.length>240000)){await upsertChunk(cloud,table,batch);uploaded+=batch.length;batch=[];size=2;}
  batch.push(record);size+=encoded.length+1;
 }
 if(batch.length){await upsertChunk(cloud,table,batch);uploaded+=batch.length;}
 return uploaded;
}

const liveDb=new DatabaseSync(source,{readOnly:true});
let snapshotDb;
try{
 const integrity=liveDb.prepare('PRAGMA quick_check').all();if(integrity.some(row=>row.quick_check!=='ok'))throw new Error('The local database integrity check did not pass. Resolve that before migration.');
 const liveCounts=sourceCounts(liveDb);
 if(liveCounts.trainee_photos>0)throw new Error('This cloud migration intentionally refuses to move existing portrait files without a private object-by-object review. No cloud data was changed.');
 if(dryRun){console.log(JSON.stringify({database:source,counts:liveCounts,readyForCloud:liveCounts.trainee_photos===0},null,2));process.exit(0);}
 const snapshot=createSnapshot();await backup(liveDb,snapshot);fs.chmodSync(snapshot,0o600);snapshotDb=new DatabaseSync(snapshot,{readOnly:true});
 const expected=sourceCounts(snapshotDb),cloud=requiredCloudSettings();
 const existing=Object.fromEntries(await Promise.all(tables.map(async table=>[table,await remoteCount(cloud,table)])));
 if(!resume&&Object.values(existing).some(value=>value>0))throw new Error('The target Supabase project already contains RED Academy records. Refusing to overwrite a non-empty workspace. Use --resume only after an interrupted first migration has been inspected.');
 console.log(`Created protected source snapshot: ${snapshot}`);
 for(const table of tables){const uploaded=await uploadTable(cloud,snapshotDb,table);console.log(`Migrated ${uploaded} ${table}.`);}
 await request(cloud,'/rest/v1/sessions?expires_at=gte.0',{method:'DELETE',headers:{Prefer:'return=minimal'}});
 await request(cloud,'/rest/v1/rpc/red_bump_revision',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 const actual=Object.fromEntries(await Promise.all(tables.map(async table=>[table,await remoteCount(cloud,table)])));
 const mismatches=Object.entries(expected).filter(([table,value])=>table!=='trainee_photos'&&actual[table]!==value);
 if(mismatches.length)throw new Error(`Cloud verification failed for: ${mismatches.map(([table])=>table).join(', ')}. The source snapshot remains available for recovery.`);
 console.log(JSON.stringify({migrated:true,sourceSnapshot:snapshot,counts:actual,sessionsInvalidated:true},null,2));
}finally{snapshotDb?.close();liveDb.close();}
