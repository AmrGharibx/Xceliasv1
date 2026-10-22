begin;

-- Private via RLS and grants, like the existing QR tables. No browser policies.
create table public.qr_attendance_device_link_requests (
  id text primary key,
  handle_hash text not null unique check (handle_hash ~ '^[0-9a-f]{64}$'),
  batch_id text not null references public.batches(id) on delete cascade,
  session_id text not null references public.qr_attendance_sessions(id) on delete cascade,
  candidate_trainee_id text references public.trainees(id) on delete set null,
  public_key jsonb not null check (jsonb_typeof(public_key)='object'),
  locator_kind text not null check (locator_kind in ('phone','code')),
  code_id text references public.qr_attendance_activation_codes(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  enrollment_id text references public.qr_attendance_enrollments(id) on delete set null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  resolved_at timestamptz,
  resolved_by text,
  resolution text check (resolution in ('approve','approve_replace','reject')),
  check (expires_at>created_at and expires_at<=created_at+interval '30 minutes')
);
create index ix_qr_device_link_pending_batch on public.qr_attendance_device_link_requests(batch_id,status,created_at desc);
create index ix_qr_device_link_expiry on public.qr_attendance_device_link_requests(expires_at,status);
create unique index ux_qr_device_link_pending_key on public.qr_attendance_device_link_requests(public_key) where status='pending';
-- The deployed unique active trainee/public-key enrollment indexes remain intact.
alter table public.qr_attendance_device_link_requests enable row level security;
revoke all on table public.qr_attendance_device_link_requests from public, anon, authenticated;
grant all on table public.qr_attendance_device_link_requests to service_role;

-- Same Egyptian mobile normalization as normalizeQrPhone; never retain input.
create function public.qr_normalize_phone(p_value text)
returns text language plpgsql immutable security definer set search_path = '' as $$
declare v_digits text;
begin
  if p_value is null or length(p_value)>40 or p_value !~ '^[+0-9[:space:]().-]+$' then return null; end if;
  v_digits:=regexp_replace(p_value,'[^0-9]','','g');
  if left(v_digits,4)='0020' then v_digits:='0'||substr(v_digits,5);
  elsif left(v_digits,2)='20' then v_digits:='0'||substr(v_digits,3); end if;
  if v_digits ~ '^01[0125][0-9]{8}$' then return v_digits; end if;
  return null;
end;
$$;

-- Edge validates locator/key shapes and rate limits before invoking this RPC.
-- Code input is SHA-256 of the normalized code, never plaintext.
create function public.qr_create_device_link_request(p_batch_qr_id text,p_public_key jsonb,p_phone text default null,p_code_hash text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_batch public.batches%rowtype;
  v_session public.qr_attendance_sessions%rowtype;
  v_key jsonb;
  v_phone text;
  v_candidate text;
  v_code_id text;
  v_handle text;
  v_now timestamptz;
begin
  if p_batch_qr_id is null or p_batch_qr_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or (p_phone is null)=(p_code_hash is null)
    or p_public_key is null or jsonb_typeof(p_public_key)<>'object'
    or p_public_key->>'kty' is distinct from 'EC' or p_public_key->>'crv' is distinct from 'P-256'
    or jsonb_typeof(p_public_key->'x') is distinct from 'string'
    or jsonb_typeof(p_public_key->'y') is distinct from 'string'
    or coalesce(p_public_key->>'x','') !~ '^[A-Za-z0-9_-]{43}$'
    or coalesce(p_public_key->>'y','') !~ '^[A-Za-z0-9_-]{43}$' or p_public_key ? 'd'
    or (p_code_hash is not null and p_code_hash !~ '^[0-9a-f]{64}$') then raise exception 'RED_QR_INVALID'; end if;
  v_phone:=public.qr_normalize_phone(p_phone);
  if p_phone is not null and v_phone is null then raise exception 'RED_QR_INVALID'; end if;
  v_key:=jsonb_build_object('kty','EC','crv','P-256','x',p_public_key->>'x','y',p_public_key->>'y','ext',true,'key_ops',jsonb_build_array('verify'));

  -- One lock order for all new mutations, including cross-batch key contention.
  -- Existing enrollment unique indexes are the final guard against legacy writers.
  perform pg_advisory_xact_lock(72831,2);
  select b.* into v_batch from public.batches b join public.qr_attendance_batch_links l on l.batch_id=b.id
    where l.batch_qr_id=p_batch_qr_id and l.active for update of b,l;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if v_batch.status<>'Active' or v_batch.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
  select * into v_session from public.qr_attendance_sessions where batch_id=v_batch.id and closed_at is null
    and session_date=to_char(clock_timestamp() at time zone 'Africa/Cairo','YYYY-MM-DD')
    and expires_at::timestamptz>clock_timestamp() for update;
  if not found then raise exception 'RED_QR_NO_SESSION'; end if;
  v_now:=clock_timestamp();
  if v_session.expires_at::timestamptz<=v_now then raise exception 'RED_QR_NO_SESSION'; end if;

  -- Expire only pending requests. Closed/shortened sessions free their pending key.
  update public.qr_attendance_device_link_requests r set status='expired'
    where r.status='pending' and (r.expires_at<=v_now or exists (
      select 1 from public.qr_attendance_sessions s where s.id=r.session_id
        and (s.closed_at is not null or s.expires_at::timestamptz<=v_now)));
  if exists(select 1 from public.qr_attendance_enrollments where public_key=v_key and revoked_at is null)
    then raise exception 'RED_QR_ENROLLED'; end if;
  if exists(select 1 from public.qr_attendance_device_link_requests where public_key=v_key and status='pending')
    then raise exception 'RED_QR_LINK_PENDING'; end if;
  if p_phone is not null then
    select case when count(*)=1 then min(t.id) end into v_candidate from public.trainees t
      where t.batch_id=v_batch.id and enrollment_status='Active' and public.qr_normalize_phone(t.phone)=v_phone;
  else
    select id,trainee_id into v_code_id,v_candidate from public.qr_attendance_activation_codes
      where code_hash=p_code_hash and batch_id=v_batch.id
        and consumed_at is null and revoked_at is null and expires_at::timestamptz>v_now;
  end if;
  v_handle:=rtrim(translate(encode(extensions.gen_random_bytes(32),'base64'),'+/','-_'),'=');
  insert into public.qr_attendance_device_link_requests(id,handle_hash,batch_id,session_id,candidate_trainee_id,public_key,locator_kind,code_id,created_at,expires_at)
    values(extensions.gen_random_uuid()::text,encode(extensions.digest(v_handle,'sha256'),'hex'),v_batch.id,v_session.id,v_candidate,v_key,
      case when p_phone is not null then 'phone' else 'code' end,v_code_id,v_now,least(v_now+interval '30 minutes',v_session.expires_at::timestamptz));
  return jsonb_build_object('requestHandle',v_handle,'status','pending');
end;
$$;

-- Two-step status protocol (service_role only): Edge hashes the handle, fetches
-- ONLY this public key, verifies the P-256/P1363 signature over UTF-8
-- xcelias-qr-link-status:v1\n${batchQrId}\n${requestHandle}, THEN calls status.
-- Never call the identity-bearing status RPC before successful Edge verification.
create function public.qr_device_link_request_proof_key(p_batch_qr_id text,p_handle_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_key jsonb;
begin
  select r.public_key into v_key from public.qr_attendance_device_link_requests r
    join public.qr_attendance_batch_links l on l.batch_qr_id=p_batch_qr_id and l.active
    where r.handle_hash=p_handle_hash and r.batch_id=l.batch_id;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  return jsonb_build_object('publicKey',v_key);
end;
$$;

-- Trusted caller MUST complete the above proof step first. SQL does not verify
-- ECDSA and does not accept a browser-supplied boolean as identity proof.
create function public.qr_device_link_request_status(p_batch_qr_id text,p_handle_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_request public.qr_attendance_device_link_requests%rowtype;
  v_session public.qr_attendance_sessions%rowtype;
  v_identity jsonb;
  v_now timestamptz:=clock_timestamp();
begin
  select r.* into v_request from public.qr_attendance_device_link_requests r
    join public.qr_attendance_batch_links l on l.batch_qr_id=p_batch_qr_id and l.active
    where r.handle_hash=p_handle_hash and r.batch_id=l.batch_id;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if v_request.status='rejected' then return jsonb_build_object('status','rejected'); end if;
  select * into v_session from public.qr_attendance_sessions where id=v_request.session_id;
  if not found or v_request.status='expired' or v_request.expires_at<=v_now
    or v_session.closed_at is not null or v_session.expires_at::timestamptz<=v_now
    then return jsonb_build_object('status','expired'); end if;
  if v_request.status='approved' then
    select jsonb_build_object('status','approved','credentialId',e.id,'traineeName',t.trainee_name) into v_identity
      from public.qr_attendance_enrollments e join public.trainees t on t.id=e.trainee_id
      where e.id=v_request.enrollment_id and e.batch_id=v_request.batch_id and e.revoked_at is null;
    return coalesce(v_identity,jsonb_build_object('status','expired'));
  end if;
  return jsonb_build_object('status','pending');
end;
$$;

-- Edge requires an authenticated writable staff session before list/resolve/issue.
create function public.qr_device_link_requests(p_batch_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_items jsonb; v_now timestamptz:=clock_timestamp();
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'candidateTraineeId',r.candidate_trainee_id,'candidateTraineeName',t.trainee_name,
    'publicKey',r.public_key,'status','pending','createdAt',to_char(r.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt',to_char(r.expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'hasActiveDevice',exists(select 1 from public.qr_attendance_enrollments e where e.trainee_id=r.candidate_trainee_id and e.revoked_at is null),
    'usedRecoveryCode',r.code_id is not null) order by r.created_at desc,r.id desc),'[]'::jsonb) into v_items
    from public.qr_attendance_device_link_requests r join public.qr_attendance_sessions s on s.id=r.session_id
    left join public.trainees t on t.id=r.candidate_trainee_id
    where r.batch_id=p_batch_id and r.status='pending' and r.expires_at>v_now and s.closed_at is null and s.expires_at::timestamptz>v_now;
  return jsonb_build_object('items',v_items);
end;
$$;

create function public.qr_resolve_device_link_request(p_request_id text,p_action text,p_actor text,p_trainee_id text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_request public.qr_attendance_device_link_requests%rowtype;
  v_session public.qr_attendance_sessions%rowtype;
  v_batch public.batches%rowtype;
  v_trainee public.trainees%rowtype;
  v_code public.qr_attendance_activation_codes%rowtype;
  v_existing text;
  v_enrollment_id text:=extensions.gen_random_uuid()::text;
  v_now timestamptz;
  v_now_text text;
begin
  if p_action is null or p_action not in ('approve','approve_replace','reject') or p_actor is null
    or length(btrim(p_actor)) not between 1 and 254 then raise exception 'RED_QR_INVALID'; end if;
  perform pg_advisory_xact_lock(72831,2);
  select * into v_request from public.qr_attendance_device_link_requests where id=p_request_id for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if v_request.status<>'pending' then raise exception 'RED_QR_LINK_RESOLVED'; end if;
  select * into v_batch from public.batches where id=v_request.batch_id for update;
  select * into v_session from public.qr_attendance_sessions where id=v_request.session_id for update;
  v_now:=clock_timestamp();
  v_now_text:=to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  if not found or v_request.expires_at<=v_now or v_session.closed_at is not null
    or v_session.expires_at::timestamptz<=v_now or v_session.session_date<>to_char(v_now at time zone 'Africa/Cairo','YYYY-MM-DD')
    then raise exception 'RED_QR_LINK_EXPIRED'; end if;
  if p_action='reject' then
    update public.qr_attendance_device_link_requests set status='rejected',resolution=p_action,resolved_at=v_now,resolved_by=p_actor where id=v_request.id;
    insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
      values(extensions.gen_random_uuid()::text,p_actor,'reject-qr-device-link','qr_attendance_device_link_requests',v_request.id,'Rejected a pending QR device link request.',v_now_text);
    perform public.red_bump_revision();
    return jsonb_build_object('ok',true,'status','rejected');
  end if;
  if v_batch.status is distinct from 'Active' or v_batch.archived_at is not null then raise exception 'RED_QR_BATCH'; end if;
  select * into v_trainee from public.trainees where id=coalesce(nullif(p_trainee_id,''),v_request.candidate_trainee_id)
    and batch_id=v_request.batch_id and enrollment_status='Active' for update;
  if not found then raise exception 'RED_QR_TRAINEE'; end if;
  if v_request.locator_kind='code' and v_request.code_id is null then raise exception 'RED_QR_CODE_INVALID'; end if;
  if v_request.code_id is not null then
    select * into v_code from public.qr_attendance_activation_codes where id=v_request.code_id for update;
    if not found or v_code.trainee_id<>v_trainee.id or v_code.batch_id<>v_request.batch_id
      or v_code.consumed_at is not null or v_code.revoked_at is not null or v_code.expires_at::timestamptz<=v_now
      then raise exception 'RED_QR_CODE_INVALID'; end if;
  end if;
  if exists(select 1 from public.qr_attendance_enrollments where public_key=v_request.public_key and revoked_at is null)
    then raise exception 'RED_QR_ENROLLED'; end if;
  select id into v_existing from public.qr_attendance_enrollments where trainee_id=v_trainee.id and revoked_at is null for update;
  if v_existing is not null and p_action<>'approve_replace' then raise exception 'RED_QR_REPLACE_REQUIRED'; end if;
  if v_existing is null and p_action='approve_replace' then raise exception 'RED_QR_REPLACE_MISSING'; end if;
  -- Locks on a trainee, code, or old enrollment may have waited across a deadline.
  v_now:=clock_timestamp();
  v_now_text:=to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  if v_request.expires_at<=v_now or v_session.expires_at::timestamptz<=v_now
    or v_session.session_date<>to_char(v_now at time zone 'Africa/Cairo','YYYY-MM-DD') then raise exception 'RED_QR_LINK_EXPIRED'; end if;
  if v_request.code_id is not null and v_code.expires_at::timestamptz<=v_now then raise exception 'RED_QR_CODE_INVALID'; end if;
  if v_existing is not null then
    update public.qr_attendance_enrollments set revoked_at=v_now_text,revoked_by=p_actor where id=v_existing and revoked_at is null;
  end if;
  insert into public.qr_attendance_enrollments(id,trainee_id,batch_id,public_key,created_at)
    values(v_enrollment_id,v_trainee.id,v_request.batch_id,v_request.public_key,v_now_text);
  if v_request.code_id is not null then
    update public.qr_attendance_activation_codes set consumed_at=v_now_text,enrollment_id=v_enrollment_id
      where id=v_request.code_id and consumed_at is null and revoked_at is null and expires_at::timestamptz>clock_timestamp();
    if not found then raise exception 'RED_QR_CODE_INVALID'; end if;
  end if;
  update public.qr_attendance_device_link_requests set status='approved',enrollment_id=v_enrollment_id,candidate_trainee_id=v_trainee.id,
    resolution=p_action,resolved_at=v_now,resolved_by=p_actor where id=v_request.id and status='pending'
      and expires_at>clock_timestamp() and v_session.expires_at::timestamptz>clock_timestamp();
  if not found then raise exception 'RED_QR_LINK_EXPIRED'; end if;
  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
    values(extensions.gen_random_uuid()::text,p_actor,case when p_action='approve_replace' then 'replace-qr-device-link' else 'approve-qr-device-link' end,
      'qr_attendance_device_link_requests',v_request.id,'Approved a QR browser identity for a trainee.',v_now_text);
  perform public.red_bump_revision();
  return jsonb_build_object('ok',true,'status','approved');
end;
$$;

-- Edge generates/returns the plaintext code once and sends only its hash here.
-- Reissue replaces unused codes only; enrollment changes belong to resolve.
create function public.qr_issue_device_recovery_code(p_trainee_id text,p_action text,p_code_hash text,p_actor text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_trainee public.trainees%rowtype;
  v_batch public.batches%rowtype;
  v_batch_id text;
  v_code_id text:=extensions.gen_random_uuid()::text;
  v_expiry timestamptz;
  v_expires_at text;
  v_now timestamptz;
  v_now_text text;
begin
  if p_action is null or p_action not in ('issue','reissue') or p_actor is null or length(btrim(p_actor)) not between 1 and 254
    or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then raise exception 'RED_QR_INVALID'; end if;
  perform pg_advisory_xact_lock(72831,2);
  select batch_id into v_batch_id from public.trainees where id=p_trainee_id;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  select * into v_batch from public.batches where id=v_batch_id for update;
  if not found or v_batch.status<>'Active' or v_batch.archived_at is not null then raise exception 'RED_NOT_FOUND'; end if;
  select * into v_trainee from public.trainees where id=p_trainee_id and batch_id=v_batch.id and enrollment_status='Active' for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  v_now:=clock_timestamp();
  v_now_text:=to_char(v_now at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_expiry:=public.red_qr_batch_access_expires_at(v_trainee.batch_id);
  if v_expiry is null or v_expiry<=v_now then raise exception 'RED_QR_BATCH_EXPIRED'; end if;
  if p_action='issue' and exists(select 1 from public.qr_attendance_activation_codes where trainee_id=v_trainee.id and consumed_at is null and revoked_at is null)
    then raise exception 'RED_QR_CODE_EXISTS'; end if;
  if p_action='reissue' then
    update public.qr_attendance_activation_codes set revoked_at=v_now_text where trainee_id=v_trainee.id and consumed_at is null and revoked_at is null;
  end if;
  insert into public.qr_attendance_activation_codes(id,trainee_id,batch_id,code_hash,issued_by,issued_at,expires_at)
    values(v_code_id,v_trainee.id,v_trainee.batch_id,p_code_hash,p_actor,v_now_text,to_char(v_expiry at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    returning expires_at into v_expires_at;
  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
    values(extensions.gen_random_uuid()::text,p_actor,case when p_action='reissue' then 'reissue-qr-activation-code' else 'issue-qr-activation-code' end,
      'trainees',v_trainee.id,'Issued a one-time QR identity activation code. The code is not stored in plaintext.',v_now_text);
  perform public.red_bump_revision();
  return jsonb_build_object('expiresAt',v_expires_at);
end;
$$;

revoke all on function public.qr_normalize_phone(text) from public, anon, authenticated;
revoke all on function public.qr_create_device_link_request(text,jsonb,text,text) from public, anon, authenticated;
revoke all on function public.qr_device_link_request_proof_key(text,text) from public, anon, authenticated;
revoke all on function public.qr_device_link_request_status(text,text) from public, anon, authenticated;
revoke all on function public.qr_device_link_requests(text) from public, anon, authenticated;
revoke all on function public.qr_resolve_device_link_request(text,text,text,text) from public, anon, authenticated;
revoke all on function public.qr_issue_device_recovery_code(text,text,text,text) from public, anon, authenticated;
grant execute on function public.qr_normalize_phone(text) to service_role;
grant execute on function public.qr_create_device_link_request(text,jsonb,text,text) to service_role;
grant execute on function public.qr_device_link_request_proof_key(text,text) to service_role;
grant execute on function public.qr_device_link_request_status(text,text) to service_role;
grant execute on function public.qr_device_link_requests(text) to service_role;
grant execute on function public.qr_resolve_device_link_request(text,text,text,text) to service_role;
grant execute on function public.qr_issue_device_recovery_code(text,text,text,text) to service_role;

commit;
