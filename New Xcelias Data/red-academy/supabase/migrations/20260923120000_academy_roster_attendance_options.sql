begin;

alter table public.trainees
  add column if not exists enrollment_status text not null default 'Active'
  check (enrollment_status in ('Active', 'Stopped Attending'));

alter table public.daily_attendance
  add column if not exists assessment_day boolean not null default false
  check (assessment_day = false or status = 'Present');

commit;
