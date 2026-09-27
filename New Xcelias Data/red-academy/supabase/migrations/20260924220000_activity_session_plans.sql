-- Shared, resumable trainer run-of-show for live classroom sessions.
begin;

create table if not exists public.activity_session_plans (
  id text primary key check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  batch_id text not null references public.batches(id) on delete cascade,
  company_id text references public.companies(id) on delete set null,
  session_date text not null check (session_date ~ '^\d{4}-\d{2}-\d{2}$'),
  title text not null check (length(title) between 3 and 120),
  focus_skill text not null check (focus_skill in ('discovery','qualification','accuracy','objections','ethics','followthrough','viewing','teamwork')),
  duration_minutes integer not null check (duration_minutes between 15 and 120),
  activity_id text not null,
  outline jsonb not null check (case when jsonb_typeof(outline) = 'array' then jsonb_array_length(outline) = 4 else false end),
  status text not null default 'Planned' check (status in ('Planned','In Progress','Completed')),
  version integer not null default 1 check (version >= 1),
  created_by text not null,
  created_at text not null,
  updated_at text not null,
  completed_at text
);

create index if not exists ix_red_activity_session_plans_batch_date
  on public.activity_session_plans (batch_id, session_date desc, created_at desc);
create index if not exists ix_red_activity_session_plans_company_date
  on public.activity_session_plans (company_id, session_date desc);

alter table public.activity_session_plans enable row level security;
revoke all on table public.activity_session_plans from anon, authenticated;
grant all on table public.activity_session_plans to service_role;

create or replace function public.red_create_activity_session_plan(
  p_id text,
  p_batch_id text,
  p_company_id text,
  p_session_date text,
  p_title text,
  p_focus_skill text,
  p_duration_minutes integer,
  p_activity_id text,
  p_outline jsonb,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  saved public.activity_session_plans%rowtype;
  current_batch public.batches%rowtype;
  parsed_date date;
  now_value text := public.red_now();
  step_total integer;
begin
  if p_id is null or p_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_batch_id is null or p_session_date is null or p_title is null
    or p_focus_skill is null or p_duration_minutes is null or p_activity_id is null
    or length(trim(p_title)) not between 3 and 120
    or p_title ~ '[[:cntrl:]]'
    or p_focus_skill not in ('discovery','qualification','accuracy','objections','ethics','followthrough','viewing','teamwork')
    or p_duration_minutes not between 15 and 120
    or p_activity_id !~ '^[a-z0-9][a-z0-9-]{1,39}$'
    or jsonb_typeof(p_outline) is distinct from 'array' then
    raise exception 'RED_INVALID_RECORD';
  end if;
  if jsonb_array_length(p_outline) <> 4 then raise exception 'RED_INVALID_RECORD'; end if;

  begin
    parsed_date := p_session_date::date;
  exception when others then
    raise exception 'RED_INVALID_RECORD';
  end;
  if parsed_date::text <> p_session_date then raise exception 'RED_INVALID_RECORD'; end if;

  select * into current_batch from public.batches where id = p_batch_id and archived_at is null;
  if current_batch.id is null then raise exception 'RED_ACTIVITY_BATCH'; end if;
  if p_company_id is not null and not exists (
    select 1 from public.trainees t
    where t.batch_id = p_batch_id and t.company_id = p_company_id
      and t.enrollment_status <> 'Stopped Attending'
  ) then raise exception 'RED_INVALID_RECORD'; end if;

  if p_outline->0->>'id' is distinct from 'spark'
    or p_outline->1->>'id' is distinct from 'quest'
    or p_outline->2->>'id' is distinct from 'huddle'
    or p_outline->3->>'id' is distinct from 'exit'
    or exists (select 1 from jsonb_array_elements(p_outline) as item(step) where jsonb_typeof(step) is distinct from 'object' or jsonb_typeof(step->'done') is distinct from 'boolean' or jsonb_typeof(step->'duration_minutes') is distinct from 'number' or (step->>'duration_minutes') !~ '^\d+$') then
    raise exception 'RED_INVALID_RECORD';
  end if;
  if (p_outline->1->>'activity_id') is distinct from p_activity_id
    or exists (select 1 from jsonb_array_elements(p_outline) as item(step) where (step->>'duration_minutes') !~ '^\d+$') then
    raise exception 'RED_INVALID_RECORD';
  end if;
  select sum((step->>'duration_minutes')::integer) into step_total
    from jsonb_array_elements(p_outline) as item(step);
  if step_total <> p_duration_minutes then raise exception 'RED_INVALID_RECORD'; end if;

  insert into public.activity_session_plans (
    id, batch_id, company_id, session_date, title, focus_skill,
    duration_minutes, activity_id, outline, status, version,
    created_by, created_at, updated_at, completed_at
  ) values (
    p_id, p_batch_id, p_company_id, p_session_date, trim(p_title), p_focus_skill,
    p_duration_minutes, p_activity_id, p_outline, 'Planned', 1,
    p_actor, now_value, now_value, null
  ) returning * into saved;

  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'create-activity-session-plan',
    'activity_session_plans', saved.id, 'Created a shared classroom run-of-show for ' || saved.session_date || '.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(saved);
end;
$$;

create or replace function public.red_update_activity_session_step(
  p_id text,
  p_expected_version integer,
  p_step_id text,
  p_completed boolean,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  saved public.activity_session_plans%rowtype;
  changed_outline jsonb;
  done_count integer;
  next_status text;
  now_value text := public.red_now();
  step_index integer;
begin
  if p_id is null or p_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_expected_version is null or p_expected_version < 1
    or p_step_id is null or p_step_id not in ('spark','quest','huddle','exit')
    or p_completed is null then
    raise exception 'RED_INVALID_RECORD';
  end if;

  select * into saved from public.activity_session_plans where id = p_id for update;
  if saved.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if saved.version <> p_expected_version then raise exception 'RED_CONFLICT'; end if;

  select ordinality - 1 into step_index
    from jsonb_array_elements(saved.outline) with ordinality as item(step, ordinality)
    where step->>'id' = p_step_id;
  if step_index is null then raise exception 'RED_INVALID_RECORD'; end if;
  if (saved.outline->step_index->>'done')::boolean = p_completed then return to_jsonb(saved); end if;

  changed_outline := jsonb_set(saved.outline, array[step_index::text,'done'], to_jsonb(p_completed), false);
  select count(*) filter (where (step->>'done')::boolean) into done_count
    from jsonb_array_elements(changed_outline) as item(step);
  next_status := case when done_count = 4 then 'Completed' when done_count > 0 then 'In Progress' else 'Planned' end;

  update public.activity_session_plans set outline = changed_outline, status = next_status,
    version = version + 1, updated_at = now_value,
    completed_at = case when next_status = 'Completed' then now_value else null end
    where id = p_id returning * into saved;

  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor,
    case when p_completed then 'complete-activity-session-step' else 'reopen-activity-session-step' end,
    'activity_session_plans', saved.id, 'Updated the ' || p_step_id || ' step in a shared classroom session.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(saved);
end;
$$;

revoke all on function public.red_create_activity_session_plan(text, text, text, text, text, text, integer, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.red_update_activity_session_step(text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.red_create_activity_session_plan(text, text, text, text, text, text, integer, text, jsonb, text) to service_role;
grant execute on function public.red_update_activity_session_step(text, integer, text, boolean, text) to service_role;

commit;
