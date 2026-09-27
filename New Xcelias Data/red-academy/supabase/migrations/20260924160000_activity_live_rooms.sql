-- Anonymous, short-lived classroom phone rooms for trainer-led activities.
-- These rooms never write trainee, attendance, assessment, assignment, or XP records.
begin;

create table if not exists public.activity_live_rooms (
  id text primary key,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  owner_id text not null references public.users(id) on delete cascade,
  activity_id text not null,
  deck_snapshot jsonb not null check (jsonb_typeof(deck_snapshot) = 'object'),
  team_one text not null check (length(team_one) between 1 and 28),
  team_two text not null check (length(team_two) between 1 and 28),
  status text not null default 'Open' check (status in ('Open', 'Complete', 'Closed')),
  round_index integer not null default 0 check (round_index >= 0),
  revealed boolean not null default false,
  correct_choice integer check (correct_choice is null or correct_choice between 0 and 7),
  timer_duration integer not null default 0 check (timer_duration in (0, 20, 30, 45)),
  timer_ends_at text,
  created_at text not null,
  updated_at text not null,
  expires_at text not null
);

create index if not exists ix_red_activity_live_rooms_expiry
  on public.activity_live_rooms (expires_at);

create table if not exists public.activity_live_players (
  id text primary key,
  room_id text not null references public.activity_live_rooms(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  nickname text not null check (length(nickname) between 1 and 24),
  team_no integer not null check (team_no in (1, 2)),
  points integer not null default 0 check (points >= 0),
  streak integer not null default 0 check (streak >= 0),
  joined_at text not null,
  last_seen_at text not null,
  unique (room_id, id)
);

create index if not exists ix_red_activity_live_players_room
  on public.activity_live_players (room_id, team_no, points desc);

create table if not exists public.activity_live_answers (
  room_id text not null references public.activity_live_rooms(id) on delete cascade,
  player_id text not null references public.activity_live_players(id) on delete cascade,
  round_index integer not null check (round_index >= 0),
  choice integer not null check (choice between 0 and 7),
  correct boolean,
  awarded_points integer not null default 0 check (awarded_points >= 0),
  updated_at text not null,
  primary key (room_id, player_id, round_index)
);

create index if not exists ix_red_activity_live_answers_round
  on public.activity_live_answers (room_id, round_index, choice);

alter table public.activity_live_rooms enable row level security;
alter table public.activity_live_players enable row level security;
alter table public.activity_live_answers enable row level security;
revoke all on table public.activity_live_rooms, public.activity_live_players, public.activity_live_answers from public, anon, authenticated;
grant all on table public.activity_live_rooms, public.activity_live_players, public.activity_live_answers to service_role;

create or replace function public.red_activity_live_mutate(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  room_row public.activity_live_rooms%rowtype;
  player_row public.activity_live_players%rowtype;
  answer_row public.activity_live_answers%rowtype;
  question_row jsonb;
  question_answer integer;
  question_options integer;
  current_choice integer;
  award integer;
  total_rounds integer;
  now_value text := public.red_now();
  expires_value text;
begin
  if p_action = 'create' then
    delete from public.activity_live_rooms where expires_at::timestamptz <= now();
    if p_payload->>'id' is null or p_payload->>'owner_id' is null
      or p_payload->>'code_hash' !~ '^[a-f0-9]{64}$'
      or jsonb_typeof(p_payload->'deck_snapshot') <> 'object'
      or (p_payload->>'timer_duration')::integer not in (0,20,30,45) then
      raise exception 'RED_ACTIVITY_LIVE_INVALID_CREATE';
    end if;
    insert into public.activity_live_rooms(
      id,code_hash,owner_id,activity_id,deck_snapshot,team_one,team_two,timer_duration,
      created_at,updated_at,expires_at
    ) values (
      p_payload->>'id',p_payload->>'code_hash',p_payload->>'owner_id',p_payload->>'activity_id',
      p_payload->'deck_snapshot',p_payload->>'team_one',p_payload->>'team_two',
      (p_payload->>'timer_duration')::integer,now_value,now_value,p_payload->>'expires_at'
    );
    return jsonb_build_object('room_id',p_payload->>'id','expires_at',p_payload->>'expires_at');
  elsif p_action = 'join' then
    select * into room_row from public.activity_live_rooms
      where code_hash=p_payload->>'code_hash' for update;
    if room_row.id is null or room_row.expires_at::timestamptz <= now() then raise exception 'RED_ACTIVITY_LIVE_INVALID_CODE'; end if;
    if room_row.status <> 'Open' then raise exception 'RED_ACTIVITY_LIVE_CLOSED'; end if;
    if (select count(*) from public.activity_live_players where room_id=room_row.id) >= 80 then raise exception 'RED_ACTIVITY_LIVE_FULL'; end if;
    if exists (select 1 from public.activity_live_players where room_id=room_row.id and lower(nickname)=lower(p_payload->>'nickname')) then raise exception 'RED_ACTIVITY_LIVE_NICKNAME'; end if;
    if length(p_payload->>'nickname') not between 1 and 24 or (p_payload->>'team_no')::integer not in (1,2)
      or p_payload->>'token_hash' !~ '^[a-f0-9]{64}$' then raise exception 'RED_ACTIVITY_LIVE_INVALID_JOIN'; end if;
    insert into public.activity_live_players(id,room_id,token_hash,nickname,team_no,joined_at,last_seen_at)
    values(p_payload->>'player_id',room_row.id,p_payload->>'token_hash',p_payload->>'nickname',(p_payload->>'team_no')::integer,now_value,now_value);
    return jsonb_build_object('room_id',room_row.id,'player_id',p_payload->>'player_id');
  elsif p_action = 'answer' then
    select * into player_row from public.activity_live_players where token_hash=p_payload->>'token_hash';
    if player_row.id is null then raise exception 'RED_ACTIVITY_LIVE_NO_SEAT'; end if;
    select * into room_row from public.activity_live_rooms where id=player_row.room_id for update;
    if room_row.status <> 'Open' or room_row.revealed then raise exception 'RED_ACTIVITY_LIVE_ANSWER_CLOSED'; end if;
    if room_row.expires_at::timestamptz <= now() then raise exception 'RED_ACTIVITY_LIVE_NO_SEAT'; end if;
    question_row := room_row.deck_snapshot->'questions'->room_row.round_index;
    question_options := jsonb_array_length(question_row->'options');
    current_choice := (p_payload->>'choice')::integer;
    if question_row is null or current_choice < 0 or current_choice >= question_options then raise exception 'RED_ACTIVITY_LIVE_BAD_ANSWER'; end if;
    insert into public.activity_live_answers(room_id,player_id,round_index,choice,updated_at)
    values(room_row.id,player_row.id,room_row.round_index,current_choice,now_value)
    on conflict(room_id,player_id,round_index) do update set choice=excluded.choice,correct=null,awarded_points=0,updated_at=excluded.updated_at;
    update public.activity_live_players set last_seen_at=now_value where id=player_row.id;
    return jsonb_build_object('room_id',room_row.id,'player_id',player_row.id);
  elsif p_action = 'reveal' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    if room_row.status <> 'Open' or room_row.revealed then raise exception 'RED_ACTIVITY_LIVE_REVEAL'; end if;
    question_row := room_row.deck_snapshot->'questions'->room_row.round_index;
    question_answer := (question_row->>'answer')::integer;
    for player_row in select * from public.activity_live_players where room_id=room_row.id for update loop
      select * into answer_row from public.activity_live_answers
        where room_id=room_row.id and player_id=player_row.id and round_index=room_row.round_index;
      if answer_row.player_id is null then
        update public.activity_live_players set streak=0 where id=player_row.id;
      else
        award := case when answer_row.choice=question_answer then 100 + least(player_row.streak,4)*25 else 0 end;
        update public.activity_live_answers set correct=(choice=question_answer),awarded_points=award
          where room_id=room_row.id and player_id=player_row.id and round_index=room_row.round_index;
        update public.activity_live_players set points=points+award,
          streak=case when answer_row.choice=question_answer then streak+1 else 0 end where id=player_row.id;
      end if;
    end loop;
    update public.activity_live_rooms set revealed=true,correct_choice=question_answer,timer_ends_at=null,updated_at=now_value where id=room_row.id;
    return jsonb_build_object('room_id',room_row.id);
  elsif p_action = 'advance' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    if room_row.status <> 'Open' or not room_row.revealed then raise exception 'RED_ACTIVITY_LIVE_ADVANCE'; end if;
    total_rounds := jsonb_array_length(room_row.deck_snapshot->'questions');
    if room_row.round_index+1 >= total_rounds then
      update public.activity_live_rooms set status='Complete',timer_ends_at=null,updated_at=now_value where id=room_row.id;
    else
      update public.activity_live_rooms set round_index=round_index+1,revealed=false,correct_choice=null,timer_ends_at=null,updated_at=now_value where id=room_row.id;
    end if;
    return jsonb_build_object('room_id',room_row.id);
  elsif p_action = 'replay' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    if room_row.status <> 'Complete' then raise exception 'RED_ACTIVITY_LIVE_REPLAY'; end if;
    delete from public.activity_live_answers where room_id=room_row.id;
    update public.activity_live_players set points=0,streak=0 where room_id=room_row.id;
    update public.activity_live_rooms set status='Open',round_index=0,revealed=false,correct_choice=null,timer_ends_at=null,updated_at=now_value where id=room_row.id;
    return jsonb_build_object('room_id',room_row.id);
  elsif p_action = 'timer' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    if room_row.status <> 'Open' or room_row.revealed or room_row.timer_duration=0 then raise exception 'RED_ACTIVITY_LIVE_TIMER'; end if;
    expires_value := nullif(p_payload->>'ends_at','');
    if expires_value is not null and expires_value::timestamptz > now()+make_interval(secs=>room_row.timer_duration+5) then raise exception 'RED_ACTIVITY_LIVE_TIMER'; end if;
    update public.activity_live_rooms set timer_ends_at=expires_value,updated_at=now_value where id=room_row.id;
    return jsonb_build_object('room_id',room_row.id);
  elsif p_action = 'close' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    update public.activity_live_rooms set status='Closed',timer_ends_at=null,updated_at=now_value where id=room_row.id;
    return jsonb_build_object('room_id',room_row.id);
  elsif p_action = 'resume' then
    select * into room_row from public.activity_live_rooms where id=p_payload->>'room_id' for update;
    if room_row.id is null then raise exception 'RED_NOT_FOUND'; end if;
    if room_row.owner_id <> p_payload->>'owner_id' then raise exception 'RED_ACTIVITY_LIVE_HOST'; end if;
    if room_row.status not in ('Open','Complete') or room_row.expires_at::timestamptz <= now() then raise exception 'RED_ACTIVITY_LIVE_RESUME'; end if;
    if p_payload->>'code_hash' !~ '^[a-f0-9]{64}$' then raise exception 'RED_ACTIVITY_LIVE_INVALID_CREATE'; end if;
    update public.activity_live_rooms set code_hash=p_payload->>'code_hash',updated_at=now_value where id=room_row.id;
    return jsonb_build_object('room_id',room_row.id);
  else
    raise exception 'RED_ACTIVITY_LIVE_INVALID_ACTION';
  end if;
end;
$$;

revoke all on function public.red_activity_live_mutate(text, jsonb) from public, anon, authenticated;
grant execute on function public.red_activity_live_mutate(text, jsonb) to service_role;

commit;
