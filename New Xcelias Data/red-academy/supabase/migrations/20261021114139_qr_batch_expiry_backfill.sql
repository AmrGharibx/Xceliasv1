-- Forward-only data update: align existing QR-only records with the new batch cutoff.
begin;

update public.qr_attendance_activation_codes
set expires_at = to_char(
  timezone('utc', public.red_qr_batch_access_expires_at(batch_id)),
  'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
)
where public.red_qr_batch_access_expires_at(batch_id) is not null
  and expires_at is distinct from to_char(
    timezone('utc', public.red_qr_batch_access_expires_at(batch_id)),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
  );

with session_cutoffs as (
  select id,
    least(
      ((session_date::date + 1)::timestamp at time zone 'Africa/Cairo'),
      public.red_qr_batch_access_expires_at(batch_id)
    ) as cutoff
  from public.qr_attendance_sessions
  where public.red_qr_batch_access_expires_at(batch_id) is not null
)
update public.qr_attendance_sessions as session
set expires_at = to_char(timezone('utc', session_cutoffs.cutoff), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    closed_at = case
      when session.closed_at is null and session_cutoffs.cutoff <= now()
        then to_char(timezone('utc', session_cutoffs.cutoff), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      else session.closed_at
    end,
    version = session.version + 1
from session_cutoffs
where session.id = session_cutoffs.id
  and (session.expires_at is distinct from to_char(timezone('utc', session_cutoffs.cutoff), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    or (session.closed_at is null and session_cutoffs.cutoff <= now()));

commit;
