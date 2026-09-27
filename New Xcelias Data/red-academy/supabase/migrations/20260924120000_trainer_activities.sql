-- Trainer-led activity assignments stay linked to canonical RED batches and trainees.
-- No imported attendance, assessments, roster rows, or staff credentials are changed.

begin;

create table if not exists public.activity_assignments (
  id text primary key,
  batch_id text not null references public.batches(id) on delete cascade,
  activity_id text not null check (activity_id ~ '^[a-z0-9]{2,24}$'),
  title text not null check (length(title) between 1 and 120),
  instructions text not null default '' check (length(instructions) <= 2000),
  due_date text,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  version integer not null default 1 check (version > 0),
  created_by text not null,
  created_at text not null,
  updated_at text not null,
  unique (id, batch_id)
);

create index if not exists ix_red_activity_assignments_batch
  on public.activity_assignments (batch_id, created_at desc);

create table if not exists public.activity_assignment_participants (
  id text primary key,
  assignment_id text not null,
  trainee_id text not null,
  batch_id text not null,
  status text not null default 'Assigned' check (status in ('Assigned', 'In Progress', 'Completed')),
  score double precision check (score is null or score between 0 and 100),
  trainer_feedback text not null default '' check (length(trainer_feedback) <= 4000),
  completed_at text,
  version integer not null default 1 check (version > 0),
  created_at text not null,
  updated_at text not null,
  unique (assignment_id, trainee_id),
  foreign key (assignment_id, batch_id)
    references public.activity_assignments(id, batch_id) on delete cascade,
  foreign key (trainee_id, batch_id)
    references public.trainees(id, batch_id) on delete cascade
);

create index if not exists ix_red_activity_participants_trainee
  on public.activity_assignment_participants (trainee_id, created_at desc);

alter table public.activity_assignments enable row level security;
alter table public.activity_assignment_participants enable row level security;
revoke all on table public.activity_assignments, public.activity_assignment_participants from anon, authenticated;
grant all on table public.activity_assignments, public.activity_assignment_participants to service_role;

create or replace function public.red_create_activity_assignment(
  p_id text,
  p_batch_id text,
  p_activity_id text,
  p_title text,
  p_instructions text,
  p_due_date text,
  p_trainee_ids jsonb,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  current_batch public.batches%rowtype;
  now_value text := public.red_now();
  target_id text;
  target_count integer;
begin
  if p_trainee_ids is null or jsonb_typeof(p_trainee_ids) <> 'array'
    or jsonb_array_length(p_trainee_ids) < 1 or jsonb_array_length(p_trainee_ids) > 1000 then
    raise exception 'RED_ACTIVITY_TARGETS';
  end if;
  select * into current_batch from public.batches where id = p_batch_id for update;
  if current_batch.id is null or current_batch.archived_at is not null then raise exception 'RED_ACTIVITY_BATCH'; end if;
  select count(*) into target_count
    from public.trainees t
    where t.batch_id = p_batch_id and t.enrollment_status = 'Active'
      and t.id in (select jsonb_array_elements_text(p_trainee_ids));
  if target_count <> jsonb_array_length(p_trainee_ids)
    or target_count <> (select count(distinct value) from jsonb_array_elements_text(p_trainee_ids) as targets(value)) then
    raise exception 'RED_ACTIVITY_TARGETS';
  end if;

  insert into public.activity_assignments(id, batch_id, activity_id, title, instructions, due_date, status, version, created_by, created_at, updated_at)
  values (p_id, p_batch_id, p_activity_id, p_title, p_instructions, p_due_date, 'Open', 1, p_actor, now_value, now_value);

  for target_id in select jsonb_array_elements_text(p_trainee_ids) loop
    insert into public.activity_assignment_participants(id, assignment_id, trainee_id, batch_id, status, score, trainer_feedback, completed_at, version, created_at, updated_at)
    values (extensions.gen_random_uuid()::text, p_id, target_id, p_batch_id, 'Assigned', null, '', null, 1, now_value, now_value);
  end loop;

  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'assign-activity', 'activity_assignments', p_id,
    'Assigned ' || p_title || ' to ' || target_count || ' trainee(s) in batch ' || p_batch_id || '.', now_value);
  perform public.red_bump_revision();
  return jsonb_build_object('id', p_id, 'batch_id', p_batch_id, 'activity_id', p_activity_id, 'title', p_title,
    'instructions', p_instructions, 'due_date', p_due_date, 'status', 'Open', 'version', 1,
    'created_by', p_actor, 'created_at', now_value, 'updated_at', now_value);
end;
$$;

create or replace function public.red_update_activity_participant(
  p_assignment_id text,
  p_trainee_id text,
  p_expected_version integer,
  p_status text,
  p_score double precision,
  p_trainer_feedback text,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  participant public.activity_assignment_participants%rowtype;
  assignment_status text;
  now_value text := public.red_now();
begin
  select a.status into assignment_status from public.activity_assignments a where a.id = p_assignment_id for update;
  if assignment_status is null then raise exception 'RED_NOT_FOUND'; end if;
  select * into participant from public.activity_assignment_participants p
    where p.assignment_id = p_assignment_id and p.trainee_id = p_trainee_id for update;
  if participant.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if assignment_status <> 'Open' then raise exception 'RED_ACTIVITY_CLOSED'; end if;
  if participant.version <> p_expected_version then raise exception 'RED_CONFLICT'; end if;
  update public.activity_assignment_participants
    set status = p_status, score = p_score, trainer_feedback = p_trainer_feedback,
        completed_at = case when p_status = 'Completed' then coalesce(completed_at, now_value) else null end,
        version = version + 1, updated_at = now_value
    where id = participant.id returning * into participant;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'update-activity-progress', 'activity_assignment_participants', participant.id,
    'Updated trainee activity progress to ' || p_status || '.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(participant);
end;
$$;

create or replace function public.red_close_activity_assignment(p_id text, p_expected_version integer, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  assignment public.activity_assignments%rowtype;
  now_value text := public.red_now();
begin
  select * into assignment from public.activity_assignments where id = p_id for update;
  if assignment.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if assignment.version <> p_expected_version then raise exception 'RED_CONFLICT'; end if;
  if assignment.status = 'Closed' then raise exception 'RED_ACTIVITY_CLOSED'; end if;
  update public.activity_assignments set status = 'Closed', version = version + 1, updated_at = now_value
    where id = p_id returning * into assignment;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'close-activity-assignment', 'activity_assignments', p_id,
    'Closed ' || assignment.title || '.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(assignment);
end;
$$;

revoke all on function public.red_create_activity_assignment(text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.red_update_activity_participant(text, text, integer, text, double precision, text, text) from public, anon, authenticated;
revoke all on function public.red_close_activity_assignment(text, integer, text) from public, anon, authenticated;
grant execute on function public.red_create_activity_assignment(text, text, text, text, text, text, jsonb, text) to service_role;
grant execute on function public.red_update_activity_participant(text, text, integer, text, double precision, text, text) to service_role;
grant execute on function public.red_close_activity_assignment(text, integer, text) to service_role;

commit;
