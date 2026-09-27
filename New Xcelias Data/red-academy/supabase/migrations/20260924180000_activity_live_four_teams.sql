-- Live-room groups can now be split into two, three, or four teams.
-- Existing two-team room snapshots remain valid and keep their original names.
begin;

alter table public.activity_live_players
  drop constraint if exists activity_live_players_team_no_check;
alter table public.activity_live_players
  add constraint activity_live_players_team_no_check check (team_no between 1 and 4);

create or replace function public.red_activity_live_join(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  room_row public.activity_live_rooms%rowtype;
  team_count integer;
  team_no_value integer;
  now_value text := public.red_now();
begin
  if coalesce(p_payload->>'code_hash','') !~ '^[a-f0-9]{64}$'
    or coalesce(p_payload->>'token_hash','') !~ '^[a-f0-9]{64}$'
    or coalesce(p_payload->>'team_no','') !~ '^[1-4]$'
    or p_payload->>'player_id' is null
    or p_payload->>'nickname' is null then
    raise exception 'RED_ACTIVITY_LIVE_INVALID_JOIN';
  end if;
  team_no_value := (p_payload->>'team_no')::integer;

  select * into room_row from public.activity_live_rooms
    where code_hash=p_payload->>'code_hash' for update;
  if room_row.id is null or room_row.expires_at::timestamptz <= now() then
    raise exception 'RED_ACTIVITY_LIVE_INVALID_CODE';
  end if;
  if room_row.status <> 'Open' then raise exception 'RED_ACTIVITY_LIVE_CLOSED'; end if;
  if (select count(*) from public.activity_live_players where room_id=room_row.id) >= 80 then
    raise exception 'RED_ACTIVITY_LIVE_FULL';
  end if;
  if exists (select 1 from public.activity_live_players
    where room_id=room_row.id and lower(nickname)=lower(p_payload->>'nickname')) then
    raise exception 'RED_ACTIVITY_LIVE_NICKNAME';
  end if;

  team_count := case
    when jsonb_typeof(room_row.deck_snapshot->'team_names') = 'array'
      then jsonb_array_length(room_row.deck_snapshot->'team_names')
    else 2
  end;
  if length(p_payload->>'nickname') not between 1 and 24
    or (p_payload->>'nickname') ~ '[[:cntrl:]]'
    or team_no_value > team_count then
    raise exception 'RED_ACTIVITY_LIVE_INVALID_JOIN';
  end if;

  insert into public.activity_live_players(id,room_id,token_hash,nickname,team_no,joined_at,last_seen_at)
  values(p_payload->>'player_id',room_row.id,p_payload->>'token_hash',p_payload->>'nickname',team_no_value,now_value,now_value);
  return jsonb_build_object('room_id',room_row.id,'player_id',p_payload->>'player_id');
end;
$$;

revoke all on function public.red_activity_live_join(jsonb) from public, anon, authenticated;
grant execute on function public.red_activity_live_join(jsonb) to service_role;

commit;
