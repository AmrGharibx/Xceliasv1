-- RED Academy cloud data model. Application requests use the academy Edge
-- Function with a service role; no browser role can query these tables.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto schema extensions;

create table if not exists public.companies (
  id text primary key,
  name text not null,
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null
);
create unique index if not exists ux_red_companies_name on public.companies (lower(name));

create table if not exists public.batches (
  id text primary key,
  batch_name text not null,
  status text check (status in ('Planning', 'Active', 'Completed')),
  start_date text,
  end_date text check (end_date is null or start_date is null or end_date >= start_date),
  session_dates jsonb not null check (jsonb_typeof(session_dates) = 'array' and jsonb_array_length(session_dates) <= 366),
  capacity integer check (capacity between 1 and 1000),
  description text not null default '',
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.trainees (
  id text primary key,
  trainee_name text not null,
  company_id text references public.companies(id) on delete restrict,
  batch_id text references public.batches(id) on delete cascade,
  email text not null default '',
  phone text not null default '',
  job_title text not null default '',
  notes text not null default '',
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null,
  unique (id, batch_id)
);

create table if not exists public.daily_attendance (
  id text primary key,
  trainee_id text,
  batch_id text references public.batches(id) on delete cascade,
  date text,
  arrival_time text,
  departure_time text,
  status text check (status in ('Present', 'Absent', 'Tour Day', 'Off Day')),
  is_late boolean not null default false,
  absence_reason text not null default '',
  analytics_included boolean not null default true,
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null,
  foreign key (trainee_id, batch_id) references public.trainees(id, batch_id) on delete cascade,
  check (source_id is not null or departure_time is null or (arrival_time is not null and departure_time >= arrival_time)),
  check (source_id is not null or status not in ('Absent', 'Off Day') or (arrival_time is null and departure_time is null and is_late = false))
);

create table if not exists public.attendance_10day (
  id text primary key,
  trainee_id text,
  batch_id text references public.batches(id) on delete cascade,
  period_start text,
  period_end text check (period_end is null or period_start is null or period_end >= period_start),
  days jsonb not null check (jsonb_typeof(days) = 'array' and jsonb_array_length(days) = 10),
  report text not null default '',
  report_kind text not null default 'template' check (report_kind in ('template', 'ai', 'notion')),
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null,
  foreign key (trainee_id, batch_id) references public.trainees(id, batch_id) on delete cascade
);

create table if not exists public.assessments (
  id text primary key,
  trainee_id text,
  batch_id text references public.batches(id) on delete cascade,
  assessment_title text not null,
  recorded_attendance integer check (recorded_attendance >= 0),
  recorded_absence integer check (recorded_absence >= 0),
  company_id text references public.companies(id) on delete restrict,
  analytics_included boolean not null default true,
  mapping double precision check (mapping between 0 and 5),
  product_knowledge double precision check (product_knowledge between 0 and 5),
  presentability double precision check (presentability between 0 and 5),
  soft_skills double precision check (soft_skills between 0 and 5),
  assessment_outcome text check (assessment_outcome in ('Failed', 'Needs Improvement', 'Good', 'Very Good', 'Excellent', 'Aced')),
  instructor_comment text not null default '',
  report text not null default '',
  report_kind text not null default 'template' check (report_kind in ('template', 'ai', 'notion')),
  source_id text,
  source_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(source_meta) = 'object'),
  version integer not null default 1,
  created_at text not null,
  updated_at text not null,
  foreign key (trainee_id, batch_id) references public.trainees(id, batch_id) on delete cascade
);

create table if not exists public.audit_log (
  id text primary key,
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text,
  details text not null,
  created_at text not null
);

create table if not exists public.assessment_history (
  id text primary key,
  assessment_id text,
  trainee_id text,
  actor text not null,
  snapshot jsonb not null,
  created_at text not null
);

create table if not exists public.users (
  id text primary key,
  email text not null,
  full_name text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'instructor', 'viewer')),
  active boolean not null default false,
  created_at text not null
);
create unique index if not exists ux_red_users_email on public.users (lower(email));

create table if not exists public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at bigint not null
);

create table if not exists public.rate_limits (
  key text primary key,
  window_start bigint not null,
  count integer not null
);

create table if not exists public.setup_grants (
  name text primary key,
  token_hash text not null,
  expires_at bigint not null
);

create table if not exists public.invitations (
  id text primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'instructor', 'viewer')),
  token_hash text not null unique,
  invited_by text references public.users(id) on delete set null,
  created_at text not null,
  expires_at bigint not null,
  used_at bigint,
  revoked_at bigint
);
create index if not exists ix_red_invitation_email on public.invitations (lower(email));

create table if not exists public.import_runs (
  id text primary key,
  source_name text not null,
  source_sha256 text not null unique,
  imported_at text not null,
  summary jsonb not null check (jsonb_typeof(summary) = 'object')
);

create table if not exists public.source_records (
  id text primary key,
  import_id text not null references public.import_runs(id),
  kind text not null,
  title text not null,
  path text not null,
  sha256 text not null,
  raw text not null,
  properties jsonb not null check (jsonb_typeof(properties) = 'object'),
  relations jsonb not null check (jsonb_typeof(relations) = 'object'),
  batch_id text,
  disposition text not null,
  reason text not null,
  app_records jsonb not null check (jsonb_typeof(app_records) = 'array')
);

create table if not exists public.import_reviews (
  id text primary key,
  code text not null,
  batch_id text,
  entity text,
  entity_id text,
  source_ids jsonb not null check (jsonb_typeof(source_ids) = 'array'),
  message text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  resolution text not null default '',
  updated_at text not null
);

-- Private portrait bytes stay in a private Storage bucket; the table contains
-- only object metadata and never appears in a workspace state response.
create table if not exists public.trainee_photos (
  trainee_id text primary key references public.trainees(id) on delete cascade,
  object_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  updated_at text not null
);

create table if not exists public.workspace_state (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 0,
  updated_at text not null
);
insert into public.workspace_state(singleton, revision, updated_at)
values (true, 0, to_char(clock_timestamp() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
on conflict (singleton) do nothing;

-- This carries no training or user data. It is the only object readable by the
-- public realtime client, so authenticated browser sessions can refresh
-- immediately after another staff member saves a change.
create table if not exists public.academy_live_signal (
  singleton boolean primary key default true check (singleton),
  revision bigint not null default 0
);
alter table public.academy_live_signal replica identity full;
insert into public.academy_live_signal(singleton, revision) values (true, 0)
on conflict (singleton) do nothing;

create index if not exists ix_red_trainee_batch on public.trainees(batch_id);
create index if not exists ix_red_trainee_company on public.trainees(company_id);
create index if not exists ix_red_attendance_batch_date on public.daily_attendance(batch_id, date);
create index if not exists ix_red_assessment_batch on public.assessments(batch_id);
create index if not exists ix_red_source_batch on public.source_records(batch_id);
create index if not exists ix_red_source_kind on public.source_records(kind, disposition);
create index if not exists ix_red_review_batch on public.import_reviews(batch_id, status);
create unique index if not exists ix_red_daily_native_unique on public.daily_attendance(trainee_id, date) where source_id is null;
create unique index if not exists ix_red_assessment_native_unique on public.assessments(trainee_id, batch_id) where source_id is null;
create unique index if not exists ix_red_checklist_native_unique on public.attendance_10day(trainee_id, batch_id, period_start, period_end) where source_id is null;

create or replace function public.red_now()
returns text language sql volatile set search_path = public, pg_temp
as $$ select to_char(clock_timestamp() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') $$;

create or replace function public.red_now_ms()
returns bigint language sql volatile set search_path = public, pg_temp
as $$ select floor(extract(epoch from clock_timestamp()) * 1000)::bigint $$;

create or replace function public.red_guard_trainee()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare current_capacity integer;
begin
  if tg_op = 'UPDATE' and new.batch_id is distinct from old.batch_id then
    raise exception 'An enrollment cannot change batches.';
  end if;
  if tg_op = 'INSERT' and new.batch_id is not null then
    select capacity into current_capacity from public.batches where id = new.batch_id;
    if current_capacity is not null and (select count(*) from public.trainees where batch_id = new.batch_id) >= current_capacity then
      raise exception 'Batch is at capacity.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.red_guard_batch()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.capacity is not null and new.capacity < (select count(*) from public.trainees where batch_id = old.id) then
    raise exception 'Batch capacity cannot be lower than enrollment.';
  end if;
  if old.source_id is null and exists (select 1 from public.trainees where batch_id = old.id)
    and (new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date or new.session_dates is distinct from old.session_dates) then
    raise exception 'Enrolled batch dates are locked.';
  end if;
  return new;
end;
$$;

create or replace function public.red_guard_batch_sessions()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if jsonb_typeof(new.session_dates) <> 'array'
    or (new.source_id is null and jsonb_array_length(new.session_dates) <> 10)
    or (select count(distinct value) from jsonb_array_elements_text(new.session_dates) as d(value)) <> jsonb_array_length(new.session_dates)
    or exists (
      select 1 from jsonb_array_elements(new.session_dates) as d(value)
      where jsonb_typeof(d.value) <> 'string'
        or (new.source_id is null and ((d.value #>> '{}') < new.start_date or (d.value #>> '{}') > new.end_date))
    ) then
    raise exception 'Invalid batch session dates.';
  end if;
  return new;
end;
$$;

create or replace function public.red_guard_daily_attendance()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (new.trainee_id is distinct from old.trainee_id or new.batch_id is distinct from old.batch_id) then
    raise exception 'An attendance record cannot change enrollment.';
  end if;
  if new.source_id is null and not exists (
    select 1 from public.batches where id = new.batch_id and session_dates ? new.date
  ) then
    raise exception 'Attendance requires a scheduled session date.';
  end if;
  return new;
end;
$$;

create or replace function public.red_guard_checklist()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and (new.trainee_id is distinct from old.trainee_id or new.batch_id is distinct from old.batch_id) then
    raise exception 'A checklist cannot change enrollment.';
  end if;
  if jsonb_typeof(new.days) <> 'array' or jsonb_array_length(new.days) <> 10
    or exists (select 1 from jsonb_array_elements(new.days) as d(value) where jsonb_typeof(d.value) <> 'boolean')
    or (new.source_id is null and not exists (select 1 from public.batches where id = new.batch_id and start_date = new.period_start and end_date = new.period_end)) then
    raise exception 'Invalid checklist period or day values.';
  end if;
  return new;
end;
$$;

create or replace function public.red_guard_assessment()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.trainee_id is distinct from old.trainee_id or new.batch_id is distinct from old.batch_id then
    raise exception 'An assessment cannot change enrollment.';
  end if;
  return new;
end;
$$;

drop trigger if exists red_trainee_guard on public.trainees;
create trigger red_trainee_guard before insert or update on public.trainees for each row execute function public.red_guard_trainee();
drop trigger if exists red_batch_guard on public.batches;
create trigger red_batch_guard before update on public.batches for each row execute function public.red_guard_batch();
drop trigger if exists red_batch_sessions_guard on public.batches;
create trigger red_batch_sessions_guard before insert or update on public.batches for each row execute function public.red_guard_batch_sessions();
drop trigger if exists red_daily_guard on public.daily_attendance;
create trigger red_daily_guard before insert or update on public.daily_attendance for each row execute function public.red_guard_daily_attendance();
drop trigger if exists red_checklist_guard on public.attendance_10day;
create trigger red_checklist_guard before insert or update on public.attendance_10day for each row execute function public.red_guard_checklist();
drop trigger if exists red_assessment_guard on public.assessments;
create trigger red_assessment_guard before update on public.assessments for each row execute function public.red_guard_assessment();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('red-academy-portraits', 'red-academy-portraits', false, 81920, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 81920, allowed_mime_types = excluded.allowed_mime_types;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'companies', 'batches', 'trainees', 'daily_attendance', 'attendance_10day', 'assessments',
    'audit_log', 'assessment_history', 'users', 'sessions', 'rate_limits', 'setup_grants',
    'invitations', 'import_runs', 'source_records', 'import_reviews', 'trainee_photos', 'workspace_state', 'academy_live_signal'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end;
$$;

-- The signal has no company data: only an opaque increasing number. All
-- workspace records remain denied to anon/authenticated database roles.
grant select on table public.academy_live_signal to anon;
drop policy if exists red_academy_live_signal_read on public.academy_live_signal;
create policy red_academy_live_signal_read on public.academy_live_signal for select to anon using (true);
do $$
begin
  alter publication supabase_realtime add table public.academy_live_signal;
exception when duplicate_object then null;
end;
$$;

commit;
