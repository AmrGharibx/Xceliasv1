begin;

create table public.qr_attendance_venues (
  id text primary key,
  name text not null check (length(name) between 2 and 100),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_m integer not null default 200 check (radius_m between 50 and 2000),
  active boolean not null default true,
  is_default boolean not null default false,
  created_by text not null,
  created_at text not null,
  updated_at text not null
);
create unique index ux_qr_attendance_default_venue on public.qr_attendance_venues(is_default) where is_default;
insert into public.qr_attendance_venues(id,name,latitude,longitude,radius_m,active,is_default,created_by,created_at,updated_at)
values ('academy-default','Red Training Academy',30.0076922,31.5332323,200,true,true,'system',public.red_now(),public.red_now());

create table public.qr_attendance_batch_links (
  id text primary key,
  batch_id text not null references public.batches(id) on delete cascade,
  batch_qr_id text not null unique check (length(batch_qr_id) between 16 and 128),
  active boolean not null default true,
  created_by text not null,
  created_at text not null,
  revoked_at text,
  rotated_from text references public.qr_attendance_batch_links(id) on delete set null
);
create unique index ux_qr_attendance_active_batch_link on public.qr_attendance_batch_links(batch_id) where active;

create table public.qr_attendance_sessions (
  id text primary key,
  batch_id text not null references public.batches(id) on delete cascade,
  venue_id text not null references public.qr_attendance_venues(id) on delete restrict,
  session_date text not null check (session_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  day_number integer not null check (day_number between 1 and 366),
  venue_name text not null,
  venue_latitude double precision not null check (venue_latitude between -90 and 90),
  venue_longitude double precision not null check (venue_longitude between -180 and 180),
  radius_m integer not null check (radius_m between 50 and 2000),
  created_by text not null,
  opened_at text not null,
  closed_at text,
  expires_at text not null,
  version integer not null default 1 check (version >= 1)
);
create unique index ux_qr_attendance_one_open_session_per_batch on public.qr_attendance_sessions(batch_id) where closed_at is null;
create index ix_qr_attendance_sessions_date on public.qr_attendance_sessions(batch_id,session_date,opened_at desc);

create table public.qr_attendance_enrollments (
  id text primary key,
  trainee_id text not null,
  batch_id text not null references public.batches(id) on delete cascade,
  public_key jsonb not null check (jsonb_typeof(public_key) = 'object'),
  created_at text not null,
  last_used_at text,
  revoked_at text,
  revoked_by text,
  foreign key (trainee_id,batch_id) references public.trainees(id,batch_id) on delete cascade
);
create unique index ux_qr_attendance_one_active_enrollment_per_trainee on public.qr_attendance_enrollments(trainee_id) where revoked_at is null;
create unique index ux_qr_attendance_one_active_public_key on public.qr_attendance_enrollments(public_key) where revoked_at is null;

create table public.qr_attendance_activation_codes (
  id text primary key,
  trainee_id text not null,
  batch_id text not null references public.batches(id) on delete cascade,
  code_hash text not null unique check (length(code_hash) = 64),
  issued_by text not null,
  issued_at text not null,
  expires_at text not null,
  consumed_at text,
  revoked_at text,
  enrollment_id text references public.qr_attendance_enrollments(id) on delete set null,
  foreign key (trainee_id,batch_id) references public.trainees(id,batch_id) on delete cascade
);
create unique index ux_qr_attendance_one_unused_code_per_trainee on public.qr_attendance_activation_codes(trainee_id) where consumed_at is null and revoked_at is null;

create table public.qr_attendance_challenges (
  id text primary key,
  session_id text not null references public.qr_attendance_sessions(id) on delete cascade,
  enrollment_id text not null references public.qr_attendance_enrollments(id) on delete cascade,
  challenge_hash text not null check (length(challenge_hash) = 64),
  created_at text not null,
  expires_at text not null,
  consumed_at text
);
create index ix_qr_attendance_challenges_expiry on public.qr_attendance_challenges(expires_at,consumed_at);

create table public.qr_attendance_location_reviews (
  id text primary key,
  session_id text not null references public.qr_attendance_sessions(id) on delete cascade,
  batch_id text not null references public.batches(id) on delete cascade,
  trainee_id text not null,
  reason text not null check (reason in ('outside_geofence','boundary_uncertain','permission_denied','location_unavailable','location_timeout')),
  accuracy_band text not null check (accuracy_band in ('unknown','0-25m','26-75m','76-150m','over-150m')),
  distance_band text not null check (distance_band in ('unknown','within-radius','up-to-500m-outside','over-500m-outside')),
  attempt_count integer not null default 1 check (attempt_count >= 1),
  status text not null default 'open' check (status in ('open','resolved')),
  resolution text,
  resolved_by text,
  resolved_at text,
  created_at text not null,
  updated_at text not null,
  foreign key (trainee_id,batch_id) references public.trainees(id,batch_id) on delete cascade
);
create unique index ux_qr_attendance_one_open_location_review on public.qr_attendance_location_reviews(session_id,trainee_id) where status='open';
create index ix_qr_attendance_location_reviews_session on public.qr_attendance_location_reviews(batch_id,session_id,status,created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'qr_attendance_venues','qr_attendance_batch_links','qr_attendance_sessions',
    'qr_attendance_enrollments','qr_attendance_activation_codes','qr_attendance_challenges',
    'qr_attendance_location_reviews'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end;
$$;

create or replace function public.red_qr_public_enroll(p_batch_qr_id text,p_code_hash text,p_public_key jsonb,p_enrollment_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare link_row public.qr_attendance_batch_links%rowtype; batch_row public.batches%rowtype; code_row public.qr_attendance_activation_codes%rowtype; trainee_row public.trainees%rowtype; existing_row public.qr_attendance_enrollments%rowtype; now_text text:=public.red_now();
begin
  select l.* into link_row from public.qr_attendance_batch_links l where l.batch_qr_id=p_batch_qr_id and l.active for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  select * into batch_row from public.batches where id=link_row.batch_id;
  if batch_row.status<>'Active' or batch_row.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
  if not exists(select 1 from public.qr_attendance_sessions s where s.batch_id=batch_row.id and s.closed_at is null and s.session_date=to_char(now() at time zone 'Africa/Cairo','YYYY-MM-DD') and s.expires_at::timestamptz>now()) then raise exception 'RED_QR_NO_SESSION'; end if;
  select * into code_row from public.qr_attendance_activation_codes where code_hash=p_code_hash and batch_id=batch_row.id for update;
  if not found then raise exception 'RED_QR_CODE_INVALID'; end if;
  if code_row.consumed_at is not null and code_row.enrollment_id is not null then
    select * into existing_row from public.qr_attendance_enrollments where id=code_row.enrollment_id and batch_id=batch_row.id;
    if found and existing_row.revoked_at is null and existing_row.public_key=p_public_key then
      select * into trainee_row from public.trainees where id=existing_row.trainee_id;
      return jsonb_build_object('credentialId',existing_row.id,'traineeName',trainee_row.trainee_name,'alreadyEnrolled',true);
    end if;
    raise exception 'RED_QR_CODE_USED';
  end if;
  if code_row.revoked_at is not null or code_row.expires_at::timestamptz<=now() or code_row.consumed_at is not null then raise exception 'RED_QR_CODE_INVALID'; end if;
  select * into trainee_row from public.trainees where id=code_row.trainee_id and batch_id=batch_row.id and enrollment_status='Active' for update;
  if not found then raise exception 'RED_QR_CODE_INVALID'; end if;
  if exists(select 1 from public.qr_attendance_enrollments where trainee_id=trainee_row.id and revoked_at is null) then raise exception 'RED_QR_ENROLLED'; end if;
  insert into public.qr_attendance_enrollments(id,trainee_id,batch_id,public_key,created_at) values(p_enrollment_id,trainee_row.id,batch_row.id,p_public_key,now_text);
  update public.qr_attendance_activation_codes set consumed_at=now_text,enrollment_id=p_enrollment_id where id=code_row.id and consumed_at is null and revoked_at is null;
  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,'QR participant','enroll-qr-device','qr_attendance_enrollments',p_enrollment_id,'A one-time activation code enrolled a browser key.',now_text);
  perform public.red_bump_revision();
  return jsonb_build_object('credentialId',p_enrollment_id,'traineeName',trainee_row.trainee_name,'alreadyEnrolled',false);
end;
$$;

create or replace function public.red_qr_public_challenge(p_batch_qr_id text,p_credential_id text,p_challenge_id text,p_challenge_hash text,p_challenge text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare link_row public.qr_attendance_batch_links%rowtype; session_row public.qr_attendance_sessions%rowtype; enrollment_row public.qr_attendance_enrollments%rowtype; batch_row public.batches%rowtype; now_text text:=public.red_now(); expires_value text:=(now()+interval '2 minutes')::text;
begin
  select * into link_row from public.qr_attendance_batch_links where batch_qr_id=p_batch_qr_id and active;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  select * into batch_row from public.batches where id=link_row.batch_id;
  if batch_row.status<>'Active' or batch_row.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
  select * into session_row from public.qr_attendance_sessions where batch_id=batch_row.id and closed_at is null and session_date=to_char(now() at time zone 'Africa/Cairo','YYYY-MM-DD') and expires_at::timestamptz>now() order by opened_at desc limit 1;
  if not found then raise exception 'RED_QR_NO_SESSION'; end if;
  select * into enrollment_row from public.qr_attendance_enrollments where id=p_credential_id and batch_id=batch_row.id and revoked_at is null;
  if not found or not exists(select 1 from public.trainees where id=enrollment_row.trainee_id and enrollment_status='Active') then raise exception 'RED_QR_ENROLLMENT'; end if;
  insert into public.qr_attendance_challenges(id,session_id,enrollment_id,challenge_hash,created_at,expires_at) values(p_challenge_id,session_row.id,enrollment_row.id,p_challenge_hash,now_text,expires_value);
  return jsonb_build_object('challengeId',p_challenge_id,'challenge',p_challenge,'currentSession',jsonb_build_object('date',session_row.session_date,'dayNumber',session_row.day_number,'expiresAt',session_row.expires_at),'traineeName',(select trainee_name from public.trainees where id=enrollment_row.trainee_id));
end;
$$;

create or replace function public.red_qr_public_checkin(p_batch_qr_id text,p_credential_id text,p_challenge_id text,p_challenge_hash text,p_signature_valid boolean,p_location_outcome text,p_accuracy_band text,p_distance_band text,p_arrival_time text,p_attendance_id text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare link_row public.qr_attendance_batch_links%rowtype; session_row public.qr_attendance_sessions%rowtype; enrollment_row public.qr_attendance_enrollments%rowtype; challenge_row public.qr_attendance_challenges%rowtype; batch_row public.batches%rowtype; existing_row public.daily_attendance%rowtype; review_id_value text; now_text text:=public.red_now();
begin
  if p_location_outcome not in ('inside','outside_geofence','boundary_uncertain','permission_denied','location_unavailable','location_timeout') or not p_signature_valid then raise exception 'RED_QR_PROOF_INVALID'; end if;
  select * into link_row from public.qr_attendance_batch_links where batch_qr_id=p_batch_qr_id and active;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  select * into batch_row from public.batches where id=link_row.batch_id;
  if batch_row.status<>'Active' or batch_row.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
  select * into session_row from public.qr_attendance_sessions where batch_id=batch_row.id and closed_at is null and session_date=to_char(now() at time zone 'Africa/Cairo','YYYY-MM-DD') and expires_at::timestamptz>now() order by opened_at desc limit 1 for update;
  if not found then raise exception 'RED_QR_NO_SESSION'; end if;
  select * into enrollment_row from public.qr_attendance_enrollments where id=p_credential_id and batch_id=batch_row.id and revoked_at is null for update;
  if not found or not exists(select 1 from public.trainees where id=enrollment_row.trainee_id and enrollment_status='Active') then raise exception 'RED_QR_ENROLLMENT'; end if;
  select * into challenge_row from public.qr_attendance_challenges where id=p_challenge_id and session_id=session_row.id and enrollment_id=enrollment_row.id for update;
  if not found or challenge_row.consumed_at is not null or challenge_row.expires_at::timestamptz<=now() then raise exception 'RED_QR_CHALLENGE_USED'; end if;
  if challenge_row.challenge_hash<>p_challenge_hash then raise exception 'RED_QR_PROOF_INVALID'; end if;
  update public.qr_attendance_challenges set consumed_at=now_text where id=challenge_row.id;
  update public.qr_attendance_enrollments set last_used_at=now_text where id=enrollment_row.id;
  select * into existing_row from public.daily_attendance where trainee_id=enrollment_row.trainee_id and batch_id=batch_row.id and date=session_row.session_date and source_id is null;
  if found then
    if existing_row.status='Present' and existing_row.source_meta->>'method'='qr' then
      perform public.red_bump_revision();
      return jsonb_build_object('attendance',jsonb_build_object('id',existing_row.id,'status',existing_row.status,'arrivalTime',existing_row.arrival_time),'alreadyCheckedIn',true);
    end if;
    perform public.red_bump_revision();
    return jsonb_build_object('conflict',true,'message','An attendance record already exists for today. Your existing attendance was left unchanged. Ask your trainer if it needs correction.');
  end if;
  if p_location_outcome='inside' then
    insert into public.daily_attendance(id,trainee_id,batch_id,date,arrival_time,departure_time,status,is_late,assessment_day,absence_reason,analytics_included,source_id,source_meta,version,created_at,updated_at)
    values(p_attendance_id,enrollment_row.trainee_id,batch_row.id,session_row.session_date,p_arrival_time,null,'Present',false,false,'',true,null,jsonb_build_object('method','qr','qr_session_id',session_row.id),1,p_arrival_time,p_arrival_time);
    perform public.red_bump_revision();
    return jsonb_build_object('attendance',jsonb_build_object('id',p_attendance_id,'status','Present','arrivalTime',p_arrival_time),'alreadyCheckedIn',false);
  end if;
  review_id_value:=extensions.gen_random_uuid()::text;
  insert into public.qr_attendance_location_reviews(id,session_id,batch_id,trainee_id,reason,accuracy_band,distance_band,created_at,updated_at)
  values(review_id_value,session_row.id,batch_row.id,enrollment_row.trainee_id,p_location_outcome,p_accuracy_band,p_distance_band,now_text,now_text)
  on conflict (session_id,trainee_id) where status='open'
  do update set reason=excluded.reason,accuracy_band=excluded.accuracy_band,distance_band=excluded.distance_band,attempt_count=public.qr_attendance_location_reviews.attempt_count+1,updated_at=excluded.updated_at
  returning id into review_id_value;
  perform public.red_bump_revision();
  return jsonb_build_object('attendance',null,'reviewRequired',true,'reason',p_location_outcome,'message','Your location could not confirm that you are near the training venue. The attempt is flagged for staff review. If you are on-site, please contact reception.');
end;
$$;

create or replace function public.red_qr_manage(p_action text, p_payload jsonb, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  now_text text := public.red_now();
  batch_row public.batches%rowtype;
  venue_row public.qr_attendance_venues%rowtype;
  session_row public.qr_attendance_sessions%rowtype;
  link_row public.qr_attendance_batch_links%rowtype;
  trainee_row public.trainees%rowtype;
  code_row public.qr_attendance_activation_codes%rowtype;
  review_row public.qr_attendance_location_reviews%rowtype;
  new_id text := extensions.gen_random_uuid()::text;
  batch_id_value text := p_payload->>'batchId';
  session_date_value text := p_payload->>'date';
  venue_id_value text;
  day_value integer;
  qr_value text;
  expires_value text;
begin
  if p_action is null or p_action not in ('ensure_link','rotate_link','issue_code','upsert_venue','open_session','close_session','resolve_review') or p_actor is null or length(p_actor)>254 then
    raise exception 'RED_QR_INVALID';
  end if;
  if p_action in ('ensure_link','rotate_link') then
    select * into batch_row from public.batches where id=batch_id_value for update;
    if not found or batch_row.archived_at is not null then raise exception 'RED_NOT_FOUND'; end if;
    if p_action='ensure_link' then
      select * into link_row from public.qr_attendance_batch_links where batch_id=batch_id_value and active;
      if found then return jsonb_build_object('batchQrId',link_row.batch_qr_id,'created',false); end if;
      qr_value := rtrim(translate(encode(extensions.gen_random_bytes(24),'base64'),'+/','-_'),'=');
      insert into public.qr_attendance_batch_links(id,batch_id,batch_qr_id,active,created_by,created_at)
      values (new_id,batch_id_value,qr_value,true,p_actor,now_text);
      insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'create-batch-qr','qr_attendance_batch_links',new_id,'Created the stable batch QR attendance reference.',now_text);
      perform public.red_bump_revision();
      return jsonb_build_object('batchQrId',qr_value,'created',true);
    end if;
    select * into link_row from public.qr_attendance_batch_links where batch_id=batch_id_value and active for update;
    if found then update public.qr_attendance_batch_links set active=false,revoked_at=now_text where id=link_row.id; end if;
    qr_value := rtrim(translate(encode(extensions.gen_random_bytes(24),'base64'),'+/','-_'),'=');
    insert into public.qr_attendance_batch_links(id,batch_id,batch_qr_id,active,created_by,created_at,rotated_from)
    values (new_id,batch_id_value,qr_value,true,p_actor,now_text,link_row.id);
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'rotate-batch-qr','qr_attendance_batch_links',new_id,'Rotated the batch QR reference; the previous print was revoked.',now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('batchQrId',qr_value,'created',true);
  end if;

  if p_action='issue_code' then
    select t.* into trainee_row from public.trainees t join public.batches b on b.id=t.batch_id
      where t.id=p_payload->>'traineeId' and t.enrollment_status='Active' and b.status='Active' and b.archived_at is null;
    if not found then raise exception 'RED_NOT_FOUND'; end if;
    select * into code_row from public.qr_attendance_activation_codes where trainee_id=trainee_row.id and consumed_at is null and revoked_at is null for update;
    if found and p_payload->>'action'='issue' then raise exception 'RED_QR_CODE_EXISTS'; end if;
    if p_payload->>'action'='issue' and exists(select 1 from public.qr_attendance_enrollments where trainee_id=trainee_row.id and revoked_at is null) then raise exception 'RED_QR_ENROLLED'; end if;
    if p_payload->>'action'='reissue' then
      update public.qr_attendance_activation_codes set revoked_at=now_text where trainee_id=trainee_row.id and consumed_at is null and revoked_at is null;
      update public.qr_attendance_enrollments set revoked_at=now_text,revoked_by=p_actor where trainee_id=trainee_row.id and revoked_at is null;
    elsif p_payload->>'action'<>'issue' then raise exception 'RED_QR_INVALID'; end if;
    insert into public.qr_attendance_activation_codes(id,trainee_id,batch_id,code_hash,issued_by,issued_at,expires_at)
    values(new_id,trainee_row.id,trainee_row.batch_id,p_payload->>'codeHash',p_actor,now_text,(now()+interval '30 days')::text);
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,case when p_payload->>'action'='reissue' then 'reissue-qr-activation-code' else 'issue-qr-activation-code' end,'trainees',trainee_row.id,'Issued a one-time QR activation code; plaintext is not retained.',now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('expiresAt',(now()+interval '30 days')::text);
  end if;

  if p_action='upsert_venue' then
    venue_id_value := coalesce(nullif(p_payload->>'id',''),extensions.gen_random_uuid()::text);
    if length(p_payload->>'name') not between 2 and 100 or (p_payload->>'latitude')::double precision not between -90 and 90 or
       (p_payload->>'longitude')::double precision not between -180 and 180 or (p_payload->>'radius_m')::integer not between 50 and 2000 then
      raise exception 'RED_QR_INVALID';
    end if;
    update public.qr_attendance_venues set name=p_payload->>'name',latitude=(p_payload->>'latitude')::double precision,
      longitude=(p_payload->>'longitude')::double precision,radius_m=(p_payload->>'radius_m')::integer,
      active=(p_payload->>'active')::boolean,updated_at=now_text where id=venue_id_value returning * into venue_row;
    if not found then
      if p_payload ? 'id' then raise exception 'RED_NOT_FOUND'; end if;
      insert into public.qr_attendance_venues(id,name,latitude,longitude,radius_m,active,is_default,created_by,created_at,updated_at)
      values(venue_id_value,p_payload->>'name',(p_payload->>'latitude')::double precision,(p_payload->>'longitude')::double precision,(p_payload->>'radius_m')::integer,(p_payload->>'active')::boolean,false,p_actor,now_text,now_text)
      returning * into venue_row;
    end if;
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'configure-qr-venue','qr_attendance_venues',venue_id_value,'Updated a private QR attendance venue.',now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('venue',jsonb_build_object('id',venue_row.id,'name',venue_row.name,'latitude',venue_row.latitude,'longitude',venue_row.longitude,'radius_m',venue_row.radius_m,'active',venue_row.active,'is_default',venue_row.is_default,'updated_at',venue_row.updated_at));
  end if;

  if p_action='open_session' then
    select * into batch_row from public.batches where id=batch_id_value;
    if not found or batch_row.status<>'Active' or batch_row.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
    if session_date_value is null or session_date_value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'RED_QR_INVALID'; end if;
    if to_char(session_date_value::date,'YYYY-MM-DD')<>session_date_value then raise exception 'RED_QR_INVALID'; end if;
    if session_date_value<>to_char(now() at time zone 'Africa/Cairo','YYYY-MM-DD') then
      if session_date_value>to_char(now() at time zone 'Africa/Cairo','YYYY-MM-DD') then raise exception 'RED_QR_FUTURE'; else raise exception 'RED_QR_PAST'; end if;
    end if;
    select row_number() over(order by scheduled.date)::integer into day_value
      from (select jsonb_array_elements_text(batch_row.session_dates) as date) scheduled where scheduled.date=session_date_value;
    if day_value is null then raise exception 'RED_QR_UNSCHEDULED'; end if;
    venue_id_value:=coalesce(p_payload->>'venueId','academy-default');
    select * into venue_row from public.qr_attendance_venues where id=venue_id_value and active;
    if not found then raise exception 'RED_QR_VENUE'; end if;
    expires_value := to_char(timezone('utc', (date_trunc('day', now() at time zone 'Africa/Cairo') + interval '1 day') at time zone 'Africa/Cairo'),'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    update public.qr_attendance_sessions set closed_at=expires_at,version=version+1 where batch_id=batch_id_value and closed_at is null and expires_at::timestamptz<=now();
    insert into public.qr_attendance_sessions(id,batch_id,venue_id,session_date,day_number,venue_name,venue_latitude,venue_longitude,radius_m,created_by,opened_at,expires_at)
      values(new_id,batch_id_value,venue_id_value,session_date_value,day_value,venue_row.name,venue_row.latitude,venue_row.longitude,venue_row.radius_m,p_actor,now_text,expires_value);
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'open-qr-attendance-session','qr_attendance_sessions',new_id,'Opened QR attendance for a scheduled session date.',now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('id',new_id,'dayNumber',day_value,'date',session_date_value,'expiresAt',expires_value,'venueName',venue_row.name);
  end if;

  if p_action='close_session' then
    update public.qr_attendance_sessions set closed_at=now_text,version=version+1 where id=p_payload->>'id' and closed_at is null returning * into session_row;
    if not found then raise exception 'RED_QR_SESSION'; end if;
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'close-qr-attendance-session','qr_attendance_sessions',session_row.id,'Closed a QR attendance session.',now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('ok',true,'closedAt',now_text);
  end if;

  select * into review_row from public.qr_attendance_location_reviews where id=p_payload->>'reviewId' for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if review_row.status<>'open' then raise exception 'RED_QR_REVIEW_RESOLVED'; end if;
  if p_payload->>'outcome'='manual_attendance_recorded' and not exists (
    select 1 from public.daily_attendance a
    join public.qr_attendance_sessions s on s.id=review_row.session_id
    where a.trainee_id=review_row.trainee_id and a.batch_id=review_row.batch_id
      and a.date=s.session_date and a.source_id is null
  ) then raise exception 'RED_QR_MANUAL_MISSING'; end if;
  update public.qr_attendance_location_reviews set status='resolved',resolution=p_payload->>'outcome',resolved_by=p_actor,resolved_at=now_text,updated_at=now_text where id=review_row.id;
  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at) values (extensions.gen_random_uuid()::text,p_actor,'resolve-qr-location-review','qr_attendance_location_reviews',review_row.id,p_payload->>'outcome',now_text);
  perform public.red_bump_revision();
  return jsonb_build_object('ok',true,'status','resolved','resolution',p_payload->>'outcome','resolvedAt',now_text);
end;
$$;

revoke all on function public.red_qr_manage(text,jsonb,text) from public,anon,authenticated;
revoke all on function public.red_qr_public_enroll(text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.red_qr_public_challenge(text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.red_qr_public_checkin(text,text,text,text,boolean,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.red_qr_manage(text,jsonb,text) to service_role;
grant execute on function public.red_qr_public_enroll(text,text,jsonb,text) to service_role;
grant execute on function public.red_qr_public_challenge(text,text,text,text,text) to service_role;
grant execute on function public.red_qr_public_checkin(text,text,text,text,boolean,text,text,text,text,text) to service_role;

create or replace function public.red_qr_cleanup()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare removed integer:=0;
begin
  delete from public.qr_attendance_challenges where expires_at::timestamptz < now() - interval '1 day'; get diagnostics removed = row_count;
  delete from public.qr_attendance_activation_codes where expires_at::timestamptz < now() - interval '30 days';
  delete from public.qr_attendance_location_reviews where status='resolved' and resolved_at::timestamptz < now() - interval '90 days';
  return removed;
end;
$$;
revoke all on function public.red_qr_cleanup() from public,anon,authenticated;
grant execute on function public.red_qr_cleanup() to service_role;

commit;
