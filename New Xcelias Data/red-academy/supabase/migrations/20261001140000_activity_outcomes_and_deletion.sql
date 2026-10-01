-- Additive schema; operational writes happen only through explicit trainer actions.
begin;
alter table public.activity_live_profile_results add column earned_xp integer not null default 0 check(earned_xp>=0);
alter table public.activity_live_profile_results add column session_date text;
alter table public.activity_live_profile_results add column attendance_status text;
create table public.activity_assignment_deletions (
 id text primary key, snapshot jsonb not null, deleted_by text not null, deleted_at text not null
);
alter table public.activity_assignment_deletions enable row level security;
revoke all on public.activity_assignment_deletions from public,anon,authenticated;
grant all on public.activity_assignment_deletions to service_role;

create function public.red_activity_presence(p_trainee_id text,p_batch_id text,p_date text,p_source_id text,p_actor text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.daily_attendance%rowtype; b public.batches%rowtype; now_value text:=public.red_now();
begin
 if not exists(select 1 from public.users where email=p_actor and active and role in ('admin','instructor')) then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
 -- The batch row lock serializes all activity attendance writers, including different rooms.
 select * into b from public.batches where id=p_batch_id for update;
 if b.id is null or b.archived_at is not null then raise exception 'RED_ACTIVITY_BATCH'; end if;
 if p_date is null or p_date !~ '^\d{4}-\d{2}-\d{2}$' or p_date>(now() at time zone 'Africa/Cairo')::date::text or not(b.session_dates ? p_date) then raise exception 'RED_ACTIVITY_ATTENDANCE_DATE'; end if;
 if not exists(select 1 from public.trainees where id=p_trainee_id and batch_id=b.id and enrollment_status='Active') then raise exception 'RED_ACTIVITY_TARGETS'; end if;
 select * into d from public.daily_attendance where trainee_id=p_trainee_id and batch_id=b.id and date=p_date order by created_at,id limit 1;
 if d.id is not null then return jsonb_build_object('id',d.id,'status',d.status,'created',false); end if;
 insert into public.daily_attendance(id,trainee_id,batch_id,date,status,arrival_time,departure_time,is_late,assessment_day,absence_reason,analytics_included,source_meta,version,created_at,updated_at)
 values(gen_random_uuid()::text,p_trainee_id,b.id,p_date,'Present',null,null,false,false,'',true,jsonb_build_object('activity_id',p_source_id,'confirmed_by',p_actor),1,now_value,now_value) returning * into d;
 insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values(gen_random_uuid()::text,p_actor,'activity-attendance','daily_attendance',d.id,'Recorded trainer-confirmed activity participation as Present. No arrival time or late flag inferred.',now_value);
 return jsonb_build_object('id',d.id,'status',d.status,'created',true);
end; $$;

create function public.red_activity_live_save_outcomes(p_room_id text,p_owner_id text,p_mappings jsonb,p_session_date text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.activity_live_rooms%rowtype; b public.batches%rowtype; result jsonb; item public.activity_live_profile_results%rowtype; presence jsonb; actor text;
begin
 select * into r from public.activity_live_rooms where id=p_room_id for update;
 select email into actor from public.users where id=p_owner_id and active and role in ('admin','instructor');
 if actor is null or r.owner_id is distinct from p_owner_id then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
 if r.profile_results_saved_at is not null then return jsonb_build_object('saved_at',r.profile_results_saved_at); end if;
 select * into b from public.batches where id=r.deck_snapshot->'roster'->>'batch_id' for update;
 if p_session_date is not null and (b.id is null or p_session_date !~ '^\d{4}-\d{2}-\d{2}$' or p_session_date>(now() at time zone 'Africa/Cairo')::date::text or not(b.session_dates ? p_session_date)) then raise exception 'RED_ACTIVITY_ATTENDANCE_DATE'; end if;
 result:=public.red_activity_live_save_results(p_room_id,p_owner_id,p_mappings);
 for item in select * from public.activity_live_profile_results where source_room_id=p_room_id loop
  presence:=null;
  if p_session_date is not null and item.answered_count>0 then presence:=public.red_activity_presence(item.trainee_id,item.batch_id,p_session_date,p_room_id,actor); end if;
  update public.activity_live_profile_results set earned_xp=item.correct_count*100,session_date=p_session_date,attendance_status=presence->>'status' where id=item.id;
 end loop;
 insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values(gen_random_uuid()::text,actor,'confirm-live-activity-outcomes','activity_live_rooms',p_room_id,'Awarded server-graded activity XP. Confirmed session attendance where selected; existing attendance and formal assessments preserved.',public.red_now());
 return result;
end; $$;

create function public.red_record_activity_attendance(p_id text,p_expected_version integer,p_session_date text,p_actor text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.activity_assignments%rowtype; person record; presence jsonb; created integer:=0; preserved integer:=0;
begin
 if not exists(select 1 from public.users where email=p_actor and active and role in ('admin','instructor')) then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
 select * into a from public.activity_assignments where id=p_id for update;
 if a.id is null then raise exception 'RED_NOT_FOUND'; end if;
 if a.version<>p_expected_version then raise exception 'RED_CONFLICT'; end if;
 for person in select p.trainee_id from public.activity_assignment_participants p join public.trainees t on t.id=p.trainee_id and t.batch_id=p.batch_id where p.assignment_id=a.id and p.status='Completed' and t.enrollment_status='Active' loop
  presence:=public.red_activity_presence(person.trainee_id,a.batch_id,p_session_date,a.id,p_actor);
  if (presence->>'created')::boolean then created:=created+1; else preserved:=preserved+1; end if;
 end loop;
 if created+preserved=0 then raise exception 'RED_ACTIVITY_ATTENDANCE_EMPTY'; end if;
 insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values(gen_random_uuid()::text,p_actor,'confirm-assignment-attendance','activity_assignments',a.id,'Confirmed completed participants for '||p_session_date||'; created '||created||' attendance records. Existing records preserved.',public.red_now());
 return jsonb_build_object('created',created,'preserved',preserved,'session_date',p_session_date);
end; $$;

create function public.red_delete_activity_assignment(p_id text,p_expected_version integer,p_actor text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.activity_assignments%rowtype; actor_role text; snapshot jsonb; now_value text:=public.red_now();
begin
 select role into actor_role from public.users where email=p_actor and active and role in ('admin','instructor');
 if actor_role is null then raise exception 'RED_ACTIVITY_DELETE_FORBIDDEN'; end if;
 select * into a from public.activity_assignments where id=p_id for update;
 if a.id is null then raise exception 'RED_NOT_FOUND'; end if;
 if actor_role<>'admin' and a.created_by<>p_actor then raise exception 'RED_ACTIVITY_DELETE_FORBIDDEN'; end if;
 if a.version<>p_expected_version then raise exception 'RED_CONFLICT'; end if;
 -- Serialize submissions and capture every participant before the FK cascade.
 perform 1 from public.activity_assignment_participants where assignment_id=a.id order by id for update;
 snapshot:=jsonb_build_object('assignment',to_jsonb(a),'participants',coalesce((select jsonb_agg(to_jsonb(p)) from public.activity_assignment_participants p where assignment_id=a.id),'[]'::jsonb),'session_plans',coalesce((select jsonb_agg(to_jsonb(p)) from public.activity_session_plans p where linked_assignment_id=a.id),'[]'::jsonb));
 insert into public.activity_assignment_deletions(id,snapshot,deleted_by,deleted_at) values(a.id,snapshot,p_actor,now_value);
 update public.activity_session_plans set linked_assignment_id=null,version=version+1,updated_at=now_value where linked_assignment_id=a.id;
 delete from public.activity_assignments where id=a.id;
 insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values(gen_random_uuid()::text,p_actor,'delete-activity-assignment','activity_assignments',a.id,'Deleted assignment and its entries; private recovery snapshot retained. Batch, attendance and formal assessments preserved.',now_value);
 return jsonb_build_object('id',a.id,'deleted',true,'recoverable',true);
end; $$;

create function public.red_activity_live_xp()
returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (select trainee_id,batch_id,sum(earned_xp)::integer as earned_xp,count(*)::integer as games from public.activity_live_profile_results group by trainee_id,batch_id) t;
$$;
revoke all on function public.red_activity_presence(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.red_activity_live_save_outcomes(text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.red_record_activity_attendance(text,integer,text,text) from public,anon,authenticated;
revoke all on function public.red_delete_activity_assignment(text,integer,text) from public,anon,authenticated;
revoke all on function public.red_activity_live_xp() from public,anon,authenticated;
grant execute on function public.red_activity_presence(text,text,text,text,text) to service_role;
grant execute on function public.red_activity_live_save_outcomes(text,text,jsonb,text) to service_role;
grant execute on function public.red_record_activity_attendance(text,integer,text,text) to service_role;
grant execute on function public.red_delete_activity_assignment(text,integer,text) to service_role;
grant execute on function public.red_activity_live_xp() to service_role;
commit;
