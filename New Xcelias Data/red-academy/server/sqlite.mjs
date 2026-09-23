import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {id,TABLES,emptyState} from '../public/modules/core.mjs';
import {ApiError} from './validation.mjs';
const scrypt=promisify(crypto.scrypt);
function secretMatches(token,hash) {if(typeof token!=='string'||token.length>256)return false;const actual=Buffer.from(tokenHash(token),'hex'),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>256)throw new ApiError(400,'Use a password between 12 and 256 characters.');const salt=crypto.randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);return `${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password,stored){try{const[salt,hash]=stored.split(':');const actual=await scrypt(password,salt,64);const expected=Buffer.from(hash,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}catch{return false;}}
export const tokenHash=t=>crypto.createHash('sha256').update(t).digest('hex');
function serialize(key,value){return ['days','session_dates','snapshot','source_meta','summary','properties','relations','app_records','source_ids'].includes(key)?JSON.stringify(value):typeof value==='boolean'?Number(value):value;}
function decode(row){if(!row)return null;row={...row};for(const key of ['days','session_dates','snapshot','source_meta','summary','properties','relations','app_records','source_ids'])if(typeof row[key]==='string')row[key]=JSON.parse(row[key]);for(const key of ['is_late','active','analytics_included','assessment_day'])if(key in row)row[key]=!!row[key];return row;}
function ensureColumn(db,table,column,definition){if(!db.prepare(`PRAGMA table_info(${table})`).all().some(row=>row.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}
export class SQLiteRepository {
 constructor(filename){if(filename!==':memory:')fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true,mode:0o700});this.db=new DatabaseSync(filename);const version=this.db.prepare('PRAGMA user_version').get().user_version;if(version&&version<3){this.db.close();throw new Error('This is an older RED database. Use the imported v3 database in a fresh folder; do not copy a v2 database over it. Keep a backup of your older workspace.');}if(filename!==':memory:'){try{fs.chmodSync(filename,0o600);}catch{}}this.db.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));ensureColumn(this.db,'trainees','enrollment_status',"TEXT NOT NULL DEFAULT 'Active' CHECK(enrollment_status IN ('Active','Stopped Attending'))");ensureColumn(this.db,'daily_attendance','assessment_day','INTEGER NOT NULL DEFAULT 0 CHECK(assessment_day IN (0,1))');this.db.exec('PRAGMA user_version = 4');}

 async init() {
  // Business data is NEVER seeded, even when an old environment requests it.
  this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  this.db.prepare('DELETE FROM rate_limits WHERE window_start < ?').run(Date.now()-86400000);
  if (await this.needsSetup()) {
   this.setupToken = crypto.randomBytes(32).toString('base64url');
   this.db.prepare('INSERT INTO setup_grants(name,token_hash,expires_at) VALUES(?,?,?) ON CONFLICT(name) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at')
    .run('first-admin',tokenHash(this.setupToken),Date.now()+86400000);
   console.log('\nINTERNAL TRAINING SYSTEM | Company workspace setup\nSetup code: '+this.setupToken+'\nOpen the application and create your own administrator account.\nThis code expires in 24 hours, is replaced on restart, and stops working after setup.\nKeep it private. No default account or password has been created.\n');
  }
 }
 async needsSetup() { return this.db.prepare('SELECT COUNT(*) n FROM users').get().n===0; }
 async setup({token,email,password,full_name}) {
  if (!await this.needsSetup()) throw new ApiError(409,'This workspace is already configured. Sign in with your company account.');
  const grant=this.db.prepare('SELECT * FROM setup_grants WHERE name=?').get('first-admin');
  if(!grant || grant.expires_at<=Date.now() || !secretMatches(token,grant.token_hash)) throw new ApiError(403,'The setup code is invalid or expired. Ask the server owner for the current code.');
  const password_hash=await hashPassword(password);
  this.db.exec('BEGIN IMMEDIATE');
  try {
   const current=this.db.prepare('SELECT * FROM setup_grants WHERE name=?').get('first-admin');
   if(this.db.prepare('SELECT COUNT(*) n FROM users').get().n || !current || current.expires_at<=Date.now() || !secretMatches(token,current.token_hash)) throw new ApiError(409,'Setup is no longer available.');
   const user={id:id(),email,full_name,password_hash,role:'admin',active:true,created_at:new Date().toISOString()};
   this.insert('users',user);this.db.prepare('DELETE FROM setup_grants').run();
   this.audit(user,'setup','users',user.id,'Internal workspace initialized by its administrator.');
   this.db.exec('COMMIT');this.setupToken=null;
   return {message:'Your internal company workspace is ready. Sign in to continue.',email};
  } catch(error) {this.db.exec('ROLLBACK');throw error;}
 }
 audit(actor,action,entity,entity_id,details) {
  this.insert('audit_log',{id:id(),actor:actor.email,action,entity,entity_id,details,created_at:new Date().toISOString()});
 }
 async invitations() {
  return this.db.prepare('SELECT id,email,full_name,role,created_at,expires_at,used_at,revoked_at FROM invitations ORDER BY created_at DESC').all();
 }
 async invite({email,full_name,role},actor) {
  if(actor.role!=='admin') throw new ApiError(403,'Administrator access is required.');
  if(this.db.prepare('SELECT id FROM users WHERE email=?').get(email)) throw new ApiError(409,'This email already has an account. Manage its existing access instead.');
  const token=crypto.randomBytes(32).toString('base64url'),now=Date.now();
  const row={id:id(),email,full_name,role,token_hash:tokenHash(token),invited_by:actor.id,created_at:new Date(now).toISOString(),expires_at:now+48*3600000,used_at:null,revoked_at:null};
  this.db.exec('BEGIN IMMEDIATE');
  try {
   this.db.prepare('UPDATE invitations SET revoked_at=? WHERE email=? AND used_at IS NULL AND revoked_at IS NULL').run(now,email);
   this.insert('invitations',row);this.audit(actor,'invite','users',null,'Invited '+email+' as '+role+'.');this.db.exec('COMMIT');
  } catch(error){this.db.exec('ROLLBACK');throw error;}
  return {id:row.id,token,email,role,expires_at:row.expires_at};
 }
 async revokeInvitation(invitationId,actor) {
  if(actor.role!=='admin') throw new ApiError(403,'Administrator access is required.');
  const row=this.db.prepare('SELECT id FROM invitations WHERE id=? AND used_at IS NULL AND revoked_at IS NULL').get(invitationId);
  if(!row) throw new ApiError(404,'No active invitation was found.');
  this.db.prepare('UPDATE invitations SET revoked_at=? WHERE id=?').run(Date.now(),invitationId);
  this.audit(actor,'revoke-invitation','invitations',invitationId,'Invitation revoked.');return {ok:true};
 }
 async acceptInvitation({token,password}) {
  const row=this.db.prepare('SELECT * FROM invitations WHERE token_hash=? AND used_at IS NULL AND revoked_at IS NULL AND expires_at>?').get(tokenHash(token),Date.now());
  if(!row) throw new ApiError(400,'This invitation is invalid, expired, or already used. Ask your company administrator for a new invitation.');
  const password_hash=await hashPassword(password);
  this.db.exec('BEGIN IMMEDIATE');
  try {
   const current=this.db.prepare('SELECT * FROM invitations WHERE id=? AND used_at IS NULL AND revoked_at IS NULL AND expires_at>?').get(row.id,Date.now());
   if(!current || this.db.prepare('SELECT id FROM users WHERE email=?').get(row.email)) throw new ApiError(409,'This invitation can no longer be used.');
   const user={id:id(),email:row.email,full_name:row.full_name,password_hash,role:row.role,active:true,created_at:new Date().toISOString()};
   this.insert('users',user);this.db.prepare('UPDATE invitations SET used_at=? WHERE id=?').run(Date.now(),row.id);
   this.audit(user,'accept-invitation','users',user.id,'Invited company staff member activated.');this.db.exec('COMMIT');
   return {message:'Your company account is ready. Sign in with your email and new password.',email:row.email};
  } catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async changePassword(user,currentPassword,newPassword) {
  const row=this.db.prepare('SELECT password_hash FROM users WHERE id=? AND active=1').get(user.id);
  if(!row || !await verifyPassword(currentPassword,row.password_hash)) throw new ApiError(403,'Your current password is incorrect.');
  if(currentPassword===newPassword) throw new ApiError(400,'Choose a different password.');
  const hashed=await hashPassword(newPassword);
  this.db.exec('BEGIN IMMEDIATE');
  try {
   // A concurrent password reset must not be overwritten by an older credential.
   const result=this.db.prepare('UPDATE users SET password_hash=? WHERE id=? AND password_hash=? AND active=1').run(hashed,user.id,row.password_hash);
   if(!result.changes) throw new ApiError(409,'Your account changed. Sign in again before changing the password.');
   this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
   this.audit(user,'password-change','users',user.id,'Password changed; all sessions revoked.');this.db.exec('COMMIT');return {ok:true};
  } catch(error){this.db.exec('ROLLBACK');throw error;}
 }

 insert(table,row){const keys=Object.keys(row);this.db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...keys.map(k=>serialize(k,row[k])));return row;}
 async state(user){const s=emptyState();for(const table of TABLES)s[table]=this.db.prepare(`SELECT * FROM ${table} ORDER BY created_at,id`).all().map(decode);s.batches.sort((a,b)=>a.batch_name.localeCompare(b.batch_name,undefined,{numeric:true}));s.assessments.sort((a,b)=>Number(b.analytics_included)-Number(a.analytics_included));s.import_runs=this.db.prepare('SELECT * FROM import_runs ORDER BY imported_at DESC').all().map(decode);s.import_reviews=this.db.prepare('SELECT * FROM import_reviews ORDER BY code,id').all().map(decode);s.assessment_history=this.db.prepare('SELECT * FROM assessment_history ORDER BY created_at DESC LIMIT 200').all().map(decode);if(user.role==='admin')s.audit_log=this.db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all().map(decode);return s;}
 async traineePhoto(traineeId){const row=this.db.prepare('SELECT mime_type,bytes,updated_at FROM trainee_photos WHERE trainee_id=?').get(traineeId);return row?{mime_type:row.mime_type,bytes:Buffer.from(row.bytes),updated_at:row.updated_at}:null;}
 async saveTraineePhoto(traineeId,photo,actor){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   if(!this.db.prepare('SELECT id FROM trainees WHERE id=?').get(traineeId))throw new ApiError(404,'Trainee not found.');
   const now=new Date().toISOString();
   if(photo)this.db.prepare('INSERT INTO trainee_photos(trainee_id,mime_type,bytes,updated_at) VALUES(?,?,?,?) ON CONFLICT(trainee_id) DO UPDATE SET mime_type=excluded.mime_type,bytes=excluded.bytes,updated_at=excluded.updated_at').run(traineeId,photo.mime_type,photo.bytes,now);
   else this.db.prepare('DELETE FROM trainee_photos WHERE trainee_id=?').run(traineeId);
   this.audit(actor,photo?'upload-photo':'remove-photo','trainees',traineeId,photo?'Updated a private trainee portrait.':'Removed a private trainee portrait.');
   this.db.exec('COMMIT');return {ok:true,updated_at:now};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async sourceRecord(sourceId){const row=this.db.prepare('SELECT * FROM source_records WHERE id=?').get(sourceId);if(!row)throw new ApiError(404,'Original Notion record not found.');return decode(row);}
 async sourceList({batch='',kind='',disposition='',q='',page=1}){
  const clauses=[],values=[];
  for(const [key,value] of [['batch_id',batch],['kind',kind],['disposition',disposition]])if(value){clauses.push(key+'=?');values.push(value);}
  if(q){clauses.push('(title LIKE ? OR id LIKE ?)');values.push('%'+q+'%','%'+q+'%');}
  const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
  const total=this.db.prepare('SELECT COUNT(*) n FROM source_records'+where).get(...values).n;
  const rows=this.db.prepare('SELECT id,kind,title,batch_id,disposition,reason,app_records FROM source_records'+where+' ORDER BY kind,title,id LIMIT 25 OFFSET ?').all(...values,(page-1)*25).map(decode);
  return {rows,total,page,pages:Math.max(1,Math.ceil(total/25))};
 }
 async acknowledgeReview(reviewId,note,user){
  if(user.role!=='admin')throw new ApiError(403,'Administrator access is required.');
  const result=this.db.prepare("UPDATE import_reviews SET status='acknowledged',resolution=?,updated_at=? WHERE id=? AND status='open'").run(note,new Date().toISOString(),reviewId);
  if(!result.changes)throw new ApiError(404,'Open source review not found.');
  this.audit(user,'acknowledge-source','import_reviews',reviewId,'Source discrepancy acknowledged, not rewritten.');return {ok:true};
 }
 async commit(operations,user){this.db.exec('BEGIN IMMEDIATE');const records=[];try{for(const op of operations){const old=op.action!=='create'&&op.id?decode(this.db.prepare(`SELECT * FROM ${op.table} WHERE id=?`).get(op.id)):null;
  if(op.action!=='create'&&!old)throw new ApiError(404,'This record no longer exists.');
  if(old&&old.version!==op.expectedVersion)throw new ApiError(409,'Someone else changed this record. Refresh and try again.');
  if(op.table==='assessments'&&old)this.insert('assessment_history',{id:id(),assessment_id:old.id,trainee_id:old.trainee_id,actor:user.email,snapshot:old,created_at:new Date().toISOString()});
  if(op.action==='delete'){if(['trainees','batches'].includes(op.table)){const filter=op.table==='trainees'?'trainee_id':'batch_id';for(const snapshot of this.db.prepare(`SELECT * FROM assessments WHERE ${filter}=?`).all(old.id).map(decode))this.insert('assessment_history',{id:id(),assessment_id:snapshot.id,trainee_id:snapshot.trainee_id,actor:user.email,snapshot,created_at:new Date().toISOString()});}this.db.prepare(`DELETE FROM ${op.table} WHERE id=?`).run(op.id);records.push({id:op.id});}
  else {const row={...(old||{}),...op.data,id:old?.id||op.id||id(),version:(old?.version||0)+1,created_at:old?.created_at||new Date().toISOString(),updated_at:new Date().toISOString()};
   if(old){const keys=Object.keys(row).filter(k=>k!=='id');this.db.prepare(`UPDATE ${op.table} SET ${keys.map(k=>k+'=?').join(',')} WHERE id=?`).run(...keys.map(k=>serialize(k,row[k])),row.id);}else this.insert(op.table,row);records.push(row);
  }
  this.insert('audit_log',{id:id(),actor:user.email,action:op.action,entity:op.table,entity_id:records.at(-1).id,details:`${op.action} ${op.table.replaceAll('_',' ')} record${old?' (revision '+old.version+')':''}`,created_at:new Date().toISOString()});
 }this.db.exec('COMMIT');return records;}catch(e){this.db.exec('ROLLBACK');if(e instanceof ApiError)throw e;const m=e.message||'';if(m.includes('UNIQUE'))throw new ApiError(409,'A matching record already exists. Refresh the page before retrying.');if(m.includes('FOREIGN KEY'))throw new ApiError(409,'This record is linked to other data. Reassign the linked records first.');if(m.includes('CHECK')||/capacity|enrollment|dates|scheduled|checklist|locked/i.test(m))throw new ApiError(400,m);throw e;}}
 async rate(key,limit,seconds){const now=Date.now();let row=this.db.prepare('SELECT * FROM rate_limits WHERE key=?').get(key);if(!row||now-row.window_start>seconds*1000){this.db.prepare('INSERT INTO rate_limits(key,window_start,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=excluded.window_start,count=1').run(key,now);return true;}if(row.count>=limit)return false;this.db.prepare('UPDATE rate_limits SET count=count+1 WHERE key=?').run(key);return true;}
 async authenticate(token){if(!token)return null;const row=this.db.prepare('SELECT u.id,u.email,u.full_name,u.role,u.active FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(tokenHash(token),Date.now());return decode(row);}
 async login(email,password){email=String(email).trim().toLowerCase();const row=this.db.prepare('SELECT * FROM users WHERE email=?').get(email);const dummy='00112233445566778899aabbccddeeff:'+ '0'.repeat(128);const correct=await verifyPassword(password,row?.password_hash||dummy);if(!row||!correct)throw new ApiError(401,'Email or password is incorrect.');if(!row.active)throw new ApiError(403,'Your company account is inactive. Contact your administrator.');this.db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());const token=crypto.randomBytes(32).toString('base64url');this.insert('sessions',{token_hash:tokenHash(token),user_id:row.id,expires_at:Date.now()+12*3600*1000});this.audit(row,'sign-in','users',row.id,'Signed in to the internal training system.');return {token,user:{id:row.id,email:row.email,full_name:row.full_name,role:row.role,active:true}};}
 async logout(token){if(token)this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));}
 async register(){throw new ApiError(403,'This internal system requires an administrator invitation.');}

 async users(){return this.db.prepare('SELECT id,email,full_name,role,active,created_at FROM users ORDER BY created_at').all().map(decode);}
 async updateUser(target,changes,actor){const old=this.db.prepare('SELECT * FROM users WHERE id=?').get(target);if(!old)throw new ApiError(404,'User not found.');if(old.role==='admin'&&old.active&&(changes.role!=='admin'||!changes.active)){const n=this.db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND active=1 AND id<>?").get(target).n;if(!n)throw new ApiError(400,'You cannot deactivate or demote the last administrator.');}
 this.db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(changes.role,Number(changes.active),target);this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(target);this.insert('audit_log',{id:id(),actor:actor.email,action:'permissions',entity:'users',entity_id:target,details:`Role: ${changes.role}; access: ${changes.active?'active':'inactive'}`,created_at:new Date().toISOString()});return {ok:true};}
 close(){this.db.close();}
}
