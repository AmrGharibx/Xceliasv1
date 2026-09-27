import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync(new URL('../supabase/migrations/20260924220000_activity_session_plans.sql',import.meta.url),'utf8');

test('cloud session-plan migration is additive and keeps trainer records behind RLS/service-role access',()=>{
 assert.match(migration,/create table if not exists public\.activity_session_plans/i);
 assert.match(migration,/references public\.batches\(id\) on delete cascade/i);
 assert.match(migration,/outline jsonb not null/i);
 assert.match(migration,/alter table public\.activity_session_plans enable row level security/i);
 assert.match(migration,/revoke all on table public\.activity_session_plans from anon, authenticated/i);
 assert.match(migration,/grant all on table public\.activity_session_plans to service_role/i);
 assert.doesNotMatch(migration,/\b(drop|truncate)\s+(table|public\.)/i);
});

test('cloud RPCs validate the roster, audit session changes, guard concurrent edits and publish a revision',()=>{
 assert.match(migration,/red_create_activity_session_plan/i);
 assert.match(migration,/archived_at is null/i);
 assert.match(migration,/enrollment_status <> 'Stopped Attending'/i);
 assert.match(migration,/red_update_activity_session_step/i);
 assert.match(migration,/for update/i);
 assert.match(migration,/saved\.version <> p_expected_version/i);
 assert.match(migration,/insert into public\.audit_log/i);
 assert.equal((migration.match(/perform public\.red_bump_revision\(\)/gi)||[]).length,2);
 assert.match(migration,/revoke all on function public\.red_create_activity_session_plan/i);
 assert.match(migration,/grant execute on function public\.red_update_activity_session_step[\s\S]+?to service_role/i);
});
