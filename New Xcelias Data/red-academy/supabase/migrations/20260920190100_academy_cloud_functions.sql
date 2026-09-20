begin;

create or replace function public.red_bump_revision()
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare next_revision bigint;
begin
  update public.workspace_state
  set revision = revision + 1, updated_at = public.red_now()
  where singleton = true
  returning revision into next_revision;
  update public.academy_live_signal set revision = next_revision where singleton = true;
  return next_revision;
end;
$$;

create or replace function public.red_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare now_ms bigint := public.red_now_ms(); current_row public.rate_limits%rowtype;
begin
  if p_key is null or length(p_key) > 300 or p_limit < 1 or p_seconds < 1 then
    raise exception 'RED_INVALID_RATE_LIMIT';
  end if;
  insert into public.rate_limits(key, window_start, count) values (p_key, now_ms, 0) on conflict (key) do nothing;
  select * into current_row from public.rate_limits where key = p_key for update;
  if now_ms - current_row.window_start > p_seconds * 1000 then
    update public.rate_limits set window_start = now_ms, count = 1 where key = p_key;
    return true;
  end if;
  if current_row.count >= p_limit then return false; end if;
  update public.rate_limits set count = count + 1 where key = p_key;
  return true;
end;
$$;

create or replace function public.red_workspace_revision()
returns bigint language sql security definer set search_path = public, pg_temp
as $$ select revision from public.workspace_state where singleton = true $$;

create or replace function public.red_session_status(p_token_hash text)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'user', (
      select jsonb_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name, 'role', u.role, 'active', u.active)
      from public.sessions s join public.users u on u.id = s.user_id
      where s.token_hash = p_token_hash and s.expires_at > public.red_now_ms() and u.active = true
      limit 1
    ),
    'revision', (select revision from public.workspace_state where singleton = true)
  )
$$;

create or replace function public.red_workspace_state(p_is_admin boolean)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'companies', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at, r.id) from public.companies r), '[]'::jsonb),
    'batches', coalesce((select jsonb_agg(to_jsonb(r) order by r.batch_name, r.id) from public.batches r), '[]'::jsonb),
    'trainees', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at, r.id) from public.trainees r), '[]'::jsonb),
    'daily_attendance', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at, r.id) from public.daily_attendance r), '[]'::jsonb),
    'attendance_10day', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at, r.id) from public.attendance_10day r), '[]'::jsonb),
    'assessments', coalesce((select jsonb_agg(to_jsonb(r) order by r.analytics_included desc, r.created_at, r.id) from public.assessments r), '[]'::jsonb),
    'import_runs', coalesce((select jsonb_agg(to_jsonb(r) order by r.imported_at desc) from public.import_runs r), '[]'::jsonb),
    'import_reviews', coalesce((select jsonb_agg(to_jsonb(r) order by r.code, r.id) from public.import_reviews r), '[]'::jsonb),
    'assessment_history', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (select * from public.assessment_history order by created_at desc limit 200) r), '[]'::jsonb),
    'audit_log', case when p_is_admin then coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (select * from public.audit_log order by created_at desc limit 100) r), '[]'::jsonb) else '[]'::jsonb end
  )
$$;

create or replace function public.red_commit(p_operations jsonb, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  operation jsonb;
  target_table text;
  target_action text;
  target_id text;
  expected_version integer;
  old_row jsonb;
  row_data jsonb;
  saved_row jsonb;
  columns_sql text;
  selected_columns_sql text;
  assignments_sql text;
  snapshot_row record;
  records jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_operations) <> 'array' or jsonb_array_length(p_operations) < 1 or jsonb_array_length(p_operations) > 200 then
    raise exception 'RED_INVALID_OPERATION';
  end if;

  for operation in select value from jsonb_array_elements(p_operations) loop
    target_table := operation ->> 'table';
    target_action := operation ->> 'action';
    target_id := operation ->> 'id';
    expected_version := nullif(operation ->> 'expectedVersion', '')::integer;
    if target_table is null or target_table <> all (array['companies', 'batches', 'trainees', 'daily_attendance', 'attendance_10day', 'assessments'])
      or target_action is null or target_action <> all (array['create', 'update', 'delete'])
      or target_id is null then
      raise exception 'RED_INVALID_OPERATION';
    end if;

    old_row := null;
    if target_action <> 'create' then
      execute format('select to_jsonb(t) from public.%I t where t.id = $1 for update', target_table)
      into old_row using target_id;
      if old_row is null then raise exception 'RED_NOT_FOUND'; end if;
      if expected_version is null or coalesce((old_row ->> 'version')::integer, -1) <> expected_version then
        raise exception 'RED_CONFLICT';
      end if;
    end if;

    if target_action = 'delete' then
      if target_table = 'assessments' then
        insert into public.assessment_history(id, assessment_id, trainee_id, actor, snapshot, created_at)
        values (extensions.gen_random_uuid()::text, old_row ->> 'id', old_row ->> 'trainee_id', p_actor, old_row, public.red_now());
      elsif target_table = 'trainees' then
        for snapshot_row in select to_jsonb(a) as snapshot from public.assessments a where a.trainee_id = target_id loop
          insert into public.assessment_history(id, assessment_id, trainee_id, actor, snapshot, created_at)
          values (extensions.gen_random_uuid()::text, snapshot_row.snapshot ->> 'id', snapshot_row.snapshot ->> 'trainee_id', p_actor, snapshot_row.snapshot, public.red_now());
        end loop;
      elsif target_table = 'batches' then
        for snapshot_row in select to_jsonb(a) as snapshot from public.assessments a where a.batch_id = target_id loop
          insert into public.assessment_history(id, assessment_id, trainee_id, actor, snapshot, created_at)
          values (extensions.gen_random_uuid()::text, snapshot_row.snapshot ->> 'id', snapshot_row.snapshot ->> 'trainee_id', p_actor, snapshot_row.snapshot, public.red_now());
        end loop;
      end if;
      execute format('delete from public.%I where id = $1', target_table) using target_id;
      records := records || jsonb_build_array(jsonb_build_object('id', target_id));
    else
      row_data := operation -> 'data';
      if jsonb_typeof(row_data) <> 'object' then raise exception 'RED_INVALID_OPERATION'; end if;
      row_data := coalesce(old_row, '{}'::jsonb) || row_data || jsonb_build_object(
        'id', target_id,
        'version', coalesce((old_row ->> 'version')::integer, 0) + 1,
        'created_at', coalesce(old_row ->> 'created_at', public.red_now()),
        'updated_at', public.red_now()
      );

      select
        string_agg(format('%I', column_name), ',' order by ordinal_position),
        string_agg(format('r.%I', column_name), ',' order by ordinal_position),
        string_agg(format('%I = excluded.%I', column_name, column_name), ',' order by ordinal_position)
      into columns_sql, selected_columns_sql, assignments_sql
      from information_schema.columns
      where table_schema = 'public' and table_name = target_table and column_name <> 'id';
      if columns_sql is null or selected_columns_sql is null or assignments_sql is null then raise exception 'RED_INVALID_OPERATION'; end if;

      execute format(
        'insert into public.%I (id,%s) select r.id,%s from jsonb_populate_record(null::public.%I, $1) as r on conflict (id) do update set %s',
        target_table, columns_sql, selected_columns_sql, target_table, assignments_sql
      ) using row_data;
      execute format('select to_jsonb(t) from public.%I t where t.id = $1', target_table) into saved_row using target_id;
      records := records || jsonb_build_array(coalesce(saved_row, jsonb_build_object('id', target_id)));
    end if;

    insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
    values (extensions.gen_random_uuid()::text, p_actor, target_action, target_table, target_id,
      target_action || ' ' || replace(target_table, '_', ' ') || ' record' || case when old_row is null then '' else ' (revision ' || (old_row ->> 'version') || ')' end,
      public.red_now());
  end loop;

  perform public.red_bump_revision();
  return records;
exception
  when unique_violation then raise exception 'RED_DUPLICATE';
  when foreign_key_violation then raise exception 'RED_LINKED';
  when check_violation then raise exception 'RED_INVALID_RECORD';
end;
$$;

create or replace function public.red_bootstrap(p_token_hash text, p_email text, p_full_name text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare grant_row public.setup_grants%rowtype; user_id text := extensions.gen_random_uuid()::text;
begin
  if exists (select 1 from public.users) then raise exception 'RED_SETUP_USED'; end if;
  select * into grant_row from public.setup_grants where name = 'first-admin' for update;
  if grant_row.name is null or grant_row.expires_at <= public.red_now_ms() or grant_row.token_hash <> p_token_hash then
    raise exception 'RED_SETUP_INVALID';
  end if;
  insert into public.users(id, email, full_name, password_hash, role, active, created_at)
  values (user_id, p_email, p_full_name, p_password_hash, 'admin', true, public.red_now());
  delete from public.setup_grants;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_email, 'setup', 'users', user_id, 'Internal workspace initialized by its administrator.', public.red_now());
  perform public.red_bump_revision();
  return jsonb_build_object('message', 'Your internal company workspace is ready. Sign in to continue.', 'email', p_email);
end;
$$;

create or replace function public.red_create_invitation(p_id text, p_email text, p_full_name text, p_role text, p_token_hash text, p_invited_by text, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare now_ms bigint := public.red_now_ms(); expires bigint := now_ms + 172800000;
begin
  if p_role <> all (array['admin', 'instructor', 'viewer']) then raise exception 'RED_INVALID_ROLE'; end if;
  if exists (select 1 from public.users where lower(email) = lower(p_email)) then raise exception 'RED_EMAIL_EXISTS'; end if;
  update public.invitations set revoked_at = now_ms where lower(email) = lower(p_email) and used_at is null and revoked_at is null;
  insert into public.invitations(id, email, full_name, role, token_hash, invited_by, created_at, expires_at, used_at, revoked_at)
  values (p_id, p_email, p_full_name, p_role, p_token_hash, p_invited_by, public.red_now(), expires, null, null);
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'invite', 'users', null, 'Invited ' || p_email || ' as ' || p_role || '.', public.red_now());
  perform public.red_bump_revision();
  return jsonb_build_object('id', p_id, 'email', p_email, 'role', p_role, 'expires_at', expires);
end;
$$;

create or replace function public.red_revoke_invitation(p_id text, p_actor text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare changed integer;
begin
  update public.invitations set revoked_at = public.red_now_ms()
  where id = p_id and used_at is null and revoked_at is null;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'RED_NOT_FOUND'; end if;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'revoke-invitation', 'invitations', p_id, 'Invitation revoked.', public.red_now());
  perform public.red_bump_revision();
  return true;
end;
$$;

create or replace function public.red_accept_invitation(p_token_hash text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare invitation_row public.invitations%rowtype; user_id text := extensions.gen_random_uuid()::text;
begin
  select * into invitation_row from public.invitations
  where token_hash = p_token_hash and used_at is null and revoked_at is null and expires_at > public.red_now_ms()
  for update;
  if invitation_row.id is null then raise exception 'RED_INVITATION_INVALID'; end if;
  if exists (select 1 from public.users where lower(email) = lower(invitation_row.email)) then raise exception 'RED_INVITATION_USED'; end if;
  insert into public.users(id, email, full_name, password_hash, role, active, created_at)
  values (user_id, invitation_row.email, invitation_row.full_name, p_password_hash, invitation_row.role, true, public.red_now());
  update public.invitations set used_at = public.red_now_ms() where id = invitation_row.id;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, invitation_row.email, 'accept-invitation', 'users', user_id, 'Invited company staff member activated.', public.red_now());
  perform public.red_bump_revision();
  return jsonb_build_object('message', 'Your company account is ready. Sign in with your email and new password.', 'email', invitation_row.email);
end;
$$;

create or replace function public.red_change_password(p_user_id text, p_old_hash text, p_new_hash text, p_actor text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare changed integer;
begin
  update public.users set password_hash = p_new_hash where id = p_user_id and password_hash = p_old_hash and active = true;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'RED_PASSWORD_CONFLICT'; end if;
  delete from public.sessions where user_id = p_user_id;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'password-change', 'users', p_user_id, 'Password changed; all sessions revoked.', public.red_now());
  perform public.red_bump_revision();
  return true;
end;
$$;

create or replace function public.red_update_user_access(p_target text, p_role text, p_active boolean, p_actor text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare target_row public.users%rowtype;
begin
  if p_role <> all (array['admin', 'instructor', 'viewer']) then raise exception 'RED_INVALID_ROLE'; end if;
  select * into target_row from public.users where id = p_target for update;
  if target_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if target_row.role = 'admin' and target_row.active and (p_role <> 'admin' or p_active = false)
    and not exists (select 1 from public.users where role = 'admin' and active = true and id <> p_target) then
    raise exception 'RED_LAST_ADMIN';
  end if;
  update public.users set role = p_role, active = p_active where id = p_target;
  delete from public.sessions where user_id = p_target;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'permissions', 'users', p_target, 'Role: ' || p_role || '; access: ' || case when p_active then 'active' else 'inactive' end, public.red_now());
  perform public.red_bump_revision();
  return true;
end;
$$;

create or replace function public.red_acknowledge_review(p_id text, p_note text, p_actor text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare changed integer;
begin
  update public.import_reviews set status = 'acknowledged', resolution = p_note, updated_at = public.red_now()
  where id = p_id and status = 'open';
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'RED_NOT_FOUND'; end if;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'acknowledge-source', 'import_reviews', p_id, 'Source discrepancy acknowledged, not rewritten.', public.red_now());
  perform public.red_bump_revision();
  return true;
end;
$$;

create or replace function public.red_set_trainee_photo(p_trainee_id text, p_object_path text, p_mime_type text, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare updated text := public.red_now();
begin
  if not exists (select 1 from public.trainees where id = p_trainee_id) then raise exception 'RED_NOT_FOUND'; end if;
  if p_object_path is null then
    delete from public.trainee_photos where trainee_id = p_trainee_id;
    insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
    values (extensions.gen_random_uuid()::text, p_actor, 'remove-photo', 'trainees', p_trainee_id, 'Removed a private trainee portrait.', updated);
  else
    if p_mime_type <> all (array['image/jpeg', 'image/png', 'image/webp']) then raise exception 'RED_INVALID_RECORD'; end if;
    insert into public.trainee_photos(trainee_id, object_path, mime_type, updated_at)
    values (p_trainee_id, p_object_path, p_mime_type, updated)
    on conflict (trainee_id) do update set object_path = excluded.object_path, mime_type = excluded.mime_type, updated_at = excluded.updated_at;
    insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
    values (extensions.gen_random_uuid()::text, p_actor, 'upload-photo', 'trainees', p_trainee_id, 'Updated a private trainee portrait.', updated);
  end if;
  perform public.red_bump_revision();
  return jsonb_build_object('ok', true, 'updated_at', updated);
end;
$$;

create or replace function public.red_source_list(p_batch text, p_kind text, p_disposition text, p_query text, p_page integer)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  with filtered as (
    select id, kind, title, batch_id, disposition, reason, app_records
    from public.source_records
    where (coalesce(p_batch, '') = '' or batch_id = p_batch)
      and (coalesce(p_kind, '') = '' or kind = p_kind)
      and (coalesce(p_disposition, '') = '' or disposition = p_disposition)
      and (coalesce(p_query, '') = '' or title ilike '%' || p_query || '%' or id ilike '%' || p_query || '%')
  ), page_rows as (
    select * from filtered order by kind, title, id limit 25 offset ((greatest(p_page, 1) - 1) * 25)
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(r) order by r.kind, r.title, r.id) from page_rows r), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'page', greatest(p_page, 1),
    'pages', greatest(1, ceil((select count(*) from filtered)::numeric / 25)::integer)
  )
$$;

revoke all on function public.red_bump_revision() from public, anon, authenticated;
revoke all on function public.red_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.red_workspace_revision() from public, anon, authenticated;
revoke all on function public.red_session_status(text) from public, anon, authenticated;
revoke all on function public.red_workspace_state(boolean) from public, anon, authenticated;
revoke all on function public.red_commit(jsonb, text) from public, anon, authenticated;
revoke all on function public.red_bootstrap(text, text, text, text) from public, anon, authenticated;
revoke all on function public.red_create_invitation(text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.red_revoke_invitation(text, text) from public, anon, authenticated;
revoke all on function public.red_accept_invitation(text, text) from public, anon, authenticated;
revoke all on function public.red_change_password(text, text, text, text) from public, anon, authenticated;
revoke all on function public.red_update_user_access(text, text, boolean, text) from public, anon, authenticated;
revoke all on function public.red_acknowledge_review(text, text, text) from public, anon, authenticated;
revoke all on function public.red_set_trainee_photo(text, text, text, text) from public, anon, authenticated;
revoke all on function public.red_source_list(text, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.red_bump_revision() to service_role;
grant execute on function public.red_rate_limit(text, integer, integer) to service_role;
grant execute on function public.red_workspace_revision() to service_role;
grant execute on function public.red_session_status(text) to service_role;
grant execute on function public.red_workspace_state(boolean) to service_role;
grant execute on function public.red_commit(jsonb, text) to service_role;
grant execute on function public.red_bootstrap(text, text, text, text) to service_role;
grant execute on function public.red_create_invitation(text, text, text, text, text, text, text) to service_role;
grant execute on function public.red_revoke_invitation(text, text) to service_role;
grant execute on function public.red_accept_invitation(text, text) to service_role;
grant execute on function public.red_change_password(text, text, text, text) to service_role;
grant execute on function public.red_update_user_access(text, text, boolean, text) to service_role;
grant execute on function public.red_acknowledge_review(text, text, text) to service_role;
grant execute on function public.red_set_trainee_photo(text, text, text, text) to service_role;
grant execute on function public.red_source_list(text, text, text, text, integer) to service_role;

commit;
