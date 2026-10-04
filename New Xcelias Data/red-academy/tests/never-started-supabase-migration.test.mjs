import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261004120000_never_started_enrollment_status.sql',import.meta.url),'utf8');

test('Supabase enrollment migration expands the allowed status without rewriting trainee data',()=>{
 assert.match(sql,/drop constraint if exists trainees_enrollment_status_check/i);
 assert.match(sql,/check \(enrollment_status in \('Active', 'Stopped Attending', 'Never Started'\)\)/i);
 assert.match(sql,/pg_get_functiondef\([\s\S]+red_create_activity_session_plan/i);
 assert.match(sql,/pg_get_functiondef\([\s\S]+red_activity_live_save_results/i);
 assert.match(sql,/enrollment_status = ''Active''/i);
 assert.match(sql,/t\.enrollment_status<>.*quote_literal\('Active'\)/i);
 assert.match(sql,/if definition = original_definition then[\s\S]+raise exception/i);
 assert.doesNotMatch(sql,/\b(update|delete from|insert into) public\.(trainees|batches|daily_attendance|assessments)\b/i);
});
