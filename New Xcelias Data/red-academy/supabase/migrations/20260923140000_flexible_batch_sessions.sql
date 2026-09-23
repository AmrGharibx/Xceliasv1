-- Allow company batches to schedule a variable number of sessions (1-366).
-- Existing batch calendars and attendance rows are not rewritten.
create or replace function public.red_guard_batch_sessions()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if jsonb_typeof(new.session_dates) <> 'array'
    or (new.source_id is null and (jsonb_array_length(new.session_dates) < 1 or jsonb_array_length(new.session_dates) > 366))
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
