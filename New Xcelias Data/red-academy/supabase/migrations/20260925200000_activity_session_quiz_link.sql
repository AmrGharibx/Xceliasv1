-- Link one private learner assignment to a shared session plan atomically.
-- Existing plans and assignments are preserved; unlinked plans remain NULL.
begin;

alter table public.activity_session_plans
  add column if not exists linked_assignment_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.activity_session_plans'::regclass
      and conname = 'activity_session_plans_linked_assignment_id_fkey'
  ) then
    alter table public.activity_session_plans
      add constraint activity_session_plans_linked_assignment_id_fkey
      foreign key (linked_assignment_id)
      references public.activity_assignments(id) on delete set null;
  end if;
end;
$$;

create unique index if not exists ix_red_activity_session_plan_assignment
  on public.activity_session_plans (linked_assignment_id)
  where linked_assignment_id is not null;

create or replace function public.red_create_session_quiz_assignment(
  p_plan_id text,
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
  session_plan public.activity_session_plans%rowtype;
  assignment jsonb;
  now_value text := public.red_now();
begin
  if p_plan_id is null or p_plan_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_id is null or p_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or p_batch_id is null or p_activity_id is null or p_title is null
    or p_instructions is null or length(p_instructions) > 2000
    or (p_due_date is not null and (p_due_date !~ '^\d{4}-\d{2}-\d{2}$'
      or p_due_date < to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD'))) then
    raise exception 'RED_ACTIVITY_SESSION_INVALID';
  end if;

  select * into session_plan
    from public.activity_session_plans
    where id = p_plan_id
    for update;
  if session_plan.id is null
    or session_plan.batch_id <> p_batch_id
    or session_plan.activity_id <> p_activity_id then
    raise exception 'RED_ACTIVITY_SESSION_INVALID';
  end if;
  if session_plan.linked_assignment_id is not null then
    raise exception 'RED_ACTIVITY_SESSION_QUIZ_EXISTS';
  end if;
  if session_plan.session_date > to_char(now() at time zone 'Africa/Cairo', 'YYYY-MM-DD') then
    raise exception 'RED_ACTIVITY_SESSION_EARLY';
  end if;
  if session_plan.company_id is not null and exists (
    select 1
    from jsonb_array_elements_text(p_trainee_ids) as selected(trainee_id)
    left join public.trainees trainee
      on trainee.id = selected.trainee_id
      and trainee.batch_id = session_plan.batch_id
      and trainee.company_id = session_plan.company_id
      and trainee.enrollment_status = 'Active'
    where trainee.id is null
  ) then
    raise exception 'RED_ACTIVITY_TARGETS';
  end if;

  assignment := public.red_create_activity_assignment(
    p_id, p_batch_id, p_activity_id, p_title, p_instructions,
    p_due_date, p_trainee_ids, p_actor
  );

  update public.activity_session_plans
    set linked_assignment_id = p_id,
        version = version + 1,
        updated_at = now_value
    where id = p_plan_id and linked_assignment_id is null;
  if not found then
    raise exception 'RED_ACTIVITY_SESSION_QUIZ_EXISTS';
  end if;

  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'link-session-quiz',
    'activity_session_plans', p_plan_id,
    'Linked a private follow-up quiz to the shared session plan.', now_value);

  return assignment || jsonb_build_object('session_plan_id', p_plan_id);
end;
$$;

alter table public.activity_session_plans enable row level security;
revoke all on function public.red_create_session_quiz_assignment(text, text, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.red_create_session_quiz_assignment(text, text, text, text, text, text, text, jsonb, text) to service_role;

commit;
