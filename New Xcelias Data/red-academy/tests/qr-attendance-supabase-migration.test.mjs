import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20261021093706_qr_attendance.sql',import.meta.url),'utf8');

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
