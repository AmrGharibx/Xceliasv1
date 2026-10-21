import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {id,TABLES,emptyState,today} from '../public/modules/core.mjs';
import {ApiError,isId} from './validation.mjs';
import {liveConfidenceSummary} from './activity-live-confidence.mjs';
import {livePlayerStandings} from './activity-live-competition.mjs';
import {liveRoster,liveJoinIdentity,liveProfileReview,livePlayerProfile} from './activity-live-roster.mjs';
import {activitySessionDate,recordActivityPresence} from './activity-outcomes.mjs';
import {activityCohortPulse,activityPracticeInsights,studioLibrary,studioQuiz,studioFacilitatorDeck,publicQuiz,gradeStudioQuiz,validateStudioQuizDraft,liveRoomQuestionView} from './activity-studio.mjs';
import {cairoSessionDayNumber,nextCairoMidnight,normalizeActivationCode,sanitizeP256PublicKey,isBatchQrReference,verifyP256Challenge,evaluateVenueLocation} from '../public/modules/qr-attendance-core.mjs';
const scrypt=promisify(crypto.scrypt);
function secretMatches(token,hash) {if(typeof token!=='string'||token.length>256)return false;const actual=Buffer.from(tokenHash(token),'hex'),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>256)throw new ApiError(400,'Use a password between 12 and 256 characters.');const salt=crypto.randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64);return `${salt}:${hash.toString('hex')}`;}
export async function verifyPassword(password,stored){try{const[salt,hash]=stored.split(':');const actual=await scrypt(password,salt,64);const expected=Buffer.from(hash,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}catch{return false;}}
export const tokenHash=t=>crypto.createHash('sha256').update(t).digest('hex');
function serialize(key,value){return ['days','session_dates','snapshot','source_meta','summary','properties','relations','app_records','source_ids','learner_answers','learner_draft_answers','deck_snapshot','content_json','outline_json'].includes(key)?JSON.stringify(value):typeof value==='boolean'?Number(value):value;}
function decode(row){if(!row)return null;row={...row};for(const key of ['days','session_dates','snapshot','source_meta','summary','properties','relations','app_records','source_ids','learner_answers','learner_draft_answers','deck_snapshot','content_json','outline_json'])if(typeof row[key]==='string')row[key]=JSON.parse(row[key]);for(const key of ['is_late','active','analytics_included','assessment_day','revealed'])if(key in row)row[key]=!!row[key];return row;}
function ensureColumn(db,table,column,definition){if(!db.prepare(`PRAGMA table_info(${table})`).all().some(row=>row.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}
function liveRoomTeamNames(room,deck){const names=Array.isArray(deck?.team_names)?deck.team_names:[room.team_one,room.team_two];return names.filter(name=>typeof name==='string'&&name.trim()).slice(0,4);}
function migrateLiveRoomTeamLimit(db){const sql=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activity_live_players'").get()?.sql||'';if(!/team_no\s+IN\s*\(\s*1\s*,\s*2\s*\)/i.test(sql))return;db.exec('PRAGMA foreign_keys=OFF');try{db.exec(`BEGIN IMMEDIATE;
CREATE TABLE activity_live_players_new (
 id TEXT PRIMARY KEY,
 room_id TEXT NOT NULL REFERENCES activity_live_rooms(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64),
 nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 24),
 team_no INTEGER NOT NULL CHECK(team_no BETWEEN 1 AND 4),
 points INTEGER NOT NULL DEFAULT 0 CHECK(points>=0),
 streak INTEGER NOT NULL DEFAULT 0 CHECK(streak>=0),
 joined_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 UNIQUE(room_id,id)
);
INSERT INTO activity_live_players_new(id,room_id,token_hash,nickname,team_no,points,streak,joined_at,last_seen_at)
 SELECT id,room_id,token_hash,nickname,team_no,points,streak,joined_at,last_seen_at FROM activity_live_players;
DROP TABLE activity_live_players;
 ALTER TABLE activity_live_players_new RENAME TO activity_live_players;
 CREATE INDEX ix_activity_live_players_room ON activity_live_players(room_id,team_no,points DESC);
 COMMIT;`);}catch(error){try{db.exec('ROLLBACK');}catch{}throw error;}finally{db.exec('PRAGMA foreign_keys=ON');}const violations=db.prepare('PRAGMA foreign_key_check').all();if(violations.length)throw new Error('Live-room team migration found a foreign-key inconsistency.');}
function migrateNeverStartedEnrollment(db){
 const sql=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='trainees'").get()?.sql||'';
 if(!/Never Started/i.test(sql)){
  db.exec('PRAGMA foreign_keys=OFF');
  try{db.exec(`BEGIN IMMEDIATE;
DROP TRIGGER IF EXISTS batch_guard;
CREATE TABLE trainees_new (
 id TEXT PRIMARY KEY, trainee_name TEXT NOT NULL, company_id TEXT REFERENCES companies(id) ON DELETE RESTRICT,
 batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE, email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',
 job_title TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', enrollment_status TEXT NOT NULL DEFAULT 'Active' CHECK(enrollment_status IN ('Active','Stopped Attending','Never Started')),
 source_id TEXT, source_meta TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(source_meta)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(id,batch_id)
);
INSERT INTO trainees_new(id,trainee_name,company_id,batch_id,email,phone,job_title,notes,enrollment_status,source_id,source_meta,version,created_at,updated_at)
 SELECT id,trainee_name,company_id,batch_id,email,phone,job_title,notes,enrollment_status,source_id,source_meta,version,created_at,updated_at FROM trainees;
DROP TABLE trainees;
ALTER TABLE trainees_new RENAME TO trainees;
COMMIT;`);}catch(error){try{db.exec('ROLLBACK');}catch{}throw error;}finally{db.exec('PRAGMA foreign_keys=ON');}
  const violations=db.prepare('PRAGMA foreign_key_check').all();if(violations.length)throw new Error('Never-started enrollment migration found a foreign-key inconsistency.');
 }
 db.exec(`CREATE INDEX IF NOT EXISTS ix_trainee_batch ON trainees(batch_id);
CREATE INDEX IF NOT EXISTS ix_trainee_company ON trainees(company_id);
DROP TRIGGER IF EXISTS trainee_capacity;
CREATE TRIGGER trainee_capacity BEFORE INSERT ON trainees BEGIN
 SELECT CASE WHEN NEW.enrollment_status<>'Never Started' AND (SELECT COUNT(*) FROM trainees WHERE batch_id=NEW.batch_id AND enrollment_status<>'Never Started')>=(SELECT capacity FROM batches WHERE id=NEW.batch_id)
 THEN RAISE(ABORT,'Batch is at capacity.') END; END;
DROP TRIGGER IF EXISTS trainee_capacity_update;
CREATE TRIGGER trainee_capacity_update BEFORE UPDATE OF enrollment_status ON trainees
 WHEN OLD.enrollment_status='Never Started' AND NEW.enrollment_status<>'Never Started' BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM trainees WHERE batch_id=NEW.batch_id AND id<>NEW.id AND enrollment_status<>'Never Started')>=(SELECT capacity FROM batches WHERE id=NEW.batch_id)
 THEN RAISE(ABORT,'Batch is at capacity.') END; END;
DROP TRIGGER IF EXISTS trainee_batch_immutable;
CREATE TRIGGER trainee_batch_immutable BEFORE UPDATE OF batch_id ON trainees
 WHEN NEW.batch_id IS NOT OLD.batch_id BEGIN SELECT RAISE(ABORT,'Create a new enrollment to change batches.'); END;
DROP TRIGGER IF EXISTS batch_guard;
CREATE TRIGGER batch_guard BEFORE UPDATE ON batches BEGIN
 SELECT CASE WHEN NEW.capacity<(SELECT COUNT(*) FROM trainees WHERE batch_id=OLD.id AND enrollment_status<>'Never Started') THEN RAISE(ABORT,'Batch capacity cannot be lower than enrollment.') END;
 SELECT CASE WHEN OLD.source_id IS NULL AND EXISTS(SELECT 1 FROM trainees WHERE batch_id=OLD.id) AND (NEW.start_date<>OLD.start_date OR NEW.end_date<>OLD.end_date OR NEW.session_dates<>OLD.session_dates) THEN RAISE(ABORT,'Enrolled batch dates are locked.') END;
END;`);
}
export class SQLiteRepository {
 constructor(filename){
  if(filename!==':memory:')fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true,mode:0o700});
  this.db=new DatabaseSync(filename);
  const version=this.db.prepare('PRAGMA user_version').get().user_version;
  if(version&&version<3){this.db.close();throw new Error('This is an older RED database. Use the imported v3 database in a fresh folder; do not copy a v2 database over it. Keep a backup of your older workspace.');}
  if(filename!==':memory:'){try{fs.chmodSync(filename,0o600);}catch{}}
  this.db.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  ensureColumn(this.db,'trainees','enrollment_status',"TEXT NOT NULL DEFAULT 'Active' CHECK(enrollment_status IN ('Active','Stopped Attending','Never Started'))");
  migrateNeverStartedEnrollment(this.db);
  ensureColumn(this.db,'daily_attendance','assessment_day','INTEGER NOT NULL DEFAULT 0 CHECK(assessment_day IN (0,1))');
  ensureColumn(this.db,'batches','archived_at','TEXT');
  ensureColumn(this.db,'batches','archived_by','TEXT');
  ensureColumn(this.db,'activity_assignment_participants','learner_code_hash','TEXT');
  ensureColumn(this.db,'activity_assignment_participants','learner_answers',"TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(learner_answers))");
  ensureColumn(this.db,'activity_assignment_participants','learner_draft_answers',"TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(learner_draft_answers))");
  ensureColumn(this.db,'activity_assignment_participants','learner_draft_index','INTEGER NOT NULL DEFAULT 0 CHECK(learner_draft_index>=0)');
  ensureColumn(this.db,'activity_assignment_participants','learner_draft_updated_at','TEXT');
  ensureColumn(this.db,'activity_assignment_participants','learner_draft_version','INTEGER NOT NULL DEFAULT 0 CHECK(learner_draft_version>=0)');
  ensureColumn(this.db,'activity_assignment_participants','learner_submitted_at','TEXT');
  ensureColumn(this.db,'activity_assignment_participants','correct_count','INTEGER CHECK(correct_count IS NULL OR correct_count>=0)');
  ensureColumn(this.db,'activity_assignment_participants','earned_xp','INTEGER NOT NULL DEFAULT 0 CHECK(earned_xp>=0)');
  ensureColumn(this.db,'activity_session_plans','linked_assignment_id','TEXT');
  ensureColumn(this.db,'activity_live_answers','confidence',"TEXT CHECK(confidence IS NULL OR confidence IN ('tentative','confident'))");
  ensureColumn(this.db,'activity_live_players','trainee_id','TEXT');
  ensureColumn(this.db,'activity_live_rooms','profile_results_saved_at','TEXT');
  ensureColumn(this.db,'activity_live_profile_results','earned_xp','INTEGER NOT NULL DEFAULT 0 CHECK(earned_xp>=0)');
  ensureColumn(this.db,'activity_live_profile_results','session_date','TEXT');
  ensureColumn(this.db,'activity_live_profile_results','attendance_status','TEXT');
  this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS ix_activity_learner_code ON activity_assignment_participants(learner_code_hash) WHERE learner_code_hash IS NOT NULL; CREATE UNIQUE INDEX IF NOT EXISTS ix_activity_session_plan_assignment ON activity_session_plans(linked_assignment_id) WHERE linked_assignment_id IS NOT NULL; CREATE UNIQUE INDEX IF NOT EXISTS ix_qr_attendance_active_public_key ON qr_attendance_enrollments(public_key) WHERE revoked_at IS NULL; PRAGMA user_version = 19');
 }

 async init() {
  migrateLiveRoomTeamLimit(this.db);
  ensureColumn(this.db,'activity_live_players','trainee_id','TEXT');
  this.db.exec('PRAGMA user_version = 19');
  // Business data is NEVER seeded, even when an old environment requests it.
  this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
  this.db.prepare('DELETE FROM rate_limits WHERE window_start < ?').run(Date.now()-86400000);
  const qrRetentionCutoff=new Date(Date.now()-90*86400000).toISOString();
  this.db.prepare("DELETE FROM qr_attendance_challenges WHERE expires_at < ?").run(new Date(Date.now()-86400000).toISOString());
  this.db.prepare("DELETE FROM qr_attendance_activation_codes WHERE expires_at < ? AND consumed_at IS NULL").run(qrRetentionCutoff);
  this.db.prepare("DELETE FROM qr_attendance_location_reviews WHERE status='resolved' AND resolved_at < ?").run(qrRetentionCutoff);
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
 qrBatchQrRow(batchId){return this.db.prepare('SELECT * FROM qr_attendance_batch_links WHERE batch_id=? AND active=1').get(batchId)||null;}
 qrBatchLinkContext(batchQrId,requireSession=true){
  if(!isBatchQrReference(batchQrId))throw new ApiError(404,'This batch QR is invalid or no longer active.');
  const link=this.db.prepare('SELECT * FROM qr_attendance_batch_links WHERE batch_qr_id=? AND active=1').get(batchQrId);
  if(!link)throw new ApiError(404,'This batch QR is invalid or no longer active.');
  const batch=this.db.prepare('SELECT * FROM batches WHERE id=?').get(link.batch_id);
  if(!batch||batch.status!=='Active'||batch.archived_at)throw new ApiError(409,'This batch is not accepting QR attendance. Ask the trainer for help.');
  const session=this.db.prepare('SELECT * FROM qr_attendance_sessions WHERE batch_id=? AND closed_at IS NULL ORDER BY opened_at DESC LIMIT 1').get(batch.id);
  const now=new Date(),nowIso=now.toISOString();
  if(requireSession&&(!session||session.session_date!==today(now)||session.expires_at<=nowIso))throw new ApiError(409,'There is no open attendance session for this batch right now. Ask your trainer.');
  if(session&&(!cairoSessionDayNumber(batch.session_dates,session.session_date)||session.session_date!==today(now)||session.expires_at<=nowIso))return {link,batch,session:null};
  return {link,batch,session:session||null};
 }
 async qrEnsureBatchLink({batchId},user){
  const batch=this.db.prepare('SELECT id,status,archived_at FROM batches WHERE id=?').get(batchId);
  if(!batch||batch.archived_at)throw new ApiError(404,'No active batch was found.');
  const current=this.qrBatchQrRow(batchId);if(current)return {batchQrId:current.batch_qr_id,created:false};
  const now=new Date().toISOString(),row={id:id(),batch_id:batchId,batch_qr_id:crypto.randomBytes(24).toString('base64url'),active:1,created_by:user.email,created_at:now,revoked_at:null,rotated_from:null};
  this.db.exec('BEGIN IMMEDIATE');try{const again=this.qrBatchQrRow(batchId);if(again){this.db.exec('COMMIT');return {batchQrId:again.batch_qr_id,created:false};}this.insert('qr_attendance_batch_links',row);this.audit(user,'create-batch-qr','qr_attendance_batch_links',row.id,'Created the stable batch QR attendance reference.');this.db.exec('COMMIT');return {batchQrId:row.batch_qr_id,created:true};}catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrRotateBatchLink({batchId},user){
  const batch=this.db.prepare('SELECT id,archived_at FROM batches WHERE id=?').get(batchId);if(!batch||batch.archived_at)throw new ApiError(404,'No active batch was found.');
  const now=new Date().toISOString(),newLink={id:id(),batch_id:batchId,batch_qr_id:crypto.randomBytes(24).toString('base64url'),active:1,created_by:user.email,created_at:now,revoked_at:null,rotated_from:null};
  this.db.exec('BEGIN IMMEDIATE');try{const old=this.qrBatchQrRow(batchId);if(old){newLink.rotated_from=old.id;this.db.prepare('UPDATE qr_attendance_batch_links SET active=0,revoked_at=? WHERE id=? AND active=1').run(now,old.id);}this.insert('qr_attendance_batch_links',newLink);this.audit(user,'rotate-batch-qr','qr_attendance_batch_links',newLink.id,'Rotated a stable batch QR reference; the previous print was revoked.');this.db.exec('COMMIT');return {batchQrId:newLink.batch_qr_id,created:true};}catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrVenues(){return {venues:this.db.prepare('SELECT id,name,latitude,longitude,radius_m,active,is_default,created_at,updated_at FROM qr_attendance_venues ORDER BY is_default DESC,name COLLATE NOCASE').all().map(row=>({...row,active:!!row.active,is_default:!!row.is_default}))};}
 async qrUpsertVenue(input,user){
  const now=new Date().toISOString(),venueId=input.id||id();this.db.exec('BEGIN IMMEDIATE');try{
   const existing=this.db.prepare('SELECT id,created_at FROM qr_attendance_venues WHERE id=?').get(venueId);
   if(input.id&&!existing)throw new ApiError(404,'No configured venue was found.');
   if(existing)this.db.prepare('UPDATE qr_attendance_venues SET name=?,latitude=?,longitude=?,radius_m=?,active=?,updated_at=? WHERE id=?').run(input.name,input.latitude,input.longitude,input.radius_m,Number(input.active),now,venueId);
   else this.insert('qr_attendance_venues',{id:venueId,name:input.name,latitude:input.latitude,longitude:input.longitude,radius_m:input.radius_m,active:Number(input.active),is_default:0,created_by:user.email,created_at:now,updated_at:now});
   this.audit(user,'configure-qr-venue','qr_attendance_venues',venueId,'Updated a private QR attendance venue.');this.db.exec('COMMIT');return {venue:{id:venueId,name:input.name,latitude:input.latitude,longitude:input.longitude,radius_m:input.radius_m,active:input.active,is_default:venueId==='academy-default',updated_at:now}};
  }catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrIssueCode({traineeId,action},user){
  const trainee=this.db.prepare('SELECT t.id,t.trainee_name,t.batch_id,t.enrollment_status,b.status batch_status,b.archived_at FROM trainees t JOIN batches b ON b.id=t.batch_id WHERE t.id=?').get(traineeId);
  if(!trainee||trainee.enrollment_status!=='Active'||trainee.batch_status!=='Active'||trainee.archived_at)throw new ApiError(404,'No active trainee enrollment was found.');
  const bytes=crypto.randomBytes(10);let value=BigInt(`0x${bytes.toString('hex')}`),plain='';const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';for(let i=0;i<16;i++){plain=alphabet[Number(value&31n)]+plain;value>>=5n;}
  const formatted=plain.match(/.{4}/g).join('-'),hash=tokenHash(plain),now=new Date(),issuedAt=now.toISOString(),expiresAt=new Date(now.getTime()+30*86400000).toISOString(),codeId=id();
  this.db.exec('BEGIN IMMEDIATE');try{
   const current=this.db.prepare('SELECT * FROM qr_attendance_activation_codes WHERE trainee_id=? AND consumed_at IS NULL AND revoked_at IS NULL').get(traineeId);
   if(current&&action==='issue')throw new ApiError(409,'An unused activation code already exists. Reissue it only if the trainee needs a replacement.');
   if(action==='reissue'){this.db.prepare('UPDATE qr_attendance_activation_codes SET revoked_at=? WHERE trainee_id=? AND consumed_at IS NULL AND revoked_at IS NULL').run(issuedAt,traineeId);this.db.prepare('UPDATE qr_attendance_enrollments SET revoked_at=?,revoked_by=? WHERE trainee_id=? AND revoked_at IS NULL').run(issuedAt,user.email,traineeId);}
   else if(this.db.prepare('SELECT id FROM qr_attendance_enrollments WHERE trainee_id=? AND revoked_at IS NULL').get(traineeId))throw new ApiError(409,'This trainee already has an enrolled device. Reissue the code only when reception is replacing that device.');
   const row={id:codeId,trainee_id:traineeId,batch_id:trainee.batch_id,code_hash:hash,issued_by:user.email,issued_at:issuedAt,expires_at:expiresAt,consumed_at:null,revoked_at:null,enrollment_id:null};this.insert('qr_attendance_activation_codes',row);
   this.audit(user,action==='reissue'?'reissue-qr-activation-code':'issue-qr-activation-code','trainees',traineeId,'Issued a one-time QR identity activation code. The code is not stored in plaintext.');this.db.exec('COMMIT');return {activationCode:formatted,expiresAt};
  }catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrSessionState({batchId,date}){
  const batch=this.db.prepare('SELECT * FROM batches WHERE id=?').get(batchId);if(!batch)throw new ApiError(404,'No batch was found.');
  const session=this.db.prepare('SELECT * FROM qr_attendance_sessions WHERE batch_id=? AND session_date=? ORDER BY opened_at DESC LIMIT 1').get(batchId,date)||null;
  const total=this.db.prepare("SELECT COUNT(*) count FROM trainees WHERE batch_id=? AND enrollment_status='Active'").get(batchId).count;
  const checkedIn=this.db.prepare("SELECT COUNT(*) count FROM daily_attendance WHERE batch_id=? AND date=? AND status IN ('Present','Tour Day')").get(batchId,date).count;
  const locationReviewCount=session?this.db.prepare("SELECT COUNT(*) count FROM qr_attendance_location_reviews WHERE session_id=? AND status='open'").get(session.id).count:0;
  const checkins=this.db.prepare('SELECT d.trainee_id,d.arrival_time,d.status,d.source_meta,t.trainee_name FROM daily_attendance d JOIN trainees t ON t.id=d.trainee_id WHERE d.batch_id=? AND d.date=? ORDER BY t.trainee_name COLLATE NOCASE').all(batchId,date).map(row=>({traineeName:row.trainee_name,status:row.status,arrivalTime:row.arrival_time,locationStatus:row.source_meta&&JSON.parse(row.source_meta).method==='qr'?'verified':'manual'}));
  return {session:session?{id:session.id,batchName:batch.batch_name,dayNumber:session.day_number,date:session.session_date,expiresAt:session.expires_at,venueName:session.venue_name,closed:!!session.closed_at}:null,checkedIn,total,locationReviewCount,checkins};
 }
 async qrOpenSession({batchId,date,venueId},user){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(`${date}T12:00:00Z`))||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date)throw new ApiError(400,'Choose a valid session date.');
  const batch=this.db.prepare('SELECT * FROM batches WHERE id=?').get(batchId);if(!batch||batch.archived_at||batch.status!=='Active')throw new ApiError(409,'Only an active batch can take QR attendance.');
  if(date!==today()){if(date>today())throw new ApiError(409,'A QR attendance session can only open for today.');throw new ApiError(400,'Choose today’s scheduled training date.');}
  const dayNumber=cairoSessionDayNumber(batch.session_dates,date);if(!dayNumber)throw new ApiError(400,'This date is not scheduled for the selected batch.');
  const selectedId=venueId||'academy-default',venue=this.db.prepare('SELECT * FROM qr_attendance_venues WHERE id=? AND active=1').get(selectedId);if(!venue)throw new ApiError(400,'Choose an active configured training venue.');
  const now=new Date().toISOString(),sessionId=id(),expiresAt=nextCairoMidnight(date);
  this.db.exec('BEGIN IMMEDIATE');try{
   this.db.prepare("UPDATE qr_attendance_sessions SET closed_at=expires_at,version=version+1 WHERE batch_id=? AND closed_at IS NULL AND expires_at<=?").run(batchId,now);
   if(this.db.prepare('SELECT id FROM qr_attendance_sessions WHERE batch_id=? AND closed_at IS NULL').get(batchId))throw new ApiError(409,'Close the current QR attendance session before opening another.');
   this.insert('qr_attendance_sessions',{id:sessionId,batch_id:batchId,venue_id:venue.id,session_date:date,day_number:dayNumber,venue_name:venue.name,venue_latitude:venue.latitude,venue_longitude:venue.longitude,radius_m:venue.radius_m,created_by:user.email,opened_at:now,closed_at:null,expires_at:expiresAt,version:1});
   this.audit(user,'open-qr-attendance-session','qr_attendance_sessions',sessionId,`Opened the QR attendance session for ${date}.`);this.db.exec('COMMIT');return {id:sessionId,dayNumber,date,expiresAt,venueName:venue.name};
  }catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrCloseSession({id:sessionId},user){
  const now=new Date().toISOString();this.db.exec('BEGIN IMMEDIATE');try{const session=this.db.prepare('SELECT id,batch_id,session_date,closed_at FROM qr_attendance_sessions WHERE id=?').get(sessionId);if(!session)throw new ApiError(404,'No QR attendance session was found.');if(session.closed_at)throw new ApiError(409,'This QR attendance session is already closed.');this.db.prepare('UPDATE qr_attendance_sessions SET closed_at=?,version=version+1 WHERE id=? AND closed_at IS NULL').run(now,sessionId);this.audit(user,'close-qr-attendance-session','qr_attendance_sessions',sessionId,`Closed the QR attendance session for ${session.session_date}.`);this.db.exec('COMMIT');return {ok:true,closedAt:now};}catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrSessionInfo({batchQrId,credentialId}){
  const {batch,session}=this.qrBatchLinkContext(batchQrId,false);
  let participant=null;
  if(typeof credentialId==='string'&&isId(credentialId)){
   const enrollment=this.db.prepare('SELECT id,trainee_id FROM qr_attendance_enrollments WHERE id=? AND batch_id=? AND revoked_at IS NULL').get(credentialId,batch.id);
   if(!enrollment)participant={active:false};
   else if(session){const attendance=this.db.prepare('SELECT status,arrival_time,source_meta FROM daily_attendance WHERE trainee_id=? AND batch_id=? AND date=? AND source_id IS NULL').get(enrollment.trainee_id,batch.id,session.session_date);let sourceMeta={};try{sourceMeta=JSON.parse(attendance?.source_meta||'{}');}catch{}const qrPresent=attendance?.status==='Present'&&sourceMeta.method==='qr';participant={active:true,checkedIn:!!qrPresent,recordedElsewhere:!!attendance&&!qrPresent,arrivalTime:qrPresent?attendance.arrival_time:null};}
   else participant={active:true,checkedIn:false,recordedElsewhere:false,arrivalTime:null};
  }
  return {batchName:batch.batch_name,currentSession:session?{id:session.id,dayNumber:session.day_number,date:session.session_date,expiresAt:session.expires_at}:null,...(participant?{participant}:{}),locationNotice:'Your location is checked during check-in to confirm you are near the Academy. Check-ins attempted from outside the training area are flagged for staff review. If you are on-site but your location seems wrong, contact reception.'};
 }
 async qrEnroll({batchQrId,activationCode,publicKey}){
  const {link,batch,session}=this.qrBatchLinkContext(batchQrId,true);if(!session)throw new ApiError(409,'There is no open attendance session. Ask your trainer to open today’s session.');
  const normalized=normalizeActivationCode(activationCode),key=sanitizeP256PublicKey(publicKey);if(!normalized||!key)throw new ApiError(400,'Enter the private activation code provided by reception.');
  const hash=tokenHash(normalized),now=new Date(),nowIso=now.toISOString(),keyJson=JSON.stringify(key);
  this.db.exec('BEGIN IMMEDIATE');try{
   const code=this.db.prepare('SELECT * FROM qr_attendance_activation_codes WHERE code_hash=? AND batch_id=?').get(hash,batch.id);
   if(!code)throw new ApiError(401,'The private code is invalid or belongs to a different batch. Ask reception for help.');
   if(code.consumed_at&&code.enrollment_id){const old=this.db.prepare('SELECT e.id,e.public_key,e.revoked_at,t.trainee_name FROM qr_attendance_enrollments e JOIN trainees t ON t.id=e.trainee_id WHERE e.id=? AND e.batch_id=?').get(code.enrollment_id,batch.id);if(old&&!old.revoked_at&&old.public_key===keyJson){this.db.exec('COMMIT');return {credentialId:old.id,traineeName:old.trainee_name,alreadyEnrolled:true};}throw new ApiError(409,'This code has already been used on another device. Ask reception for a replacement.');}
   if(code.revoked_at||code.expires_at<=nowIso||code.consumed_at)throw new ApiError(401,'This private code has expired or was already used. Ask reception for help.');
   const trainee=this.db.prepare('SELECT * FROM trainees WHERE id=? AND batch_id=? AND enrollment_status=?').get(code.trainee_id,batch.id,'Active');if(!trainee)throw new ApiError(401,'This code is not linked to an active trainee in this batch.');
   const existing=this.db.prepare('SELECT id FROM qr_attendance_enrollments WHERE trainee_id=? AND revoked_at IS NULL').get(trainee.id);if(existing)throw new ApiError(409,'This trainee already has an enrolled device. Reception must issue a replacement code first.');
   const enrollmentId=id();this.insert('qr_attendance_enrollments',{id:enrollmentId,trainee_id:trainee.id,batch_id:batch.id,public_key:keyJson,created_at:nowIso,last_used_at:null,revoked_at:null,revoked_by:null});
   this.db.prepare('UPDATE qr_attendance_activation_codes SET consumed_at=?,enrollment_id=? WHERE id=? AND consumed_at IS NULL AND revoked_at IS NULL').run(nowIso,enrollmentId,code.id);
   this.audit({email:'QR participant',id:'system'},'enroll-qr-device','qr_attendance_enrollments',enrollmentId,'A one-time activation code enrolled a browser key.');this.db.exec('COMMIT');return {credentialId:enrollmentId,traineeName:trainee.trainee_name,alreadyEnrolled:false};
  }catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 async qrChallenge({batchQrId,credentialId}){
  const {batch,session}=this.qrBatchLinkContext(batchQrId,true);if(!session)throw new ApiError(409,'There is no open attendance session. Ask your trainer for help.');
  const enrollment=this.db.prepare('SELECT e.id,e.public_key,t.trainee_name,t.enrollment_status FROM qr_attendance_enrollments e JOIN trainees t ON t.id=e.trainee_id WHERE e.id=? AND e.batch_id=? AND e.revoked_at IS NULL').get(credentialId,batch.id);
  if(!enrollment||enrollment.enrollment_status!=='Active')throw new ApiError(401,'This device is not enrolled. Ask reception to set it up.');
  const challenge=crypto.randomBytes(32).toString('base64url'),now=new Date(),createdAt=now.toISOString(),expiresAt=new Date(now.getTime()+2*60*1000).toISOString(),challengeId=id();
  this.insert('qr_attendance_challenges',{id:challengeId,session_id:session.id,enrollment_id:enrollment.id,challenge_hash:tokenHash(challenge),created_at:createdAt,expires_at:expiresAt,consumed_at:null});
  return {challengeId,challenge,currentSession:{date:session.session_date,dayNumber:session.day_number,expiresAt:session.expires_at},traineeName:enrollment.trainee_name};
 }
 async qrCheckIn({batchQrId,credentialId,challengeId,challenge,signature,location}){
  const {batch,session}=this.qrBatchLinkContext(batchQrId,true);if(!session)throw new ApiError(409,'There is no open attendance session. Ask your trainer for help.');
  const enrollment=this.db.prepare('SELECT e.*,t.trainee_name,t.enrollment_status FROM qr_attendance_enrollments e JOIN trainees t ON t.id=e.trainee_id WHERE e.id=? AND e.batch_id=? AND e.revoked_at IS NULL').get(credentialId,batch.id);
  if(!enrollment||enrollment.enrollment_status!=='Active')throw new ApiError(401,'This device is not enrolled. Ask reception to set it up.');
  const proof=this.db.prepare('SELECT * FROM qr_attendance_challenges WHERE id=? AND session_id=? AND enrollment_id=?').get(challengeId,session.id,enrollment.id),now=new Date(),nowIso=now.toISOString();
  if(!proof||proof.consumed_at||proof.expires_at<=nowIso)throw new ApiError(409,'This check-in attempt expired or was already used. Tap “I’m here” to try again.');
  if(!secretMatches(challenge,proof.challenge_hash))throw new ApiError(401,'Your device check could not be verified. Try again.');
  if(!await verifyP256Challenge(JSON.parse(enrollment.public_key),challenge,signature))throw new ApiError(401,'Your device check could not be verified. Try again or ask reception for help.');
  const locationResult=evaluateVenueLocation(location,{latitude:session.venue_latitude,longitude:session.venue_longitude,radius_m:session.radius_m});
  let conflictMessage=null,result;
  this.db.exec('BEGIN IMMEDIATE');try{
   const fresh=this.qrBatchLinkContext(batchQrId,true),freshEnrollment=this.db.prepare('SELECT e.*,t.trainee_name,t.enrollment_status FROM qr_attendance_enrollments e JOIN trainees t ON t.id=e.trainee_id WHERE e.id=? AND e.batch_id=? AND e.revoked_at IS NULL').get(credentialId,batch.id);
   const freshProof=this.db.prepare('SELECT * FROM qr_attendance_challenges WHERE id=? AND session_id=? AND enrollment_id=?').get(challengeId,fresh.session.id,credentialId);
   if(!freshEnrollment||freshEnrollment.enrollment_status!=='Active')throw new ApiError(401,'This device is no longer enrolled. Ask reception for help.');
   if(!freshProof||freshProof.consumed_at||freshProof.expires_at<=new Date().toISOString())throw new ApiError(409,'This check-in attempt expired or was already used. Tap “I’m here” to try again.');
   if(!secretMatches(challenge,freshProof.challenge_hash))throw new ApiError(401,'Your device check could not be verified. Try again.');
   this.db.prepare('UPDATE qr_attendance_challenges SET consumed_at=? WHERE id=? AND consumed_at IS NULL').run(nowIso,challengeId);
   this.db.prepare('UPDATE qr_attendance_enrollments SET last_used_at=? WHERE id=?').run(nowIso,credentialId);
   const existing=this.db.prepare('SELECT * FROM daily_attendance WHERE trainee_id=? AND batch_id=? AND date=? AND source_id IS NULL').get(freshEnrollment.trainee_id,batch.id,fresh.session.session_date);
   if(existing){
    let sourceMeta={};try{sourceMeta=JSON.parse(existing.source_meta||'{}');}catch{}
    if(existing.status==='Present'&&sourceMeta.method==='qr')result={attendance:{id:existing.id,status:existing.status,arrivalTime:existing.arrival_time},alreadyCheckedIn:true};
    else conflictMessage='An attendance record already exists for today. Your existing attendance was left unchanged. Ask your trainer if it needs correction.';
   }else if(locationResult.accepted){
    const row={id:id(),trainee_id:freshEnrollment.trainee_id,batch_id:batch.id,date:fresh.session.session_date,arrival_time:nowIso,departure_time:null,status:'Present',is_late:0,assessment_day:0,absence_reason:'',analytics_included:1,source_id:null,source_meta:{method:'qr',qr_session_id:fresh.session.id},version:1,created_at:nowIso,updated_at:nowIso};
    this.insert('daily_attendance',row);result={attendance:{id:row.id,status:row.status,arrivalTime:row.arrival_time},alreadyCheckedIn:false};
   }else{
    const openReview=this.db.prepare("SELECT id,attempt_count FROM qr_attendance_location_reviews WHERE session_id=? AND trainee_id=? AND status='open'").get(fresh.session.id,freshEnrollment.trainee_id);
    if(openReview)this.db.prepare('UPDATE qr_attendance_location_reviews SET reason=?,accuracy_band=?,distance_band=?,attempt_count=attempt_count+1,updated_at=? WHERE id=?').run(locationResult.reason,locationResult.accuracyBand,locationResult.distanceBand,nowIso,openReview.id);
    else this.insert('qr_attendance_location_reviews',{id:id(),session_id:fresh.session.id,batch_id:batch.id,trainee_id:freshEnrollment.trainee_id,reason:locationResult.reason,accuracy_band:locationResult.accuracyBand,distance_band:locationResult.distanceBand,attempt_count:1,status:'open',resolution:null,resolved_by:null,resolved_at:null,created_at:nowIso,updated_at:nowIso});
    result={attendance:null,reviewRequired:true,reason:locationResult.reason,message:'Your location could not confirm that you are near the training venue. The attempt is flagged for staff review. If you are on-site, please contact reception.'};
   }
   this.db.exec('COMMIT');
  }catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
  if(conflictMessage)throw new ApiError(409,conflictMessage);
  return result;
 }
 async qrLocationReviews({batchId,date}){
  const rows=this.db.prepare(`SELECT r.id,r.session_id,r.reason,r.accuracy_band,r.distance_band,r.attempt_count,r.status,r.resolution,r.resolved_by,r.resolved_at,r.created_at,r.updated_at,t.trainee_name,b.batch_name,s.day_number,s.session_date
   FROM qr_attendance_location_reviews r JOIN trainees t ON t.id=r.trainee_id JOIN batches b ON b.id=r.batch_id JOIN qr_attendance_sessions s ON s.id=r.session_id
   WHERE r.batch_id=? AND s.session_date=? AND r.status='open' ORDER BY r.created_at DESC`).all(batchId,date);
  return {items:rows.map(row=>({id:row.id,traineeName:row.trainee_name,batchName:row.batch_name,dayNumber:row.day_number,date:row.session_date,attemptedAt:row.created_at,reason:row.reason,accuracyBand:row.accuracy_band,distanceBand:row.distance_band,attemptCount:row.attempt_count,status:row.status}))};
 }
 async qrResolveLocationReview({reviewId,outcome},user){
  const now=new Date().toISOString();this.db.exec('BEGIN IMMEDIATE');try{const review=this.db.prepare("SELECT r.id,r.trainee_id,r.batch_id,r.session_id,r.status,s.session_date FROM qr_attendance_location_reviews r JOIN qr_attendance_sessions s ON s.id=r.session_id WHERE r.id=?").get(reviewId);if(!review)throw new ApiError(404,'No location review was found.');if(review.status!=='open')throw new ApiError(409,'This location review was already resolved.');if(outcome==='manual_attendance_recorded'&&!this.db.prepare('SELECT 1 FROM daily_attendance WHERE trainee_id=? AND batch_id=? AND date=? AND source_id IS NULL').get(review.trainee_id,review.batch_id,review.session_date))throw new ApiError(409,'Record this trainee’s attendance manually before resolving the location review.');this.db.prepare("UPDATE qr_attendance_location_reviews SET status='resolved',resolution=?,resolved_by=?,resolved_at=?,updated_at=? WHERE id=? AND status='open'").run(outcome,user.email,now,now,reviewId);this.audit(user,'resolve-qr-location-review','qr_attendance_location_reviews',reviewId,outcome==='dismissed'?'Dismissed a location review.':'Resolved a location review after using the existing manual attendance workflow.');this.db.exec('COMMIT');return {ok:true,status:'resolved',resolution:outcome,resolvedAt:now};}catch(error){try{this.db.exec('ROLLBACK');}catch{}throw error;}
 }
 customChallenges(includeArchived=false){const rows=this.db.prepare(`SELECT id,title,category,level,duration_minutes,description,content_json,created_by,created_at,archived_at FROM activity_custom_challenges ${includeArchived?'':'WHERE archived_at IS NULL'} ORDER BY created_at DESC,id`).all();return rows.map(row=>{const {content_json,...metadata}=row;return {...metadata,...JSON.parse(content_json)};});}
 activityQuiz(activityId,includeArchived=true){return studioQuiz(activityId,this.customChallenges(includeArchived));}
 async activityLibrary(){return {activities:studioLibrary(this.customChallenges())};}
 async activityFacilitatorDeck(){return {activities:studioFacilitatorDeck(this.customChallenges())};}
 async createActivityChallenge(challenge,user){
  const challengeId=`studio-${id().replaceAll('-','')}`,now=new Date().toISOString();
  const row={id:challengeId,title:challenge.title,category:challenge.category,level:challenge.level,duration_minutes:challenge.duration_minutes,description:challenge.description,content_json:{questions:challenge.questions,study_cards:challenge.study_cards,...(challenge.arabic?{arabic:challenge.arabic}:{})},created_by:user.email,created_at:now,archived_at:null};
  this.db.exec('BEGIN IMMEDIATE');
  try{this.insert('activity_custom_challenges',row);this.audit(user,'create-studio-challenge','activity_custom_challenges',challengeId,`Created the custom Academy Studio challenge “${challenge.title}”.`);this.db.exec('COMMIT');return {id:challengeId,title:challenge.title,category:challenge.category,level:challenge.level,duration_minutes:challenge.duration_minutes,description:challenge.description,created_by:user.email,created_at:now,is_custom:true};}
  catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async archiveActivityChallenge(challengeId,user){
  const row=this.db.prepare('SELECT id,title FROM activity_custom_challenges WHERE id=? AND archived_at IS NULL').get(challengeId);
  if(!row)throw new ApiError(404,'No active custom challenge was found.');
  const archivedAt=new Date().toISOString();this.db.exec('BEGIN IMMEDIATE');
  try{const changed=this.db.prepare('UPDATE activity_custom_challenges SET archived_at=? WHERE id=? AND archived_at IS NULL').run(archivedAt,challengeId);if(!changed.changes)throw new ApiError(409,'This challenge was archived by another trainer. Refresh the library.');this.audit(user,'archive-studio-challenge','activity_custom_challenges',challengeId,`Archived the custom Academy Studio challenge “${row.title}”. Existing assignments and learner links are preserved.`);this.db.exec('COMMIT');return {id:challengeId,archived_at:archivedAt};}
  catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 purgeExpiredActivityLiveRooms(){return this.db.prepare('DELETE FROM activity_live_rooms WHERE expires_at<=?').run(new Date().toISOString()).changes;}
 async activityLiveRooms(ownerId){
  this.purgeExpiredActivityLiveRooms();
  const rooms=this.db.prepare("SELECT id,activity_id,deck_snapshot,status,round_index,created_at,expires_at FROM activity_live_rooms WHERE owner_id=? AND status IN ('Open','Complete') AND expires_at>? ORDER BY created_at DESC LIMIT 8").all(ownerId,new Date().toISOString());
  return {rooms:rooms.map(room=>({id:room.id,title:JSON.parse(room.deck_snapshot).title,status:room.status,round_index:room.round_index,total_rounds:JSON.parse(room.deck_snapshot).questions.length,created_at:room.created_at,expires_at:room.expires_at,players:this.db.prepare('SELECT COUNT(*) count FROM activity_live_players WHERE room_id=?').get(room.id).count}))};
 }
 async resumeActivityLiveRoom(roomId,ownerId,codeHash){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const room=this.db.prepare('SELECT id,owner_id,status,expires_at FROM activity_live_rooms WHERE id=?').get(roomId);
   if(!room)throw new ApiError(404,'This live room has expired. Start a new room to continue.');
   if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
   if(!['Open','Complete'].includes(room.status))throw new ApiError(409,'This live room has ended. Start a new room to continue.');
   this.db.prepare('UPDATE activity_live_rooms SET code_hash=?,updated_at=? WHERE id=?').run(codeHash,new Date().toISOString(),room.id);
   this.db.exec('COMMIT');
  }catch(error){this.db.exec('ROLLBACK');throw error;}
  const state=await this.activityLiveHostState(roomId,ownerId);
  const deck=this.db.prepare('SELECT deck_snapshot FROM activity_live_rooms WHERE id=? AND owner_id=?').get(roomId,ownerId)?.deck_snapshot;
  if(!deck)throw new ApiError(404,'This live room has expired. Start a new room to continue.');
  state.activity.questions=JSON.parse(deck).questions;
  return state;
 }
 async createActivityLiveRoom(data,user){
  const activity=data.mode==='pulse'?data.pulse:studioFacilitatorDeck(this.customChallenges()).find(item=>item.id===data.activity_id);
  if(!activity)throw new ApiError(400,'Choose a challenge from the live deck.');
  const teams=Array.isArray(data.teams)?data.teams:[data.team_one,data.team_two];
  const now=new Date().toISOString();
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.db.prepare('DELETE FROM activity_live_rooms WHERE expires_at<=?').run(now);
   const roster=liveRoster(data,{batches:this.db.prepare('SELECT * FROM batches').all(),trainees:this.db.prepare('SELECT * FROM trainees').all(),companies:this.db.prepare('SELECT * FROM companies').all()});
   this.db.prepare('INSERT INTO activity_live_rooms(id,code_hash,owner_id,activity_id,deck_snapshot,team_one,team_two,timer_duration,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .run(data.id,data.code_hash,user.id,activity.id,JSON.stringify({...activity,mode:data.mode==='pulse'?'pulse':'quiz',competition_mode:data.competition_mode||'teams',team_names:teams,roster}),teams[0],teams[1]||teams[0],data.timer_duration,now,now,data.expires_at);
   this.db.exec('COMMIT');return {id:data.id,expires_at:data.expires_at};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async activityLiveInfo(codeHash){
  this.purgeExpiredActivityLiveRooms();
  const room=this.db.prepare('SELECT id,activity_id,team_one,team_two,status,timer_duration,expires_at,deck_snapshot FROM activity_live_rooms WHERE code_hash=?').get(codeHash);
  if(!room||room.expires_at<=new Date().toISOString())throw new ApiError(404,'That room code is invalid or expired. Ask your trainer for the current code.');
  if(room.status!=='Open')throw new ApiError(409,'This live room has ended. Ask your trainer to start another round.');
  const deck=JSON.parse(room.deck_snapshot),teams=liveRoomTeamNames(room,deck),counts=this.db.prepare('SELECT team_no,COUNT(*) count FROM activity_live_players WHERE room_id=? GROUP BY team_no').all(room.id);
  const roster=deck.roster||null;
  return {roster,competition_mode:deck.competition_mode||'teams',mode:deck.mode==='pulse'?'pulse':'quiz',title:deck.title,category:deck.category,level:deck.level,...(deck.arabic?{arabic:deck.arabic}:{}),total_rounds:deck.questions.length,timer_duration:room.timer_duration,teams:teams.map((name,index)=>({team_no:index+1,name,players:counts.find(row=>row.team_no===index+1)?.count||0}))};
 }
 async joinActivityLiveRoom(data){
  const now=new Date().toISOString();this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const room=this.db.prepare('SELECT id,status,expires_at,deck_snapshot,team_one,team_two FROM activity_live_rooms WHERE code_hash=?').get(data.code_hash);
   if(!room||room.expires_at<=now)throw new ApiError(404,'That room code is invalid or expired. Ask your trainer for the current code.');
   if(room.status!=='Open')throw new ApiError(409,'This live room has ended. Ask your trainer to start another round.');
   const teamNames=liveRoomTeamNames(room,JSON.parse(room.deck_snapshot));
   const identity=liveJoinIdentity(data,JSON.parse(room.deck_snapshot).roster);
   data={...data,...identity};
   if(!Number.isInteger(data.team_no)||data.team_no<1||data.team_no>teamNames.length)throw new ApiError(400,'Choose one of the teams shown on the join screen.');
   if(this.db.prepare('SELECT COUNT(*) count FROM activity_live_players WHERE room_id=?').get(room.id).count>=80)throw new ApiError(409,'This room has reached its participant limit. Ask your trainer to start another room.');
   if(this.db.prepare('SELECT 1 FROM activity_live_players WHERE room_id=? AND nickname=? COLLATE NOCASE').get(room.id,data.nickname))throw new ApiError(409,'That nickname is already in the room. Choose a different nickname.');
   this.db.prepare('INSERT INTO activity_live_players(id,room_id,token_hash,nickname,team_no,joined_at,last_seen_at,trainee_id) VALUES(?,?,?,?,?,?,?,?)').run(data.player_id,room.id,data.player_hash,data.nickname,data.team_no,now,now,data.trainee_id);
   this.db.exec('COMMIT');
  }catch(error){this.db.exec('ROLLBACK');throw error;}
  return this.activityLivePlayerState(data.player_hash);
 }
 async activityLivePlayerState(playerHash){
  this.purgeExpiredActivityLiveRooms();
  const player=this.db.prepare('SELECT p.*,r.activity_id,r.deck_snapshot,r.team_one,r.team_two,r.status AS room_status,r.round_index,r.revealed,r.correct_choice,r.timer_duration,r.timer_ends_at,r.expires_at,r.profile_results_saved_at FROM activity_live_players p JOIN activity_live_rooms r ON r.id=p.room_id WHERE p.token_hash=?').get(playerHash);
  if(!player||player.expires_at<=new Date().toISOString())throw new ApiError(401,'Your room seat is no longer active. Rejoin with the current room code.');
  this.db.prepare('UPDATE activity_live_players SET last_seen_at=? WHERE id=?').run(new Date().toISOString(),player.id);
  const deck=JSON.parse(player.deck_snapshot),teamNames=liveRoomTeamNames(player,deck),question=deck.questions[player.round_index];
  if(!question)throw new ApiError(409,'This live round is not available. Ask your trainer to restart the room.');
  const answer=this.db.prepare('SELECT choice,confidence,correct,awarded_points FROM activity_live_answers WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) AND player_id=? AND round_index=?').get(player.id,player.id,player.round_index);
  const count=this.db.prepare('SELECT COUNT(*) count FROM activity_live_answers WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) AND round_index=?').get(player.id,player.round_index).count;
  const mode=deck.mode==='pulse'?'pulse':'quiz',revealed=!!player.revealed;
  if(mode==='pulse'){
   const answerCounts=revealed&&count>=3?question.options.map((_,choice)=>this.db.prepare('SELECT COUNT(*) count FROM activity_live_answers WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) AND round_index=? AND choice=?').get(player.id,player.round_index,choice).count):null;
   return {mode,status:player.room_status,round_index:player.round_index,total_rounds:deck.questions.length,revealed,complete:player.room_status==='Complete',room_closed:player.room_status==='Closed',activity:{title:deck.title,category:deck.category,level:deck.level,...(deck.arabic?{arabic:deck.arabic}:{})},player:{choice:answer?.choice??null},question:{id:question.id,prompt:question.prompt,options:question.options,...(question.arabic?{arabic:{prompt:question.arabic.prompt,options:question.arabic.options}}:{})},response_count:count,answer_counts:answerCounts,timer_duration:player.timer_duration,timer_ends_at:player.timer_ends_at};
  }
  const teamPoints=this.db.prepare('SELECT COALESCE(SUM(points),0) points,COUNT(*) count FROM activity_live_players WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) AND team_no=?').get(player.id,player.team_no);
  const teamRows=this.db.prepare('SELECT team_no,COALESCE(SUM(points),0) points,COUNT(*) players FROM activity_live_players WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) GROUP BY team_no').all(player.id);
  const leaders=player.revealed?livePlayerStandings(this.db.prepare('SELECT nickname,team_no,points,streak FROM activity_live_players WHERE room_id=(SELECT room_id FROM activity_live_players WHERE id=?) ORDER BY points DESC,joined_at LIMIT 80').all(player.id)).slice(0,deck.competition_mode==='individuals'?80:5):[];
  const teamScores=teamNames.map((name,index)=>{const teamNo=index+1,row=teamRows.find(item=>item.team_no===teamNo);return {team_no:teamNo,name,points:row?.points||0,players:row?.players||0};});
  return {profile:livePlayerProfile(deck,player,player.profile_results_saved_at,player.profile_results_saved_at?this.db.prepare('SELECT trainee_id,earned_xp,session_date,attendance_status FROM activity_live_profile_results WHERE source_room_id=? AND source_player_id=?').get(player.room_id,player.id):null),mode,status:player.room_status,round_index:player.round_index,total_rounds:deck.questions.length,revealed,complete:player.room_status==='Complete',room_closed:player.room_status==='Closed',activity:{title:deck.title,category:deck.category,level:deck.level,...(deck.arabic?{arabic:deck.arabic}:{})},competition_mode:deck.competition_mode||'teams',participant_count:teamRows.reduce((sum,team)=>sum+team.players,0),team:{team_no:player.team_no,name:teamNames[player.team_no-1],points:teamPoints.points,players:teamPoints.count},team_scores:teamScores,player:{nickname:player.nickname,points:player.points,streak:player.streak,choice:answer?.choice??null,confidence:answer?.confidence??null,correct:revealed&&answer?!!answer.correct:null,awarded_points:revealed?(answer?.awarded_points||0):0},question:liveRoomQuestionView(question,revealed),response_count:count,timer_duration:player.timer_duration,timer_ends_at:player.timer_ends_at,leaders};
 }
 async submitActivityLiveAnswer(playerHash,choice,confidence=null){
  if(confidence!==null&&!['tentative','confident'].includes(confidence))throw new ApiError(400,'Choose one of the confidence options shown on your screen.');
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const player=this.db.prepare('SELECT p.id,p.room_id,r.round_index,r.revealed,r.status,r.deck_snapshot,r.expires_at FROM activity_live_players p JOIN activity_live_rooms r ON r.id=p.room_id WHERE p.token_hash=?').get(playerHash);
   if(!player||player.expires_at<=new Date().toISOString())throw new ApiError(401,'Your room seat is no longer active. Rejoin with the current room code.');
   if(player.status!=='Open'||player.revealed)throw new ApiError(409,'This answer window has closed. Wait for the trainer to open the next round.');
   const deck=JSON.parse(player.deck_snapshot),question=deck.questions[player.round_index];
   if(!question||choice>=question.options.length)throw new ApiError(400,'Choose one of the answers shown on your screen.');
   if(deck.mode==='pulse'&&confidence!==null)throw new ApiError(400,'Confidence check-ins are available for live quiz rounds only.');
   const now=new Date().toISOString();
   this.db.prepare('INSERT INTO activity_live_answers(room_id,player_id,round_index,choice,confidence,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(room_id,player_id,round_index) DO UPDATE SET choice=excluded.choice,confidence=excluded.confidence,correct=NULL,awarded_points=0,updated_at=excluded.updated_at').run(player.room_id,player.id,player.round_index,choice,confidence,now);
   this.db.prepare('UPDATE activity_live_players SET last_seen_at=? WHERE id=?').run(now,player.id);
   this.db.exec('COMMIT');return await this.activityLivePlayerState(playerHash);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async activityLiveHostState(roomId,ownerId){
  this.purgeExpiredActivityLiveRooms();
  const room=this.db.prepare('SELECT * FROM activity_live_rooms WHERE id=?').get(roomId);
  if(!room)throw new ApiError(404,'This live room could not be found.');
  if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
  const deck=JSON.parse(room.deck_snapshot),teamNames=liveRoomTeamNames(room,JSON.parse(room.deck_snapshot)),question=deck.questions[room.round_index],mode=deck.mode==='pulse'?'pulse':'quiz';
  if(!question)throw new ApiError(409,'This live round is not available.');
  const players=this.db.prepare(mode==='pulse'?'SELECT id FROM activity_live_players WHERE room_id=?':'SELECT id,nickname,team_no,points,streak,joined_at,trainee_id FROM activity_live_players WHERE room_id=? ORDER BY team_no,points DESC,joined_at').all(room.id);
  const answers=this.db.prepare(mode==='pulse'?'SELECT player_id,choice FROM activity_live_answers WHERE room_id=? AND round_index=? ORDER BY updated_at':'SELECT a.player_id,a.choice,a.confidence,a.correct,a.awarded_points,p.nickname,p.team_no FROM activity_live_answers a JOIN activity_live_players p ON p.id=a.player_id WHERE a.room_id=? AND a.round_index=? ORDER BY p.joined_at').all(room.id,room.round_index);
  if(mode==='pulse'){
   const answerCounts=answers.length>=3?question.options.map((_,choice)=>answers.filter(answer=>answer.choice===choice).length):null;
   return {room:{id:room.id,mode,status:room.status,round_index:room.round_index,total_rounds:deck.questions.length,revealed:!!room.revealed,correct_choice:null,timer_duration:room.timer_duration,timer_ends_at:room.timer_ends_at,expires_at:room.expires_at},activity:{id:deck.id,title:deck.title,category:deck.category,level:deck.level,...(deck.arabic?{arabic:deck.arabic}:{})},question:{id:question.id,prompt:question.prompt,options:question.options,...(question.arabic?{arabic:{prompt:question.arabic.prompt,options:question.arabic.options}}:{})},teams:[{team_no:1,name:'Whole class',points:0,player_count:players.length,players:[]}],response_count:answers.length,answer_counts:answerCounts,responses:[]};
  }
  const teams=teamNames.map((name,index)=>{const team_no=index+1,people=players.filter(person=>person.team_no===team_no);return {team_no,name,points:people.reduce((sum,person)=>sum+person.points,0),player_count:people.length,players:people.map(({nickname,points,streak})=>({nickname,points,streak}))};});
  const revealed=!!room.revealed;
  return {profile_linking:liveProfileReview(deck,players,this.db.prepare('SELECT player_id,correct FROM activity_live_answers WHERE room_id=?').all(room.id),room.profile_results_saved_at),room:{id:room.id,competition_mode:deck.competition_mode||'teams',status:room.status,round_index:room.round_index,total_rounds:deck.questions.length,revealed,correct_choice:revealed?room.correct_choice:null,timer_duration:room.timer_duration,timer_ends_at:room.timer_ends_at,expires_at:room.expires_at},activity:{id:deck.id,title:deck.title,category:deck.category,level:deck.level,...(deck.arabic?{arabic:deck.arabic}:{})},question:liveRoomQuestionView(question,revealed),teams,leaders:livePlayerStandings(players),participant_count:players.length,response_count:answers.length,answer_counts:question.type==='sequence'?null:question.options.map((_,choice)=>answers.filter(answer=>answer.choice===choice).length),responses:revealed?answers.map(answer=>({nickname:answer.nickname,team_no:answer.team_no,choice:answer.choice,correct:!!answer.correct,awarded_points:answer.awarded_points})):[],confidence_summary:liveConfidenceSummary(answers,revealed)};
 }
 async revealActivityLiveRoom(roomId,ownerId){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const room=this.db.prepare('SELECT * FROM activity_live_rooms WHERE id=?').get(roomId);
   if(!room)throw new ApiError(404,'This live room could not be found.');
   if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
   if(room.status!=='Open'||room.revealed)throw new ApiError(409,'This round is already revealed or the room has ended.');
   const question=JSON.parse(room.deck_snapshot).questions[room.round_index];if(!question)throw new ApiError(409,'This live round is not available.');
   if(JSON.parse(room.deck_snapshot).mode==='pulse'){
    this.db.prepare('UPDATE activity_live_rooms SET revealed=1,correct_choice=NULL,timer_ends_at=NULL,updated_at=? WHERE id=?').run(new Date().toISOString(),room.id);
    this.db.exec('COMMIT');return this.activityLiveHostState(room.id,ownerId);
   }
   const answers=this.db.prepare('SELECT player_id,choice FROM activity_live_answers WHERE room_id=? AND round_index=?').all(room.id,room.round_index),answerByPlayer=new Map(answers.map(item=>[item.player_id,item.choice]));
   const players=this.db.prepare('SELECT id,streak FROM activity_live_players WHERE room_id=?').all(room.id),now=new Date().toISOString();
   for(const player of players){
    const choice=answerByPlayer.get(player.id);
    if(choice===undefined){this.db.prepare('UPDATE activity_live_players SET streak=0 WHERE id=?').run(player.id);continue;}
    const correct=choice===question.answer,award=correct?100+Math.min(player.streak,4)*25:0;
    this.db.prepare('UPDATE activity_live_answers SET correct=?,awarded_points=? WHERE room_id=? AND player_id=? AND round_index=?').run(Number(correct),award,room.id,player.id,room.round_index);
    this.db.prepare('UPDATE activity_live_players SET points=points+?,streak=? WHERE id=?').run(award,correct?player.streak+1:0,player.id);
   }
   this.db.prepare('UPDATE activity_live_rooms SET revealed=1,correct_choice=?,timer_ends_at=NULL,updated_at=? WHERE id=?').run(question.answer,now,room.id);
   this.db.exec('COMMIT');return this.activityLiveHostState(room.id,ownerId);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async advanceActivityLiveRoom(roomId,ownerId){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const room=this.db.prepare('SELECT * FROM activity_live_rooms WHERE id=?').get(roomId);if(!room)throw new ApiError(404,'This live room could not be found.');
   if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
   if(room.status!=='Open'||!room.revealed)throw new ApiError(409,'Reveal the current answer before advancing the room.');
   const total=JSON.parse(room.deck_snapshot).questions.length,now=new Date().toISOString();
   if(room.round_index+1>=total)this.db.prepare("UPDATE activity_live_rooms SET status='Complete',timer_ends_at=NULL,updated_at=? WHERE id=?").run(now,room.id);
   else this.db.prepare('UPDATE activity_live_rooms SET round_index=round_index+1,revealed=0,correct_choice=NULL,timer_ends_at=NULL,updated_at=? WHERE id=?').run(now,room.id);
   this.db.exec('COMMIT');return this.activityLiveHostState(room.id,ownerId);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async replayActivityLiveRoom(roomId,ownerId){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.purgeExpiredActivityLiveRooms();
   const room=this.db.prepare('SELECT * FROM activity_live_rooms WHERE id=?').get(roomId);if(!room)throw new ApiError(404,'This live room could not be found.');
   if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
   if(room.status!=='Complete')throw new ApiError(409,'Finish the current live room before starting a replay.');
   if(room.profile_results_saved_at)throw new ApiError(409,'These results are saved. Start a new room to record another game.');
   this.db.prepare('DELETE FROM activity_live_answers WHERE room_id=?').run(room.id);
   this.db.prepare('UPDATE activity_live_players SET points=0,streak=0 WHERE room_id=?').run(room.id);
   this.db.prepare("UPDATE activity_live_rooms SET status='Open',round_index=0,revealed=0,correct_choice=NULL,timer_ends_at=NULL,updated_at=? WHERE id=?").run(new Date().toISOString(),room.id);
   this.db.exec('COMMIT');return this.activityLiveHostState(room.id,ownerId);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async saveActivityLiveResults(roomId,mappings,user,sessionDate=null){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const room=this.db.prepare('SELECT * FROM activity_live_rooms WHERE id=?').get(roomId);
   if(!room||room.expires_at<=new Date().toISOString())throw new ApiError(404,'This live room could not be found.');
   if(room.owner_id!==user.id)throw new ApiError(403,'Only the trainer who started this room can control it.');
   const deck=JSON.parse(room.deck_snapshot);
   if(room.status!=='Complete'||!deck.roster)throw new ApiError(409,'Finish a batch-linked game before saving results.');
   if(room.profile_results_saved_at){this.db.exec('COMMIT');return this.activityLiveHostState(roomId,user.id);}
   const players=this.db.prepare('SELECT * FROM activity_live_players WHERE room_id=?').all(roomId);
   if(mappings.length!==players.length||mappings.some(item=>!players.some(player=>player.id===item.player_id)))throw new ApiError(400,'Review every player before saving results.');
   const batch=this.db.prepare('SELECT * FROM batches WHERE id=?').get(deck.roster.batch_id);
   if(!batch||batch.archived_at)throw new ApiError(409,'This batch is no longer available. Refresh and choose an active batch.');
   const attendanceDate=activitySessionDate(sessionDate,batch);
   const now=new Date().toISOString();
   for(const match of mappings){
    if(!match.trainee_id)continue;
    const trainee=this.db.prepare('SELECT * FROM trainees WHERE id=? AND batch_id=?').get(match.trainee_id,batch.id);
    if(!trainee||trainee.enrollment_status!=='Active'||!deck.roster.trainees.some(item=>item.id===trainee.id))throw new ApiError(409,'The selected roster changed. Refresh and select active trainees from this batch.');
    const player=players.find(item=>item.id===match.player_id);
    const counts=this.db.prepare('SELECT COUNT(*) answered_count,COALESCE(SUM(correct),0) correct_count FROM activity_live_answers WHERE room_id=? AND player_id=? AND correct IS NOT NULL').get(roomId,player.id);
    const presence=attendanceDate&&counts.answered_count>0?recordActivityPresence(this,trainee.id,batch.id,attendanceDate,roomId,user):null;
    this.insert('activity_live_profile_results',{id:id(),source_room_id:roomId,source_player_id:player.id,trainee_id:trainee.id,batch_id:batch.id,activity_id:deck.id,title:deck.title,nickname:player.nickname,...counts,total_rounds:deck.questions.length,score:Math.round(counts.correct_count/deck.questions.length*10000)/100,room_points:player.points,earned_xp:counts.correct_count*100,session_date:attendanceDate,attendance_status:presence?.status||null,confirmed_by:user.email,created_at:now});
   }
   this.db.prepare('UPDATE activity_live_rooms SET profile_results_saved_at=?,updated_at=? WHERE id=?').run(now,now,roomId);
   this.audit(user,'confirm-live-activity-results','activity_live_rooms',roomId,`Confirmed ${mappings.filter(item=>item.trainee_id).length} activity profile results and earned XP.${attendanceDate?' Session attendance confirmed; existing records preserved.':''} Formal assessments preserved.`);
   this.db.exec('COMMIT');
  }catch(error){this.db.exec('ROLLBACK');throw error;}
  return this.activityLiveHostState(roomId,user.id);
 }
 async activityLiveProfileResults(traineeId){
  if(!this.db.prepare('SELECT id FROM trainees WHERE id=?').get(traineeId))throw new ApiError(404,'Trainee not found.');
  return {results:this.db.prepare('SELECT * FROM activity_live_profile_results WHERE trainee_id=? ORDER BY created_at DESC,id DESC LIMIT 100').all(traineeId),limit:100};
 }
 async setActivityLiveTimer(roomId,ownerId,endsAt){
  this.purgeExpiredActivityLiveRooms();
  const room=this.db.prepare('SELECT id,owner_id,status,revealed,timer_duration FROM activity_live_rooms WHERE id=?').get(roomId);
  if(!room)throw new ApiError(404,'This live room could not be found.');
  if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
  if(room.status!=='Open'||room.revealed)throw new ApiError(409,'The room timer is available only while a question is open.');
  if(!room.timer_duration)throw new ApiError(409,'This room was started without a timer.');
  this.db.prepare('UPDATE activity_live_rooms SET timer_ends_at=?,updated_at=? WHERE id=?').run(endsAt,new Date().toISOString(),room.id);
  return this.activityLiveHostState(room.id,ownerId);
 }
 async closeActivityLiveRoom(roomId,ownerId){
  this.purgeExpiredActivityLiveRooms();
  const room=this.db.prepare('SELECT id,owner_id,status FROM activity_live_rooms WHERE id=?').get(roomId);
  if(!room)throw new ApiError(404,'This live room could not be found.');
  if(room.owner_id!==ownerId)throw new ApiError(403,'Only the trainer who started this room can control it.');
  if(room.status==='Closed')return this.activityLiveHostState(room.id,ownerId);
  this.db.prepare("UPDATE activity_live_rooms SET status='Closed',timer_ends_at=NULL,updated_at=? WHERE id=?").run(new Date().toISOString(),room.id);
  return this.activityLiveHostState(room.id,ownerId);
 }
 async activities(){
  const assignments=this.db.prepare('SELECT a.*,b.batch_name FROM activity_assignments a JOIN batches b ON b.id=a.batch_id ORDER BY a.created_at DESC,a.id').all();
  const participants=this.db.prepare('SELECT p.id,p.assignment_id,p.trainee_id,p.batch_id,p.status,p.score,p.trainer_feedback,p.completed_at,p.learner_answers,p.learner_submitted_at,p.correct_count,p.earned_xp,p.version,p.created_at,p.updated_at,t.trainee_name,t.company_id,c.name AS company_name FROM activity_assignment_participants p JOIN trainees t ON t.id=p.trainee_id LEFT JOIN companies c ON c.id=t.company_id ORDER BY t.trainee_name COLLATE NOCASE,p.created_at').all().map(decode);
  const activityByAssignment=new Map(assignments.map(row=>[row.id,row.activity_id]));
  const custom=this.customChallenges(true),insightByTrainee=activityPracticeInsights(participants.filter(row=>row.learner_submitted_at).map(row=>({trainee_id:row.trainee_id,activity_id:activityByAssignment.get(row.assignment_id),answers:row.learner_answers})),custom);
  const safeParticipants=participants.map(({learner_answers,...row})=>({...row,learning_insight:insightByTrainee.get(row.trainee_id)||null}));
  const grouped=new Map();for(const participant of safeParticipants){const rows=grouped.get(participant.assignment_id)||[];rows.push(participant);grouped.set(participant.assignment_id,rows);}
  return {live_xp:this.db.prepare('SELECT trainee_id,batch_id,SUM(earned_xp) earned_xp,COUNT(*) games FROM activity_live_profile_results GROUP BY trainee_id,batch_id').all(),assignments:assignments.map(row=>{const activity=studioQuiz(row.activity_id,custom);return {...row,studio_activity:activity?{id:activity.id,title:activity.title,category:activity.category,level:activity.level,duration_minutes:activity.duration_minutes,question_count:activity.questions.length,is_custom:!!activity.created_by,archived_at:activity.archived_at||null}:null,participants:grouped.get(row.id)||[]};})};
 }
 async activityPulse({batchId='',companyId=''}={}){
  const filters=['p.learner_submitted_at IS NOT NULL'],params=[];
  if(batchId){filters.push('p.batch_id=?');params.push(batchId);}
  if(companyId){filters.push('t.company_id=?');params.push(companyId);}
  const attempts=this.db.prepare(`SELECT p.id AS attempt_id,p.trainee_id,a.activity_id,p.learner_answers,p.learner_submitted_at AS submitted_at FROM activity_assignment_participants p JOIN activity_assignments a ON a.id=p.assignment_id JOIN trainees t ON t.id=p.trainee_id WHERE ${filters.join(' AND ')}`).all(...params).map(decode);
  return {pulse:activityCohortPulse(attempts.map(({attempt_id,trainee_id,activity_id,learner_answers,submitted_at})=>({attempt_id,trainee_id,activity_id,answers:learner_answers,submitted_at})),this.customChallenges(true))};
 }
 activitySessionPlan(idValue){
  const row=this.db.prepare('SELECT p.*,b.batch_name,c.name AS company_name FROM activity_session_plans p JOIN batches b ON b.id=p.batch_id LEFT JOIN companies c ON c.id=p.company_id WHERE p.id=?').get(idValue);
  if(!row)return null;
  const {outline_json,...plan}=decode(row);
  return {...plan,outline:outline_json};
 }
 async activitySessionPlans(){
  const rows=this.db.prepare('SELECT p.*,b.batch_name,c.name AS company_name FROM activity_session_plans p JOIN batches b ON b.id=p.batch_id LEFT JOIN companies c ON c.id=p.company_id ORDER BY p.session_date DESC,p.created_at DESC LIMIT 250').all().map(decode);
  return {plans:rows.map(({outline_json,...plan})=>({...plan,outline:outline_json}))};
 }
 async createActivitySessionPlan(data,user){
  const planId=id(),now=new Date().toISOString();
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.db.prepare('INSERT INTO activity_session_plans(id,batch_id,company_id,session_date,title,focus_skill,duration_minutes,activity_id,outline_json,status,version,created_by,created_at,updated_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?,\'Planned\',1,?,?,?,NULL)')
    .run(planId,data.batch_id,data.company_id,data.session_date,data.title,data.focus_skill,data.duration_minutes,data.activity_id,JSON.stringify(data.outline),user.email,now,now);
   this.audit(user,'create-activity-session-plan','activity_session_plans',planId,'Created a shared classroom run-of-show for '+data.session_date+'.');
   this.db.exec('COMMIT');
   return this.activitySessionPlan(planId);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async updateActivitySessionStep(data,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const row=this.db.prepare('SELECT id,outline_json,status,version FROM activity_session_plans WHERE id=?').get(data.id);
   if(!row)throw new ApiError(404,'This session plan could not be found.');
   if(row.version!==data.expected_version)throw new ApiError(409,'Another trainer updated this session board. Refresh it and try again.');
   const outline=JSON.parse(row.outline_json),step=outline.find(item=>item.id===data.step_id);
   if(!step)throw new ApiError(409,'This session plan no longer has that step. Refresh it and try again.');
   if(step.done===data.completed){this.db.exec('COMMIT');return this.activitySessionPlan(data.id);}
   step.done=data.completed;
   const status=outline.every(item=>item.done)?'Completed':outline.some(item=>item.done)?'In Progress':'Planned';
   const now=new Date().toISOString(),completedAt=status==='Completed'?now:null;
   const saved=this.db.prepare('UPDATE activity_session_plans SET outline_json=?,status=?,version=version+1,updated_at=?,completed_at=? WHERE id=? AND version=?').run(JSON.stringify(outline),status,now,completedAt,data.id,data.expected_version);
   if(!saved.changes)throw new ApiError(409,'Another trainer updated this session board. Refresh it and try again.');
   this.audit(user,data.completed?'complete-activity-session-step':'reopen-activity-session-step','activity_session_plans',data.id,'Updated the '+data.step_id+' step in a shared classroom session.');
   this.db.exec('COMMIT');
   return this.activitySessionPlan(data.id);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async issueActivityLinks(assignmentId,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const assignment=this.db.prepare('SELECT id,activity_id,status,due_date FROM activity_assignments WHERE id=?').get(assignmentId);
   if(!assignment)throw new ApiError(404,'Activity assignment not found.');
   if(assignment.status!=='Open'||(assignment.due_date&&assignment.due_date<today()))throw new ApiError(409,'This assignment is closed or past its due date.');
   if(!this.activityQuiz(assignment.activity_id))throw new ApiError(400,'Private learner links are currently available for Academy Studio quizzes.');
   const people=this.db.prepare('SELECT p.id,p.trainee_id,t.trainee_name FROM activity_assignment_participants p JOIN trainees t ON t.id=p.trainee_id WHERE p.assignment_id=? AND p.learner_submitted_at IS NULL ORDER BY t.trainee_name COLLATE NOCASE').all(assignmentId);
   const links=[],now=new Date().toISOString();
   for(const person of people){const code=crypto.randomBytes(32).toString('base64url');this.db.prepare('UPDATE activity_assignment_participants SET learner_code_hash=?,updated_at=? WHERE id=?').run(tokenHash(code),now,person.id);links.push({trainee_id:person.trainee_id,trainee_name:person.trainee_name,code});}
   this.audit(user,'issue-activity-links','activity_assignments',assignmentId,`Issued or rotated private quiz links for ${links.length} trainee(s).`);
   const alreadySubmitted=this.db.prepare('SELECT COUNT(*) count FROM activity_assignment_participants WHERE assignment_id=? AND learner_submitted_at IS NOT NULL').get(assignmentId).count;
   this.db.exec('COMMIT');return {assignment_id:assignmentId,links,already_submitted:alreadySubmitted};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async openActivityLearner(code){
  if(typeof code!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(code))throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  const participant=this.db.prepare('SELECT p.*,t.trainee_name,a.activity_id,a.title,a.instructions,a.due_date,a.status AS assignment_status,b.batch_name FROM activity_assignment_participants p JOIN trainees t ON t.id=p.trainee_id JOIN activity_assignments a ON a.id=p.assignment_id JOIN batches b ON b.id=p.batch_id WHERE p.learner_code_hash=?').get(tokenHash(code));
  if(!participant)throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  const activity=this.activityQuiz(participant.activity_id);
  if(!activity)throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  if(participant.learner_submitted_at){const result=gradeStudioQuiz(activity,decode({learner_answers:participant.learner_answers}).learner_answers);return {completed:true,trainee_name:participant.trainee_name,title:participant.title,result};}
  if(participant.assignment_status!=='Open'||(participant.due_date&&participant.due_date<today()))throw new ApiError(409,'This activity is no longer accepting responses. Ask your trainer for help.');
  let started=false;
  if(participant.status==='Assigned'){
   this.db.exec('BEGIN IMMEDIATE');
   try{const changed=this.db.prepare("UPDATE activity_assignment_participants SET status='In Progress',version=version+1,updated_at=? WHERE id=? AND status='Assigned' AND learner_submitted_at IS NULL").run(new Date().toISOString(),participant.id);started=changed.changes>0;this.db.exec('COMMIT');}
   catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  const latest=this.db.prepare('SELECT learner_submitted_at,learner_answers,learner_draft_answers,learner_draft_index,learner_draft_updated_at,learner_draft_version FROM activity_assignment_participants WHERE id=?').get(participant.id);
  if(latest?.learner_submitted_at){const result=gradeStudioQuiz(activity,decode({learner_answers:latest.learner_answers}).learner_answers);return {completed:true,trainee_name:participant.trainee_name,title:participant.title,result};}
  const draft=latest?.learner_draft_updated_at?{answers:decode({learner_draft_answers:latest.learner_draft_answers}).learner_draft_answers,current_index:latest.learner_draft_index,updated_at:latest.learner_draft_updated_at,version:latest.learner_draft_version}:null;
  return {completed:false,started,trainee_name:participant.trainee_name,title:participant.title,instructions:participant.instructions,due_date:participant.due_date,quiz:publicQuiz(activity),draft};
 }
 async saveActivityLearnerDraft(code,answers,currentIndex,expectedVersion){
  if(typeof code!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(code))throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  if(!Number.isSafeInteger(expectedVersion)||expectedVersion<0)throw new ApiError(400,'Saved quiz progress is invalid.');
  const hash=tokenHash(code);this.db.exec('BEGIN IMMEDIATE');
  try{
   const participant=this.db.prepare('SELECT p.id,p.status,p.learner_submitted_at,p.learner_draft_version,a.activity_id,a.status AS assignment_status,a.due_date FROM activity_assignment_participants p JOIN activity_assignments a ON a.id=p.assignment_id WHERE p.learner_code_hash=?').get(hash);
   if(!participant)throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
   if(participant.learner_submitted_at||participant.status==='Completed')throw new ApiError(409,'This quiz has already been completed. Reopen your private link to see the saved result.');
   if(participant.assignment_status!=='Open'||(participant.due_date&&participant.due_date<today()))throw new ApiError(409,'This activity is no longer accepting responses. Ask your trainer for help.');
   if(participant.learner_draft_version!==expectedVersion)throw new ApiError(409,'This quiz progress was updated in another open session. Reload the link to continue from the latest saved progress.');
   const activity=this.activityQuiz(participant.activity_id),draft=validateStudioQuizDraft(activity,answers,currentIndex),now=new Date().toISOString();
   const nextVersion=expectedVersion+1;
   const saved=this.db.prepare('UPDATE activity_assignment_participants SET learner_draft_answers=?,learner_draft_index=?,learner_draft_updated_at=?,learner_draft_version=? WHERE id=? AND learner_code_hash=? AND learner_submitted_at IS NULL AND learner_draft_version=?').run(JSON.stringify(draft.answers),draft.current_index,now,nextVersion,participant.id,hash,expectedVersion);
   if(!saved.changes)throw new ApiError(409,'This quiz changed in another session. Reopen your private link and continue from the latest saved progress.');
   this.db.exec('COMMIT');return {saved_at:now,version:nextVersion};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async submitActivityLearner(code,answers){
  if(typeof code!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(code))throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  const hash=tokenHash(code),initial=this.db.prepare('SELECT p.learner_code_hash,a.activity_id FROM activity_assignment_participants p JOIN activity_assignments a ON a.id=p.assignment_id WHERE p.learner_code_hash=?').get(hash);
  if(!initial)throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
  const activity=this.activityQuiz(initial.activity_id),grade=gradeStudioQuiz(activity,answers);
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const participant=this.db.prepare('SELECT p.*,a.status AS assignment_status,a.due_date,a.title FROM activity_assignment_participants p JOIN activity_assignments a ON a.id=p.assignment_id WHERE p.learner_code_hash=?').get(hash);
   if(!participant)throw new ApiError(403,'This private activity link is invalid, expired, or already used.');
   if(participant.assignment_status!=='Open'||(participant.due_date&&participant.due_date<today()))throw new ApiError(409,'This activity is no longer accepting responses. Ask your trainer for help.');
   if(participant.learner_submitted_at)throw new ApiError(409,'Your response was already saved. Reopen your private link to see the result.');
   const now=new Date().toISOString();
   this.db.prepare("UPDATE activity_assignment_participants SET status='Completed',score=?,learner_answers=?,learner_draft_answers='[]',learner_draft_index=0,learner_draft_updated_at=NULL,learner_submitted_at=?,correct_count=?,earned_xp=?,completed_at=?,version=version+1,updated_at=? WHERE id=?").run(grade.score,JSON.stringify(grade.answers),now,grade.correct,grade.xp,now,now,participant.id);
   this.audit({email:'Activity learner'},'submit-studio-quiz','activity_assignment_participants',participant.id,`Submitted a private quiz response (${grade.correct}/${grade.total}).`);
   const trainee=this.db.prepare('SELECT trainee_name FROM trainees WHERE id=?').get(participant.trainee_id);
   this.db.exec('COMMIT');return {completed:true,title:participant.title,trainee_name:trainee?.trainee_name||'Trainee',result:grade};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async createActivityAssignment(data,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const batch=this.db.prepare('SELECT id,archived_at FROM batches WHERE id=?').get(data.batch_id);
   if(!batch||batch.archived_at)throw new ApiError(409,'This batch is no longer available. Refresh and choose an active batch.');
   const sessionPlan=data.session_plan_id?this.db.prepare('SELECT id,batch_id,company_id,session_date,activity_id,linked_assignment_id FROM activity_session_plans WHERE id=?').get(data.session_plan_id):null;
   if(data.session_plan_id&&(!sessionPlan||sessionPlan.batch_id!==data.batch_id||sessionPlan.activity_id!==data.activity_id))throw new ApiError(409,'This session plan changed. Refresh the shared board and try again.');
   if(sessionPlan?.linked_assignment_id)throw new ApiError(409,'This session already has a linked follow-up quiz. Open that assignment from the shared session board.');
   if(sessionPlan&&sessionPlan.session_date>today())throw new ApiError(409,'This session’s private quiz unlocks on its scheduled date.');
   const eligible=this.db.prepare("SELECT id FROM trainees WHERE batch_id=? AND enrollment_status='Active' AND (? IS NULL OR company_id=?) AND id IN (SELECT value FROM json_each(?))").all(data.batch_id,sessionPlan?.company_id||null,sessionPlan?.company_id||null,JSON.stringify(data.trainee_ids));
   if(eligible.length!==data.trainee_ids.length)throw new ApiError(409,'The selected roster changed. Refresh and select active trainees from this batch.');
   const now=new Date().toISOString(),assignment={id:id(),batch_id:data.batch_id,activity_id:data.activity_id,title:data.title,instructions:data.instructions,due_date:data.due_date,status:'Open',version:1,created_by:user.email,created_at:now,updated_at:now};
   this.insert('activity_assignments',assignment);
   for(const traineeId of data.trainee_ids)this.insert('activity_assignment_participants',{id:id(),assignment_id:assignment.id,trainee_id:traineeId,batch_id:data.batch_id,status:'Assigned',score:null,trainer_feedback:'',completed_at:null,version:1,created_at:now,updated_at:now});
   this.audit(user,'assign-activity','activity_assignments',assignment.id,`Assigned ${assignment.title} to ${data.trainee_ids.length} trainee(s) in batch ${data.batch_id}.`);
   if(sessionPlan){
    const linked=this.db.prepare('UPDATE activity_session_plans SET linked_assignment_id=?,version=version+1,updated_at=? WHERE id=? AND linked_assignment_id IS NULL').run(assignment.id,now,sessionPlan.id);
    if(!linked.changes)throw new ApiError(409,'Another trainer already assigned the follow-up quiz for this session. Refresh the shared board.');
    this.audit(user,'link-session-quiz','activity_session_plans',sessionPlan.id,'Linked a private follow-up quiz to the shared session plan.');
   }
   this.db.exec('COMMIT');return {...assignment,...(sessionPlan?{session_plan_id:sessionPlan.id}:{})};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async updateActivityParticipant(data,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const row=this.db.prepare('SELECT p.*,a.status AS assignment_status,a.activity_id FROM activity_assignment_participants p JOIN activity_assignments a ON a.id=p.assignment_id WHERE p.assignment_id=? AND p.trainee_id=?').get(data.assignment_id,data.trainee_id);
   if(!row)throw new ApiError(404,'This activity participant no longer exists.');
   if(row.assignment_status!=='Open')throw new ApiError(409,'This assignment is closed and cannot be changed.');
   if(this.activityQuiz(row.activity_id))throw new ApiError(409,'Academy Studio quiz progress is recorded from the trainee response and cannot be overwritten manually.');
   if(row.version!==data.expected_version)throw new ApiError(409,'Another trainer updated this progress. Refresh and try again.');
   const now=new Date().toISOString(),completedAt=data.status==='Completed'?(row.completed_at||now):null;
   this.db.prepare('UPDATE activity_assignment_participants SET status=?,score=?,trainer_feedback=?,completed_at=?,version=version+1,updated_at=? WHERE id=?').run(data.status,data.score,data.trainer_feedback,completedAt,now,row.id);
   this.audit(user,'update-activity-progress','activity_assignment_participants',row.id,`Updated progress for ${row.trainee_id} to ${data.status}.`);
   const saved=this.db.prepare('SELECT id,assignment_id,trainee_id,batch_id,status,score,trainer_feedback,completed_at,learner_submitted_at,correct_count,earned_xp,version,created_at,updated_at FROM activity_assignment_participants WHERE id=?').get(row.id);
   this.db.exec('COMMIT');return decode(saved);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async closeActivityAssignment(data,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const row=this.db.prepare('SELECT * FROM activity_assignments WHERE id=?').get(data.id);
   if(!row)throw new ApiError(404,'Activity assignment not found.');
   if(row.version!==data.expected_version)throw new ApiError(409,'This assignment changed in another session. Refresh and try again.');
   if(row.status==='Closed')throw new ApiError(409,'This assignment is already closed.');
   const now=new Date().toISOString();this.db.prepare("UPDATE activity_assignments SET status='Closed',version=version+1,updated_at=? WHERE id=?").run(now,row.id);
   this.audit(user,'close-activity-assignment','activity_assignments',row.id,`Closed ${row.title}.`);
   this.db.exec('COMMIT');return this.db.prepare('SELECT * FROM activity_assignments WHERE id=?').get(row.id);
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async deleteActivityAssignment(data,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const assignment=this.db.prepare('SELECT * FROM activity_assignments WHERE id=?').get(data.id);
   if(!assignment)throw new ApiError(404,'Activity assignment not found.');
   if(user.role!=='admin'&&assignment.created_by!==user.email)throw new ApiError(403,'Only an administrator or the assigning trainer can delete this assignment.');
   if(assignment.version!==data.expected_version)throw new ApiError(409,'This assignment changed in another session. Refresh and try again.');
   const participants=this.db.prepare('SELECT * FROM activity_assignment_participants WHERE assignment_id=?').all(data.id),plans=this.db.prepare('SELECT * FROM activity_session_plans WHERE linked_assignment_id=?').all(data.id);
   const now=new Date().toISOString();
   this.insert('activity_assignment_deletions',{id:data.id,snapshot:{assignment,participants,session_plans:plans},deleted_by:user.email,deleted_at:now});
   this.db.prepare('UPDATE activity_session_plans SET linked_assignment_id=NULL,version=version+1,updated_at=? WHERE linked_assignment_id=?').run(now,data.id);
   this.db.prepare('DELETE FROM activity_assignments WHERE id=?').run(data.id);
   this.audit(user,'delete-activity-assignment','activity_assignments',data.id,`Deleted ${assignment.title} and ${participants.length} assigned entries. Private recovery snapshot retained. Batch, attendance and formal assessments preserved.`);
   this.db.exec('COMMIT');return {id:data.id,deleted:true,recoverable:true};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 async recordAssignmentAttendance(data,sessionDate,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const assignment=this.db.prepare('SELECT * FROM activity_assignments WHERE id=?').get(data.id);
   if(!assignment)throw new ApiError(404,'Activity assignment not found.');
   if(assignment.version!==data.expected_version)throw new ApiError(409,'This assignment changed in another session. Refresh and try again.');
   const batch=this.db.prepare('SELECT * FROM batches WHERE id=?').get(assignment.batch_id);
   if(!batch||batch.archived_at)throw new ApiError(409,'This batch is no longer available. Refresh and choose an active batch.');
   const date=activitySessionDate(sessionDate,batch);if(!date)throw new ApiError(400,'Choose a scheduled session date that is today or earlier.');
   const participants=this.db.prepare("SELECT p.trainee_id FROM activity_assignment_participants p JOIN trainees t ON t.id=p.trainee_id AND t.batch_id=p.batch_id WHERE p.assignment_id=? AND p.status='Completed' AND t.enrollment_status='Active'").all(data.id);
   if(!participants.length)throw new ApiError(409,'No completed participants are available to record attendance.');
   let created=0;for(const participant of participants)if(recordActivityPresence(this,participant.trainee_id,batch.id,date,assignment.id,user).created)created++;
   this.audit(user,'confirm-assignment-attendance','activity_assignments',assignment.id,`Confirmed ${participants.length} completed participants for ${date}; created ${created} attendance records. Existing records preserved.`);
   this.db.exec('COMMIT');return {created,preserved:participants.length-created,session_date:date};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
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
 async setBatchArchived(batchId,expectedVersion,archived,user){
  this.db.exec('BEGIN IMMEDIATE');
  try{
   const old=decode(this.db.prepare('SELECT * FROM batches WHERE id=?').get(batchId));
   if(!old)throw new ApiError(404,'Batch not found.');
   if(old.version!==expectedVersion)throw new ApiError(409,'This batch changed in another session. Refresh and try again.');
   if(Boolean(old.archived_at)===archived)throw new ApiError(409,archived?'This batch is already archived.':'This batch is not archived.');
   const now=new Date().toISOString(),archivedAt=archived?now:null,archivedBy=archived?user.email:null;
   this.db.prepare('UPDATE batches SET archived_at=?,archived_by=?,version=version+1,updated_at=? WHERE id=?').run(archivedAt,archivedBy,now,batchId);
   const saved=decode(this.db.prepare('SELECT * FROM batches WHERE id=?').get(batchId));
   this.audit(user,archived?'archive-batch':'restore-batch','batches',batchId,archived?`Archived ${old.batch_name}; records preserved.`:`Restored ${old.batch_name}; records preserved.`);
   this.db.exec('COMMIT');return saved;
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
 async updateUserName(target,fullName,actor){this.db.exec('BEGIN IMMEDIATE');try{const old=this.db.prepare('SELECT * FROM users WHERE id=?').get(target);if(!old)throw new ApiError(404,'User not found.');if(old.full_name===fullName){this.db.exec('COMMIT');return {ok:true};}this.db.prepare('UPDATE users SET full_name=? WHERE id=?').run(fullName,target);this.audit(actor,'display-name','users',target,`Updated display name from ${old.full_name} to ${fullName}.`);this.db.exec('COMMIT');return {ok:true};}catch(error){this.db.exec('ROLLBACK');throw error;}}
 async updateUser(target,changes,actor){const old=this.db.prepare('SELECT * FROM users WHERE id=?').get(target);if(!old)throw new ApiError(404,'User not found.');if(old.role==='admin'&&old.active&&(changes.role!=='admin'||!changes.active)){const n=this.db.prepare("SELECT COUNT(*) n FROM users WHERE role='admin' AND active=1 AND id<>?").get(target).n;if(!n)throw new ApiError(400,'You cannot deactivate or demote the last administrator.');}
 this.db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(changes.role,Number(changes.active),target);this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(target);this.insert('audit_log',{id:id(),actor:actor.email,action:'permissions',entity:'users',entity_id:target,details:`Role: ${changes.role}; access: ${changes.active?'active':'inactive'}`,created_at:new Date().toISOString()});return {ok:true};}
 close(){this.db.close();}
}
