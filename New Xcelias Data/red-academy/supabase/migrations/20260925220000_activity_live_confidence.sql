-- Optional confidence reflection belongs only to an expiring live-room answer.
-- Existing answers migrate as NULL; this never updates Academy records.
begin;

alter table public.activity_live_answers
  add column if not exists confidence text
  check (confidence is null or confidence in ('tentative', 'confident'));

create or replace function public.red_activity_live_answer(
  p_token_hash text,
  p_choice integer,
  p_confidence text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  player_row public.activity_live_players%rowtype;
  room_row public.activity_live_rooms%rowtype;
  question_row jsonb;
  question_options integer;
  now_value text := public.red_now();
begin
  if p_confidence is not null and p_confidence not in ('tentative', 'confident') then
    raise exception 'RED_ACTIVITY_LIVE_BAD_CONFIDENCE';
  end if;

  select * into player_row
    from public.activity_live_players
    where token_hash = p_token_hash
    for update;
  if player_row.id is null then raise exception 'RED_ACTIVITY_LIVE_NO_SEAT'; end if;

  select * into room_row
    from public.activity_live_rooms
    where id = player_row.room_id
    for update;
  if room_row.id is null or room_row.expires_at::timestamptz <= now() then
    raise exception 'RED_ACTIVITY_LIVE_NO_SEAT';
  end if;
  if room_row.status <> 'Open' or room_row.revealed then
    raise exception 'RED_ACTIVITY_LIVE_ANSWER_CLOSED';
  end if;
  if room_row.deck_snapshot->>'mode' = 'pulse' and p_confidence is not null then
    raise exception 'RED_ACTIVITY_LIVE_BAD_CONFIDENCE';
  end if;

  question_row := room_row.deck_snapshot->'questions'->room_row.round_index;
  if question_row is null or jsonb_typeof(question_row->'options') <> 'array' then
    raise exception 'RED_ACTIVITY_LIVE_BAD_ANSWER';
  end if;
  question_options := jsonb_array_length(question_row->'options');
  if p_choice is null or p_choice < 0 or p_choice >= question_options then
    raise exception 'RED_ACTIVITY_LIVE_BAD_ANSWER';
  end if;

  insert into public.activity_live_answers(
    room_id, player_id, round_index, choice, confidence, updated_at
  ) values (
    room_row.id, player_row.id, room_row.round_index, p_choice, p_confidence, now_value
  )
  on conflict (room_id, player_id, round_index) do update
    set choice = excluded.choice,
        confidence = excluded.confidence,
        correct = null,
        awarded_points = 0,
        updated_at = excluded.updated_at;

  update public.activity_live_players
    set last_seen_at = now_value
    where id = player_row.id;

  return jsonb_build_object('room_id', room_row.id, 'player_id', player_row.id);
end;
$$;

revoke all on function public.red_activity_live_answer(text, integer, text)
  from public, anon, authenticated;
grant execute on function public.red_activity_live_answer(text, integer, text)
  to service_role;

commit;
