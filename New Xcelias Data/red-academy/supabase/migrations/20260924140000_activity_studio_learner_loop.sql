-- Adds private, one-response learner links for Academy Studio quizzes.
-- Only SHA-256 link hashes are persisted; raw link codes are returned once.
begin;

alter table public.activity_assignments
  drop constraint if exists activity_assignments_activity_id_check;
alter table public.activity_assignments
  add constraint activity_assignments_activity_id_check
  check (activity_id ~ '^[a-z0-9][a-z0-9-]{1,39}$');

alter table public.activity_assignment_participants
  add column if not exists learner_code_hash text,
  add column if not exists learner_answers jsonb not null default '[]'::jsonb,
  add column if not exists learner_submitted_at text,
  add column if not exists correct_count integer,
  add column if not exists earned_xp integer not null default 0;

alter table public.activity_assignment_participants
  drop constraint if exists activity_assignment_participants_learner_code_hash_check,
  add constraint activity_assignment_participants_learner_code_hash_check
    check (learner_code_hash is null or learner_code_hash ~ '^[a-f0-9]{64}$'),
  drop constraint if exists activity_assignment_participants_learner_answers_check,
  add constraint activity_assignment_participants_learner_answers_check
    check (jsonb_typeof(learner_answers) = 'array'),
  drop constraint if exists activity_assignment_participants_correct_count_check,
  add constraint activity_assignment_participants_correct_count_check
    check (correct_count is null or correct_count between 0 and 5),
  drop constraint if exists activity_assignment_participants_earned_xp_check,
  add constraint activity_assignment_participants_earned_xp_check
    check (earned_xp between 0 and 500);

create unique index if not exists ix_red_activity_learner_code
  on public.activity_assignment_participants (learner_code_hash)
  where learner_code_hash is not null;

create or replace function public.red_issue_activity_links(
  p_assignment_id text,
  p_links jsonb,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  assignment_row public.activity_assignments%rowtype;
  link_row jsonb;
  trainee_key text;
  code_hash text;
  changed integer;
  issued integer := 0;
  already_submitted integer := 0;
  now_value text := public.red_now();
begin
  if p_links is null or jsonb_typeof(p_links) <> 'array' or jsonb_array_length(p_links) > 1000 then
    raise exception 'RED_ACTIVITY_TARGETS';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_links) as entry(value)
    group by value ->> 'trainee_id' having count(*) > 1
  ) then raise exception 'RED_ACTIVITY_TARGETS'; end if;

  select * into assignment_row from public.activity_assignments
    where id = p_assignment_id for update;
  if assignment_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if assignment_row.status <> 'Open'
    or (assignment_row.due_date is not null and assignment_row.due_date < to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD')) then
    raise exception 'RED_ACTIVITY_CLOSED';
  end if;
  if assignment_row.activity_id not like 'quiz-%' then raise exception 'RED_INVALID_OPERATION'; end if;

  for link_row in select value from jsonb_array_elements(p_links) as links(value) loop
    trainee_key := link_row ->> 'trainee_id';
    code_hash := link_row ->> 'code_hash';
    if trainee_key is null or code_hash is null or code_hash !~ '^[a-f0-9]{64}$' then
      raise exception 'RED_ACTIVITY_TARGETS';
    end if;
    update public.activity_assignment_participants
      set learner_code_hash = code_hash, updated_at = now_value
      where assignment_id = p_assignment_id and trainee_id = trainee_key
        and learner_submitted_at is null;
    get diagnostics changed = row_count;
    if changed <> 1 then
      if exists (select 1 from public.activity_assignment_participants
        where assignment_id = p_assignment_id and trainee_id = trainee_key and learner_submitted_at is not null) then
        raise exception 'RED_ACTIVITY_SUBMITTED';
      end if;
      raise exception 'RED_ACTIVITY_TARGETS';
    end if;
    issued := issued + 1;
  end loop;

  select count(*) into already_submitted from public.activity_assignment_participants
    where assignment_id = p_assignment_id and learner_submitted_at is not null;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'issue-activity-links', 'activity_assignments', p_assignment_id,
    'Issued or rotated private quiz links for ' || issued || ' trainee(s).', now_value);
  perform public.red_bump_revision();
  return jsonb_build_object('issued', issued, 'already_submitted', already_submitted);
end;
$$;

create or replace function public.red_start_activity_quiz(p_code_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  participant public.activity_assignment_participants%rowtype;
  assignment_row public.activity_assignments%rowtype;
  assignment_key text;
  started boolean := false;
  now_value text := public.red_now();
begin
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'RED_NOT_FOUND'; end if;
  select assignment_id into assignment_key from public.activity_assignment_participants
    where learner_code_hash = p_code_hash;
  if assignment_key is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into assignment_row from public.activity_assignments
    where id = assignment_key for update;
  if assignment_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into participant from public.activity_assignment_participants
    where learner_code_hash = p_code_hash and assignment_id = assignment_key for update;
  if participant.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if participant.learner_submitted_at is not null then
    return jsonb_build_object('started', false, 'completed', true);
  end if;
  if assignment_row.status <> 'Open'
    or (assignment_row.due_date is not null and assignment_row.due_date < to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD')) then
    raise exception 'RED_ACTIVITY_CLOSED';
  end if;
  if participant.status = 'Assigned' then
    update public.activity_assignment_participants
      set status = 'In Progress', version = version + 1, updated_at = now_value
      where id = participant.id;
    started := true;
    insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
    values (extensions.gen_random_uuid()::text, 'Activity learner', 'start-studio-quiz', 'activity_assignment_participants', participant.id,
      'Started a private Academy Studio quiz.', now_value);
    perform public.red_bump_revision();
  end if;
  return jsonb_build_object('started', started, 'completed', false);
end;
$$;

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
  now_value text := public.red_now();
begin
  if p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_answers is null or jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 5
    or p_score is null or p_score not between 0 and 100
    or p_correct is null or p_correct not between 0 and 5
    or p_xp is null
    or p_score <> p_correct * 20 or p_xp <> p_correct * 100 then
    raise exception 'RED_INVALID_RECORD';
  end if;
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
        learner_submitted_at = now_value, correct_count = p_correct, earned_xp = p_xp,
        completed_at = now_value, version = version + 1, updated_at = now_value
    where id = participant.id;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, 'Activity learner', 'submit-studio-quiz', 'activity_assignment_participants', participant.id,
    'Submitted a private quiz response (' || p_correct || '/5).', now_value);
  perform public.red_bump_revision();
  return jsonb_build_object('status', 'Completed', 'score', p_score, 'correct_count', p_correct, 'earned_xp', p_xp, 'submitted_at', now_value);
end;
$$;

revoke all on function public.red_issue_activity_links(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.red_start_activity_quiz(text) from public, anon, authenticated;
revoke all on function public.red_submit_activity_quiz(text, jsonb, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.red_issue_activity_links(text, jsonb, text) to service_role;
grant execute on function public.red_start_activity_quiz(text) to service_role;
grant execute on function public.red_submit_activity_quiz(text, jsonb, integer, integer, integer) to service_role;

commit;
