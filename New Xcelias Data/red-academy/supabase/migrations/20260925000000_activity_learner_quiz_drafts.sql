-- Private autosaved learner progress for Academy Studio quizzes.
-- A draft is scoped to the existing hashed bearer link, never selected by the
-- trainer APIs, and is cleared atomically when the final result is submitted.
begin;

alter table public.activity_assignment_participants
  add column if not exists learner_draft_answers jsonb not null default '[]'::jsonb,
  add column if not exists learner_draft_index integer not null default 0,
  add column if not exists learner_draft_updated_at text,
  add column if not exists learner_draft_version integer not null default 0;

alter table public.activity_assignment_participants
  drop constraint if exists activity_assignment_participants_learner_draft_answers_check,
  add constraint activity_assignment_participants_learner_draft_answers_check
    check (jsonb_typeof(learner_draft_answers) = 'array' and jsonb_array_length(learner_draft_answers) <= 12),
  drop constraint if exists activity_assignment_participants_learner_draft_index_check,
  add constraint activity_assignment_participants_learner_draft_index_check
    check (learner_draft_index between 0 and 11),
  drop constraint if exists activity_assignment_participants_learner_draft_version_check,
  add constraint activity_assignment_participants_learner_draft_version_check
    check (learner_draft_version >= 0),
  drop constraint if exists activity_assignment_participants_correct_count_check,
  add constraint activity_assignment_participants_correct_count_check
    check (correct_count is null or correct_count between 0 and 12),
  drop constraint if exists activity_assignment_participants_earned_xp_check,
  add constraint activity_assignment_participants_earned_xp_check
    check (earned_xp between 0 and 1200);

create or replace function public.red_save_activity_quiz_draft(
  p_code_hash text,
  p_answers jsonb,
  p_current_index integer,
  p_expected_version integer
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  participant public.activity_assignment_participants%rowtype;
  assignment_row public.activity_assignments%rowtype;
  assignment_key text;
  answer_row jsonb;
  now_value text := public.red_now();
begin
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_answers is null or jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) > 12
    or p_current_index is null or p_current_index < 0 or p_current_index > 11
    or p_expected_version is null or p_expected_version < 0 then
    raise exception 'RED_INVALID_RECORD';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_answers) as entry(value)
    where jsonb_typeof(value -> 'question_id') is distinct from 'string'
      or coalesce(value ->> 'question_id', '') !~ '^[A-Za-z0-9_-]{1,80}$'
      or jsonb_typeof(value -> 'choice') is distinct from 'number'
      or coalesce(value ->> 'choice', '') !~ '^[0-3]$'
      or jsonb_typeof(value -> 'used_hint') is distinct from 'boolean'
  ) then raise exception 'RED_INVALID_RECORD'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_answers) as entry(value)
    group by value ->> 'question_id' having count(*) > 1
  ) then raise exception 'RED_INVALID_RECORD'; end if;

  select assignment_id into assignment_key from public.activity_assignment_participants
    where learner_code_hash = p_code_hash;
  if assignment_key is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into assignment_row from public.activity_assignments
    where id = assignment_key for update;
  if assignment_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into participant from public.activity_assignment_participants
    where learner_code_hash = p_code_hash and assignment_id = assignment_key for update;
  if participant.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if participant.learner_submitted_at is not null or participant.status = 'Completed' then
    raise exception 'RED_ACTIVITY_SUBMITTED';
  end if;
  if participant.learner_draft_version <> p_expected_version then raise exception 'RED_ACTIVITY_DRAFT_CONFLICT'; end if;
  if assignment_row.status <> 'Open'
    or (assignment_row.due_date is not null and assignment_row.due_date < to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD')) then
    raise exception 'RED_ACTIVITY_CLOSED';
  end if;
  if assignment_row.activity_id not like 'quiz-%' then raise exception 'RED_INVALID_OPERATION'; end if;

  update public.activity_assignment_participants
    set learner_draft_answers = p_answers,
        learner_draft_index = p_current_index,
        learner_draft_updated_at = now_value,
        learner_draft_version = learner_draft_version + 1
    where id = participant.id and learner_submitted_at is null and learner_draft_version = p_expected_version;
  return jsonb_build_object('saved_at', now_value, 'version', p_expected_version + 1);
end;
$$;

-- Replacing this RPC also clears transient drafts on successful submission.
-- Validation of answer correctness remains in the trusted Academy Edge Function.
create or replace function public.red_submit_activity_quiz(
  p_code_hash text,
  p_answers jsonb,
  p_score integer,
  p_correct integer,
  p_xp integer
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  participant public.activity_assignment_participants%rowtype;
  assignment_row public.activity_assignments%rowtype;
  assignment_key text;
  total_answers integer;
  now_value text := public.red_now();
begin
  total_answers := case when p_answers is not null and jsonb_typeof(p_answers) = 'array'
    then jsonb_array_length(p_answers) else 0 end;
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or total_answers not between 3 and 12
    or p_score is null or p_score not between 0 and 100
    or p_correct is null or p_correct not between 0 and total_answers
    or p_xp is null or p_xp not between 0 and p_correct * 100
    or p_score <> round(p_correct * 100.0 / total_answers)::integer then
    raise exception 'RED_INVALID_RECORD';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_answers) as entry(value)
    where jsonb_typeof(value -> 'question_id') is distinct from 'string'
      or coalesce(value ->> 'question_id', '') !~ '^[A-Za-z0-9_-]{1,80}$'
      or jsonb_typeof(value -> 'choice') is distinct from 'number'
      or coalesce(value ->> 'choice', '') !~ '^[0-3]$'
      or jsonb_typeof(value -> 'used_hint') is distinct from 'boolean'
  ) then raise exception 'RED_INVALID_RECORD'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_answers) as entry(value)
    group by value ->> 'question_id' having count(*) > 1
  ) then raise exception 'RED_INVALID_RECORD'; end if;

  select assignment_id into assignment_key from public.activity_assignment_participants
    where learner_code_hash = p_code_hash;
  if assignment_key is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into assignment_row from public.activity_assignments
    where id = assignment_key for update;
  if assignment_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into participant from public.activity_assignment_participants
    where learner_code_hash = p_code_hash and assignment_id = assignment_key for update;
  if participant.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if participant.learner_submitted_at is not null then raise exception 'RED_ACTIVITY_SUBMITTED'; end if;
  if assignment_row.status <> 'Open'
    or (assignment_row.due_date is not null and assignment_row.due_date < to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD')) then
    raise exception 'RED_ACTIVITY_CLOSED';
  end if;
  if assignment_row.activity_id not like 'quiz-%' then raise exception 'RED_INVALID_OPERATION'; end if;

  update public.activity_assignment_participants
    set status = 'Completed', score = p_score, learner_answers = p_answers,
        learner_draft_answers = '[]'::jsonb, learner_draft_index = 0, learner_draft_updated_at = null,
        learner_submitted_at = now_value, correct_count = p_correct, earned_xp = p_xp,
        completed_at = now_value, version = version + 1, updated_at = now_value
    where id = participant.id;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, 'Activity learner', 'submit-studio-quiz', 'activity_assignment_participants', participant.id,
    'Submitted a private quiz response (' || p_correct || '/' || total_answers || ').', now_value);
  perform public.red_bump_revision();
  return jsonb_build_object('status', 'Completed', 'score', p_score, 'correct_count', p_correct, 'earned_xp', p_xp, 'submitted_at', now_value);
end;
$$;

revoke all on function public.red_save_activity_quiz_draft(text, jsonb, integer, integer) from public, anon, authenticated;
grant execute on function public.red_save_activity_quiz_draft(text, jsonb, integer, integer) to service_role;
revoke all on function public.red_submit_activity_quiz(text, jsonb, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.red_submit_activity_quiz(text, jsonb, integer, integer, integer) to service_role;

commit;
