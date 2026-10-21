-- Forward-only DDL: bind QR codes and attendance sessions to the batch's final day.
begin;

create or replace function public.red_qr_batch_access_expires_at(batch_id_value text)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with selected_batch as (
    select end_date, session_dates
    from public.batches
    where id = batch_id_value
  ), last_day as (
    select coalesce(
      case
        when end_date ~ '^\d{4}-\d{2}-\d{2}$' then
          case when pg_input_is_valid(end_date, 'date') then end_date::date end
      end,
      (
        select max(
          case
            when scheduled.value ~ '^\d{4}-\d{2}-\d{2}$' then
              case when pg_input_is_valid(scheduled.value, 'date') then scheduled.value::date end
          end
        )
        from jsonb_array_elements_text(coalesce(selected_batch.session_dates, '[]'::jsonb)) as scheduled(value)
      )
    ) as day_value
    from selected_batch
  )
  select case when day_value is null then null else (day_value + time '20:00') at time zone 'Africa/Cairo' end
  from last_day;
$$;

create or replace function public.red_qr_sync_code_expiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  batch_expiry timestamptz := public.red_qr_batch_access_expires_at(new.batch_id);
begin
  if batch_expiry is null then
    if tg_op = 'INSERT' then raise exception 'RED_QR_BATCH_EXPIRED'; end if;
    batch_expiry := now();
  elsif tg_op = 'INSERT' and batch_expiry <= now() then
    raise exception 'RED_QR_BATCH_EXPIRED';
  end if;
  new.expires_at := to_char(timezone('utc', batch_expiry), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  return new;
end;
$$;

create trigger qr_activation_code_batch_expiry
before insert or update of batch_id, expires_at on public.qr_attendance_activation_codes
for each row execute function public.red_qr_sync_code_expiry();

create or replace function public.red_qr_sync_session_expiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  batch_expiry timestamptz := public.red_qr_batch_access_expires_at(new.batch_id);
  session_expiry timestamptz;
begin
  if tg_op = 'INSERT' and (batch_expiry is null or batch_expiry <= now()) then
    raise exception 'RED_QR_BATCH_EXPIRED';
  end if;
  if batch_expiry is null then batch_expiry := now(); end if;
  session_expiry := least(((new.session_date::date + 1)::timestamp at time zone 'Africa/Cairo'), batch_expiry);
  new.expires_at := to_char(timezone('utc', session_expiry), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  return new;
end;
$$;

create trigger qr_session_batch_expiry
before insert or update of batch_id, session_date, expires_at on public.qr_attendance_sessions
for each row execute function public.red_qr_sync_session_expiry();

create or replace function public.red_qr_refresh_batch_expiry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  batch_expiry timestamptz := public.red_qr_batch_access_expires_at(new.id);
begin
  if batch_expiry is not null then
    update public.qr_attendance_activation_codes
      set expires_at = to_char(timezone('utc', batch_expiry), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      where batch_id = new.id;
    update public.qr_attendance_sessions
      set expires_at = to_char(timezone('utc', least(((session_date::date + 1)::timestamp at time zone 'Africa/Cairo'), batch_expiry)), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          version = version + 1
      where batch_id = new.id and closed_at is null;
    update public.qr_attendance_sessions
      set closed_at = expires_at, version = version + 1
      where batch_id = new.id and closed_at is null and expires_at::timestamptz <= now();
  else
    update public.qr_attendance_activation_codes
      set expires_at = to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      where batch_id = new.id;
    update public.qr_attendance_sessions
      set expires_at = to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          closed_at = coalesce(closed_at, to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
          version = version + 1
      where batch_id = new.id and closed_at is null;
  end if;
  return new;
end;
$$;

create trigger qr_batch_schedule_refresh_expiry
after update of end_date, session_dates on public.batches
for each row
when (old.end_date is distinct from new.end_date or old.session_dates is distinct from new.session_dates)
execute function public.red_qr_refresh_batch_expiry();

revoke all on function public.red_qr_batch_access_expires_at(text) from public, anon, authenticated;
revoke all on function public.red_qr_sync_code_expiry() from public, anon, authenticated;
revoke all on function public.red_qr_sync_session_expiry() from public, anon, authenticated;
revoke all on function public.red_qr_refresh_batch_expiry() from public, anon, authenticated;

commit;
