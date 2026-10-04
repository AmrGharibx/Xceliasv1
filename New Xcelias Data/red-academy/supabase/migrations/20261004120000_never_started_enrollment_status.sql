begin;

alter table public.trainees
  drop constraint if exists trainees_enrollment_status_check;

alter table public.trainees
  add constraint trainees_enrollment_status_check
  check (enrollment_status in ('Active', 'Stopped Attending', 'Never Started'));

-- Keep server-side activity RPCs aligned with the application roster filters.
-- Replacing only these known predicates preserves the deployed function bodies,
-- their audit behavior, and their existing grants.
do $$
declare
  definition text;
  original_definition text;
begin
  select pg_get_functiondef(
    'public.red_create_activity_session_plan(text,text,text,text,text,text,integer,text,jsonb,text)'::regprocedure
  ) into definition;
  original_definition := definition;
  definition := replace(
    definition,
    't.enrollment_status <> ''Stopped Attending''',
    't.enrollment_status = ''Active'''
  );
  if definition = original_definition then
    raise exception 'Could not update the activity session-plan roster guard.';
  end if;
  execute definition;

  select pg_get_functiondef(
    'public.red_activity_live_save_results(text,text,jsonb)'::regprocedure
  ) into definition;
  original_definition := definition;
  definition := replace(
    definition,
    't.enrollment_status=''Stopped Attending''',
    't.enrollment_status<>' || quote_literal('Active')
  );
  if definition = original_definition then
    raise exception 'Could not update the live-activity result roster guard.';
  end if;
  execute definition;
end;
$$;

commit;
