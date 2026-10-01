-- Additive only: no existing batches, trainees, attendance or assessments are changed.
begin;
alter table public.activity_live_players add column if not exists trainee_id text;
alter table public.activity_live_rooms add column if not exists profile_results_saved_at text;

create table public.activity_live_profile_results (
 id text primary key,
 source_room_id text not null, -- survives temporary room expiry
 source_player_id text not null,
 trainee_id text not null,
 batch_id text not null,
 activity_id text not null,
 title text not null,
 nickname text not null,
 correct_count integer not null check(correct_count>=0 and correct_count<=answered_count),
 answered_count integer not null check(answered_count>=0 and answered_count<=total_rounds),
 total_rounds integer not null check(total_rounds>0),
 score numeric(5,2) not null check(score between 0 and 100),
 room_points integer not null check(room_points>=0),
 confirmed_by text not null,
 created_at text not null,
 unique(source_room_id,trainee_id),
 unique(source_room_id,source_player_id),
 foreign key(trainee_id,batch_id) references public.trainees(id,batch_id) on delete cascade
);
create index ix_red_live_profile_history on public.activity_live_profile_results(trainee_id,created_at desc,id desc);
alter table public.activity_live_profile_results enable row level security;
revoke all on public.activity_live_profile_results from public,anon,authenticated;
grant all on public.activity_live_profile_results to service_role;

-- Claims are not authentication. Duplicate claims remain joinable for trainer review.
create function public.red_activity_live_roster_join(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.activity_live_rooms%rowtype; result jsonb; claimed text:=p_payload->>'trainee_id';
begin
 select * into r from public.activity_live_rooms where code_hash=p_payload->>'code_hash' for update;
 if r.id is null or r.expires_at::timestamptz<=now() then raise exception 'RED_ACTIVITY_LIVE_INVALID_CODE'; end if;
 if r.deck_snapshot->'roster' is not null and r.deck_snapshot->'roster'<>'null'::jsonb then
  if claimed is null or not exists(select 1 from jsonb_array_elements(r.deck_snapshot->'roster'->'trainees') t where t->>'id'=claimed) then raise exception 'RED_ACTIVITY_LIVE_ROSTER'; end if;
 elsif claimed is not null then raise exception 'RED_ACTIVITY_LIVE_ROSTER'; end if;
 result:=public.red_activity_live_join(p_payload);
 update public.activity_live_players set trainee_id=claimed where id=p_payload->>'player_id' and room_id=r.id;
 return result;
end; $$;

create function public.red_activity_live_saved_replay_guard()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if old.profile_results_saved_at is not null and new.status='Open' and old.status<>'Open' then raise exception 'RED_ACTIVITY_LIVE_RESULTS_SAVED'; end if;
 return new;
end; $$;
create trigger red_live_saved_replay_guard before update on public.activity_live_rooms for each row execute function public.red_activity_live_saved_replay_guard();

create function public.red_activity_live_save_results(p_room_id text,p_owner_id text,p_mappings jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 r public.activity_live_rooms%rowtype; p public.activity_live_players%rowtype;
 b public.batches%rowtype; t public.trainees%rowtype;
 item jsonb; total integer; answered integer; correct integer;
 now_value text:=public.red_now(); actor text; saved integer:=0;
begin
 select * into r from public.activity_live_rooms where id=p_room_id for update;
 if r.id is null or r.expires_at::timestamptz<=now() then raise exception 'RED_ACTIVITY_LIVE_INVALID_CODE'; end if;
 select email into actor from public.users where id=p_owner_id and active and role in ('admin','instructor');
 if r.owner_id<>p_owner_id or actor is null then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
 if r.status<>'Complete' or coalesce(r.deck_snapshot->'roster','null'::jsonb)='null'::jsonb then raise exception 'RED_ACTIVITY_LIVE_RESULTS_STATE'; end if;
 if r.profile_results_saved_at is not null then return jsonb_build_object('saved_at',r.profile_results_saved_at); end if;
 if jsonb_typeof(p_mappings) is distinct from 'array' then raise exception 'RED_ACTIVITY_LIVE_RESULTS_MAPPING'; end if;
 if jsonb_array_length(p_mappings) not between 1 and 80
   or jsonb_array_length(p_mappings)<>(select count(*) from public.activity_live_players where room_id=r.id)
   or (select count(distinct v->>'player_id') from jsonb_array_elements(p_mappings) v)<>jsonb_array_length(p_mappings)
   or (select count(v->>'trainee_id') from jsonb_array_elements(p_mappings) v)<>(select count(distinct v->>'trainee_id') from jsonb_array_elements(p_mappings) v)
 then raise exception 'RED_ACTIVITY_LIVE_RESULTS_MAPPING'; end if;
 select * into b from public.batches where id=r.deck_snapshot->'roster'->>'batch_id' for update;
 if b.id is null or b.archived_at is not null then raise exception 'RED_ACTIVITY_BATCH'; end if;
 total:=jsonb_array_length(r.deck_snapshot->'questions');
 for item in select value from jsonb_array_elements(p_mappings) loop
  select * into p from public.activity_live_players where id=item->>'player_id' and room_id=r.id;
  if p.id is null or not(item ? 'trainee_id') then raise exception 'RED_ACTIVITY_LIVE_RESULTS_MAPPING'; end if;
  if item->>'trainee_id' is null then continue; end if;
  select * into t from public.trainees where id=item->>'trainee_id' and batch_id=b.id for update;
  if t.id is null or t.enrollment_status='Stopped Attending' or not exists(select 1 from jsonb_array_elements(r.deck_snapshot->'roster'->'trainees') v where v->>'id'=t.id) then raise exception 'RED_ACTIVITY_TARGETS'; end if;
  select count(*),count(*) filter(where a.correct) into answered,correct from public.activity_live_answers a where a.room_id=r.id and a.player_id=p.id and a.correct is not null;
  insert into public.activity_live_profile_results(id,source_room_id,source_player_id,trainee_id,batch_id,activity_id,title,nickname,correct_count,answered_count,total_rounds,score,room_points,confirmed_by,created_at)
   values(gen_random_uuid()::text,r.id,p.id,t.id,b.id,r.activity_id,r.deck_snapshot->>'title',p.nickname,correct,answered,total,round(correct::numeric/total*100,2),p.points,actor,now_value);
  saved:=saved+1;
 end loop;
 update public.activity_live_rooms set profile_results_saved_at=now_value,updated_at=now_value where id=r.id;
 insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
  values(gen_random_uuid()::text,actor,'confirm-live-activity-results','activity_live_rooms',r.id,'Confirmed '||saved||' activity profile results. Attendance, formal assessments and XP unchanged.',now_value);
 return jsonb_build_object('saved_at',now_value,'saved_count',saved);
end; $$;

revoke all on function public.red_activity_live_roster_join(jsonb) from public,anon,authenticated;
revoke all on function public.red_activity_live_save_results(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.red_activity_live_saved_replay_guard() from public,anon,authenticated;
grant execute on function public.red_activity_live_roster_join(jsonb) to service_role;
grant execute on function public.red_activity_live_save_results(text,text,jsonb) to service_role;
commit;
