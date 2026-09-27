import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/migrations/20260925220000_activity_live_confidence.sql', import.meta.url), 'utf8');

test('live confidence migration is additive, constrained, and callable only by the service role', () => {
  assert.match(migration, /add column if not exists confidence text/i);
  assert.match(migration, /confidence is null or confidence in \('tentative', 'confident'\)/i);
  assert.match(migration, /create or replace function public\.red_activity_live_answer\(\s*p_token_hash text,\s*p_choice integer,\s*p_confidence text/is);
  assert.match(migration, /security definer\s+set search_path = public, pg_temp/i);
  assert.match(migration, /room_row\.deck_snapshot->>'mode' = 'pulse' and p_confidence is not null/i);
  assert.match(migration, /room_row\.status <> 'Open' or room_row\.revealed/i);
  assert.match(migration, /on conflict \(room_id, player_id, round_index\) do update/i);
  assert.match(migration, /revoke all on function public\.red_activity_live_answer\(text, integer, text\)\s+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.red_activity_live_answer\(text, integer, text\)\s+to service_role/i);
  assert.doesNotMatch(migration, /\b(drop|truncate)\s+(table|public\.)/i);
  assert.doesNotMatch(migration, /update public\.(trainees|assessments|daily_attendance|activity_assignment_participants)\b/i);
});
