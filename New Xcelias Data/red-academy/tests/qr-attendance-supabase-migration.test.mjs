import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20261021093706_qr_attendance.sql',import.meta.url),'utf8');
const migrationFiles=fs.readdirSync(new URL('../supabase/migrations/',import.meta.url));
const expiryDdl=migrationFiles.filter(name=>/^\d+_qr_batch_expiry_ddl\.sql$/.test(name)).map(name=>fs.readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')).join('\n');
const expiryBackfill=migrationFiles.filter(name=>/^\d+_qr_batch_expiry_backfill\.sql$/.test(name)).map(name=>fs.readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')).join('\n');

test('qrAttendanceTablesArePrivateAndRlsEnabled',()=>{
 for(const table of ['qr_attendance_venues','qr_attendance_batch_links','qr_attendance_sessions','qr_attendance_activation_codes','qr_attendance_enrollments','qr_attendance_challenges','qr_attendance_location_reviews']){
  assert.match(migration,new RegExp(`create table public\\.${table}\\s*\\(`,'i'));
  assert.match(migration,new RegExp(`alter table public.%I enable row level security`,'i'));
  assert.match(migration,new RegExp(`'${table}'`));
 }
 assert.match(migration,/revoke all on table public\.%I from public, anon, authenticated/i);
 assert.match(migration,/grant all on table public\.%I to service_role/i);
});

test('qrAttendanceRpcsAreServiceRoleOnly',()=>{
 for(const [signature,name] of [
  ['text,jsonb,text','red_qr_manage'],
  ['text,text,jsonb,text','red_qr_public_enroll'],
  ['text,text,text,text,text','red_qr_public_challenge'],
  ['text,text,text,text,boolean,text,text,text,text,text','red_qr_public_checkin'],
  ['','red_qr_cleanup'],
 ]){
  assert.match(migration,new RegExp(`revoke all on function public\\.${name}\\(${signature.replaceAll(',','\\s*,\\s*')}\\) from public,\\s*anon,\\s*authenticated`,'i'));
  assert.match(migration,new RegExp(`grant execute on function public\\.${name}\\(`,'i'));
 }
 assert.doesNotMatch(migration,/grant execute on function public\.red_qr_[^(]+\([^;]+ to (public|anon|authenticated)/i);
});

test('qrAttendanceHasStableBatchQrAndOneOpenSession',()=>{
 assert.match(migration,/create unique index ux_qr_attendance_active_batch_link[\s\S]+?where active/i);
 assert.match(migration,/create unique index ux_qr_attendance_one_open_session_per_batch[\s\S]+?where closed_at is null/i);
 assert.match(migration,/rotated_from text references public\.qr_attendance_batch_links/i);
 assert.match(migration,/session_date_value<>to_char\(now\(\) at time zone 'Africa\/Cairo'/i);
 assert.match(migration,/where id=venue_id_value and active/i);
 assert.match(migration,/venue_latitude,venue_longitude,radius_m/);
});

test('qrAttendanceHasOneActiveEnrollmentAndHashedCodes',()=>{
 assert.match(migration,/code_hash text not null unique check \(length\(code_hash\) = 64\)/i);
 assert.match(migration,/challenge_hash text not null check \(length\(challenge_hash\) = 64\)/i);
 assert.match(migration,/create unique index ux_qr_attendance_one_active_enrollment_per_trainee[\s\S]+?where revoked_at is null/i);
 assert.match(migration,/create unique index ux_qr_attendance_one_active_public_key[\s\S]+?where revoked_at is null/i);
 assert.match(migration,/code_row\.expires_at::timestamptz<=now\(\)/i);
});

test('qrLocationReviewStoresNoCoordinatesAndHasBoundedRetention',()=>{
 const review=migration.match(/create table public\.qr_attendance_location_reviews \(([\s\S]*?)\n\);/i)?.[1]||'';
 assert.ok(review);
 assert.doesNotMatch(review,/latitude|longitude/i);
 assert.match(review,/accuracy_band/);
 assert.match(review,/distance_band/);
 assert.match(migration,/status='resolved' and resolved_at::timestamptz < now\(\) - interval '90 days'/i);
 assert.match(migration,/outcome'='manual_attendance_recorded' and not exists[\s\S]+?daily_attendance/i);
});

test('qrAttendanceMigrationDoesNotRewriteExistingAttendanceOrTraineeData',()=>{
 assert.doesNotMatch(migration,/\bupdate\s+public\.(daily_attendance|assessments|batches|trainees)\b/i);
 assert.doesNotMatch(migration,/\bdelete\s+from\s+public\.(daily_attendance|assessments|batches|trainees)\b/i);
 assert.doesNotMatch(migration,/\btruncate\s+public\.(daily_attendance|assessments|batches|trainees)\b/i);
 assert.match(migration,/insert into public\.daily_attendance[\s\S]+?source_meta[\s\S]+?jsonb_build_object\('method','qr'/i);
});

test('qrBatchExpiryUsesCairoEndOfBatchAndTracksScheduleChanges',()=>{
 assert.match(expiryDdl,/function public\.red_qr_batch_access_expires_at\(batch_id_value text\)/i);
 assert.match(expiryDdl,/at time zone 'Africa\/Cairo'/i);
 assert.match(expiryDdl,/time '20:00'/i);
 assert.match(expiryDdl,/before insert or update of batch_id,\s*expires_at on public\.qr_attendance_activation_codes/i);
 assert.match(expiryDdl,/before insert or update of batch_id,\s*session_date,\s*expires_at on public\.qr_attendance_sessions/i);
 assert.match(expiryDdl,/after update of end_date,\s*session_dates on public\.batches/i);
 assert.match(expiryDdl,/revoke all on function public\.red_qr_batch_access_expires_at\(text\) from public,\s*anon,\s*authenticated/i);
});

test('qrBatchExpiryBackfillTouchesOnlyQrActivationAndSessionRecords',()=>{
 assert.match(expiryBackfill,/update public\.qr_attendance_activation_codes/i);
 assert.match(expiryBackfill,/update public\.qr_attendance_sessions/i);
 assert.doesNotMatch(expiryBackfill,/\b(update|delete\s+from|truncate)\s+public\.(daily_attendance|assessments|batches|trainees)\b/i);
});

// Offline contract checks: never connect to Postgres or open a workspace database.
const bindingFiles = migrationFiles.filter(name => /^\d{14}_qr_attendance_device_binding\.sql$/.test(name));
const binding = bindingFiles.map(name => fs.readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')).join('\n').replace(/--[^\n]*/g, '');
function rpc(name) {
 const body = binding.match(new RegExp(`create function public\\.${name}\\([\\s\\S]*?as \\$\\$([\\s\\S]*?)\\$\\$;`, 'i'))?.[1];
 assert.ok(body, `Missing additive RPC ${name}`);
 return body;
}

test('qrDeviceBindingAddsExactlyOnePrivateRlsTableWithHashedHandles', () => {
 assert.equal(bindingFiles.length, 1, 'Generate the device binding migration with the CLI');
 assert.match(binding, /create table public\.qr_attendance_device_link_requests\s*\(/i);
 assert.match(binding, /handle_hash text not null unique check \(handle_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/i);
 assert.match(binding, /alter table public\.qr_attendance_device_link_requests enable row level security/i);
 assert.match(binding, /revoke all on table public\.qr_attendance_device_link_requests from public, anon, authenticated/i);
 assert.match(binding, /grant all on table public\.qr_attendance_device_link_requests to service_role/i);
 assert.doesNotMatch(binding, /create policy|grant .* to (?:public|anon|authenticated)\b/i);
 const table = binding.match(/create table[\s\S]*?\n\);/i)?.[0] || '';
 assert.doesNotMatch(table, /\b(phone|activation_code|request_handle|latitude|longitude|fingerprint)\s+/i);
 for (const field of ['session_id', 'candidate_trainee_id', 'locator_kind', 'code_id', 'enrollment_id', 'resolved_at', 'resolved_by', 'resolution']) assert.match(table, new RegExp(`\\b${field}\\b`));
});

test('qrDeviceBindingIndexesBoundPendingKeysAndKeepExistingActiveConstraints', () => {
 assert.match(binding, /create index \w+ on public\.qr_attendance_device_link_requests\(batch_id,status,created_at desc\)/i);
 assert.match(binding, /create index \w+ on public\.qr_attendance_device_link_requests\(expires_at,status\)/i);
 assert.match(binding, /create unique index \w+ on public\.qr_attendance_device_link_requests\(public_key\) where status='pending'/i);
 assert.doesNotMatch(binding, /drop|alter index/i);
 assert.match(migration, /unique index ux_qr_attendance_one_active_enrollment_per_trainee[\s\S]*?where revoked_at is null/i);
 assert.match(migration, /unique index ux_qr_attendance_one_active_public_key[\s\S]*?where revoked_at is null/i);
});

test('qrDeviceBindingEveryRpcIsServiceRoleOnlyWithFixedSearchPath', () => {
 const names = [...binding.matchAll(/create function public\.(\w+)\(([^)]*)\)[\s\S]*?as \$\$/gi)];
 assert.equal(names.length, 7, 'Six lifecycle RPCs and a private phone normalizer');
 for (const [, name, parameters] of names) {
  const types = parameters.split(',').map(p => p.trim().split(/\s+/)[1]).join('\\s*,\\s*');
  assert.match(binding, new RegExp(`revoke all on function public\\.${name}\\(${types}\\) from public,\\s*anon,\\s*authenticated`, 'i'));
  assert.match(binding, new RegExp(`grant execute on function public\\.${name}\\(${types}\\) to service_role`, 'i'));
  assert.match(binding, new RegExp(`create function public\\.${name}\\([\\s\\S]*?security definer set search_path = '' as \\$\\$`, 'i'));
 }
});

test('qrDeviceBindingCreationRequiresOpenSessionAndCleansExpiredPendingKeys', () => {
 const body = rpc('qr_create_device_link_request');
 assert.match(body, /closed_at is null[\s\S]*?session_date=to_char\([\s\S]*?'Africa\/Cairo'/i);
 assert.match(body, /least\(v_now\+interval '30 minutes',v_session\.expires_at::timestamptz\)/i);
 assert.match(body, /set status='expired'[\s\S]*?status='pending'[\s\S]*?expires_at<=v_now[\s\S]*?s\.closed_at is not null[\s\S]*?s\.expires_at::timestamptz<=v_now/i);
 assert.match(body, /extensions\.gen_random_bytes\(32\)/i);
 assert.match(body, /extensions\.digest\(v_handle,'sha256'\)/i);
 assert.match(body, /return jsonb_build_object\('requestHandle',v_handle,'status','pending'\)/i);
 assert.doesNotMatch(body, /insert into public\.qr_attendance_enrollments|set consumed_at|traineeName/i);
});

test('qrDeviceBindingLocatorMatchingIsBatchLocalGenericAndDoesNotPersistPhone', () => {
 const body = rpc('qr_create_device_link_request');
 assert.match(body, /\(p_phone is null\)=\(p_code_hash is null\)/i);
 assert.match(body, /count\(\*\)=1[\s\S]*?batch_id=v_batch\.id and enrollment_status='Active'/i);
 assert.match(body, /public\.qr_normalize_phone\(t\.phone\)=v_phone/i);
 assert.match(body, /consumed_at is null and revoked_at is null and expires_at::timestamptz>v_now/i);
 assert.match(body, /jsonb_build_object\('kty','EC','crv','P-256','x',[\s\S]*?'ext',true,'key_ops',jsonb_build_array\('verify'\)\)/i);
 assert.match(body, /p_public_key \? 'd'/i);
 const normalizer = rpc('qr_normalize_phone');
 assert.match(normalizer, /length\(p_value\)>40/);
 assert.match(normalizer, /0020[\s\S]*?20[\s\S]*?\^01\[0125\]/);
});

test('qrDeviceBindingProofLookupReturnsOnlyKeyBeforeIdentityStatusRpc', () => {
 const body = rpc('qr_device_link_request_proof_key');
 assert.match(body, /handle_hash=p_handle_hash and r\.batch_id=l\.batch_id/i);
 assert.match(body, /return jsonb_build_object\('publicKey',v_key\)/i);
 assert.doesNotMatch(body, /trainee_name|credentialId|enrollment_id|candidate_trainee_id/i);
});

test('qrDeviceBindingStatusExpiresApprovedRequestsBeforeReturningIdentity', () => {
 const body = rpc('qr_device_link_request_status');
 const expiry = body.indexOf("return jsonb_build_object('status','expired')");
 const identity = body.indexOf("'credentialId'");
 assert.ok(expiry >= 0 && identity > expiry);
 assert.match(body, /v_request\.expires_at<=v_now[\s\S]*?v_session\.closed_at is not null[\s\S]*?v_session\.expires_at::timestamptz<=v_now/i);
 assert.match(body, /if v_request\.status='rejected' then return jsonb_build_object\('status','rejected'\)/i);
 assert.match(body, /e\.revoked_at is null/i);
 assert.doesNotMatch(body, /\b(update|delete|insert)\b/i);
});

test('qrDeviceBindingStaffQueueMatchesLocalShapeAndOmitsCredentials', () => {
 const body = rpc('qr_device_link_requests');
 for (const key of ['items', 'candidateTraineeId', 'candidateTraineeName', 'publicKey', 'status', 'createdAt', 'expiresAt', 'hasActiveDevice', 'usedRecoveryCode']) assert.ok(body.includes(`'${key}'`));
 assert.match(body, /r\.status='pending' and r\.expires_at>v_now and s\.closed_at is null and s\.expires_at::timestamptz>v_now/i);
 assert.doesNotMatch(body, /handle_hash|code_hash|t\.phone/i);
});

test('qrDeviceBindingResolutionLocksAndValidatesBeforeAtomicReplacement', () => {
 const body = rpc('qr_resolve_device_link_request');
 for (const name of ['qr_create_device_link_request', 'qr_resolve_device_link_request', 'qr_issue_device_recovery_code']) assert.match(rpc(name), /pg_advisory_xact_lock\(72831,2\)/);
 assert.match(body, /qr_attendance_device_link_requests where id=p_request_id for update/i);
 assert.match(body, /qr_attendance_sessions where id=v_request\.session_id for update/i);
 assert.match(body, /trainees[\s\S]*?batch_id=v_request\.batch_id[\s\S]*?for update/i);
 assert.match(body, /v_request\.status<>'pending'/);
 assert.match(body, /v_request\.locator_kind='code' and v_request\.code_id is null/);
 assert.match(body, /v_code\.trainee_id<>v_trainee\.id[\s\S]*?v_code\.consumed_at is not null[\s\S]*?v_code\.revoked_at is not null[\s\S]*?v_code\.expires_at::timestamptz<=v_now/);
 assert.match(body, /public_key=v_request\.public_key and revoked_at is null/);
 assert.match(body, /v_existing is not null and p_action<>'approve_replace'/);
 assert.match(body, /v_existing is null and p_action='approve_replace'/);
 const revoke = body.indexOf('update public.qr_attendance_enrollments');
 assert.ok(revoke > body.indexOf("p_action<>'approve_replace'"));
 assert.ok(body.indexOf('insert into public.qr_attendance_enrollments') > revoke);
 assert.match(body, /set consumed_at=v_now_text,enrollment_id=v_enrollment_id[\s\S]*?consumed_at is null and revoked_at is null/);
 assert.match(body, /if not found then raise exception 'RED_QR_CODE_INVALID'/);
 assert.match(body, /set status='approved'[\s\S]*?resolved_by=p_actor/);
 assert.doesNotMatch(body, /exception when|\bcommit\b|\brollback\b/i);
});

test('qrDeviceBindingRecoveryReissueNeverRevokesEnrollmentAndUsesBatchExpiry', () => {
 const body = rpc('qr_issue_device_recovery_code');
 assert.match(body, /public\.red_qr_batch_access_expires_at\(v_trainee\.batch_id\)/);
 assert.match(body, /p_action='reissue'[\s\S]*?update public\.qr_attendance_activation_codes set revoked_at=v_now_text[\s\S]*?consumed_at is null and revoked_at is null/);
 assert.match(body, /returning expires_at into v_expires_at/);
 assert.doesNotMatch(body, /qr_attendance_enrollments|red_qr_manage|set consumed_at|30 days/i);
 assert.match(body, /return jsonb_build_object\('expiresAt',v_expires_at\)/);
});

test('qrDeviceBindingMigrationIsAdditiveWithoutRosterAttendanceOrLegacyRpcChanges', () => {
 assert.ok(binding.length > 0);
 assert.match(binding, /^\s*begin;/i);
 assert.match(binding, /commit;\s*$/i);
 assert.doesNotMatch(binding, /\b(?:update|insert into|delete from|truncate(?: table)?|merge into|alter table)\s+(?:public\.)?(?:daily_attendance|trainees|batches|assessments)\b/i);
 assert.doesNotMatch(binding, /create (?:or replace )?function public\.red_qr_|\b(?:drop|truncate)\b|\bdelete\s+from\b/i);
 assert.match(rpc('qr_resolve_device_link_request'), /insert into public\.audit_log/);
 assert.match(rpc('qr_issue_device_recovery_code'), /insert into public\.audit_log/);
});

test('qrDeviceBindingApprovalRechecksDeadlinesAfterAllPotentialLockWaits', () => {
 const body = rpc('qr_resolve_device_link_request');
 const finalLock = body.lastIndexOf('for update;');
 const refresh = body.indexOf('v_now:=clock_timestamp();', finalLock);
 const revoke = body.indexOf('update public.qr_attendance_enrollments');
 assert.ok(refresh > finalLock && refresh < revoke, 'Refresh wall time after trainee/code/enrollment locks, before replacement');
 const finalChecks = body.slice(refresh, revoke);
 assert.match(finalChecks, /v_request\.expires_at<=v_now/);
 assert.match(finalChecks, /v_session\.expires_at::timestamptz<=v_now/);
 assert.match(finalChecks, /v_code\.expires_at::timestamptz<=v_now/);
});

test('qrDeviceBindingPublicKeyCoordinatesMustBeJsonStrings', () => {
 const body = rpc('qr_create_device_link_request');
 for (const coordinate of ['x', 'y']) assert.match(body, new RegExp(`jsonb_typeof\\(p_public_key->'${coordinate}'\\) is distinct from 'string'`));
});
