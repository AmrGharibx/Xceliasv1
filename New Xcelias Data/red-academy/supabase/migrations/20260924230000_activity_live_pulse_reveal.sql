-- Anonymous class pulses share the temporary live-room tables but never score players.
-- This narrow service-role action reveals a pulse without executing quiz scoring.
begin;

create or replace function public.red_activity_live_pulse_reveal(p_room_id text, p_owner_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  room_row public.activity_live_rooms%rowtype;
  now_value text := public.red_now();
begin
  select * into room_row
  from public.activity_live_rooms
  where id = p_room_id
  for update;

  if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
  if room_row.owner_id is distinct from p_owner_id then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
  if room_row.deck_snapshot->>'mode' is distinct from 'pulse' then raise exception 'RED_ACTIVITY_LIVE_REVEAL'; end if;
  if room_row.status <> 'Open' or room_row.revealed then raise exception 'RED_ACTIVITY_LIVE_REVEAL'; end if;
  if room_row.expires_at::timestamptz <= now() then raise exception 'RED_ACTIVITY_LIVE_NO_SEAT'; end if;

  update public.activity_live_rooms
  set revealed = true, correct_choice = null, timer_ends_at = null, updated_at = now_value
  where id = room_row.id;

  return jsonb_build_object('room_id', room_row.id, 'revealed', true);
end;
$$;

revoke all on function public.red_activity_live_pulse_reveal(text, text) from public, anon, authenticated;
grant execute on function public.red_activity_live_pulse_reveal(text, text) to service_role;

commit;
