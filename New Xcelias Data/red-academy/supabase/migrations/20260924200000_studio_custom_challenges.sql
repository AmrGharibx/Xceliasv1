-- Shared trainer-authored Studio challenges. Answer keys are service-role only.
begin;

create table if not exists public.activity_custom_challenges (
  id text primary key check (id ~ '^studio-[a-f0-9]{32}$'),
  title text not null check (length(title) between 3 and 80),
  category text not null check (length(category) between 2 and 60),
  level text not null check (level in ('Warm-up', 'Core', 'Challenge')),
  duration_minutes integer not null check (duration_minutes between 2 and 45),
  description text not null default '' check (length(description) <= 280),
  content_json jsonb not null check (
    jsonb_typeof(content_json) = 'object'
    and jsonb_typeof(content_json->'questions') = 'array'
    and jsonb_array_length(content_json->'questions') between 3 and 12
    and jsonb_typeof(content_json->'study_cards') = 'array'
    and jsonb_array_length(content_json->'study_cards') <= 8
  ),
  created_by text not null,
  created_at text not null,
  archived_at text
);

create index if not exists ix_red_activity_custom_active
  on public.activity_custom_challenges (archived_at, created_at desc);

alter table public.activity_custom_challenges enable row level security;
revoke all on table public.activity_custom_challenges from anon, authenticated;
grant all on table public.activity_custom_challenges to service_role;

create or replace function public.red_create_activity_custom_challenge(
  p_id text,
  p_title text,
  p_category text,
  p_level text,
  p_duration_minutes integer,
  p_description text,
  p_content_json jsonb,
  p_actor text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  saved public.activity_custom_challenges%rowtype;
  now_value text := public.red_now();
begin
  if p_id !~ '^studio-[a-f0-9]{32}$'
    or length(p_title) not between 3 and 80
    or length(p_category) not between 2 and 60
    or p_level not in ('Warm-up', 'Core', 'Challenge')
    or p_duration_minutes not between 2 and 45
    or length(p_description) > 280
    or jsonb_typeof(p_content_json) <> 'object'
    or jsonb_typeof(p_content_json->'questions') <> 'array'
    or jsonb_array_length(p_content_json->'questions') not between 3 and 12
    or jsonb_typeof(p_content_json->'study_cards') <> 'array'
    or jsonb_array_length(p_content_json->'study_cards') > 8 then
    raise exception 'RED_INVALID_RECORD';
  end if;

  insert into public.activity_custom_challenges (
    id, title, category, level, duration_minutes, description,
    content_json, created_by, created_at, archived_at
  ) values (
    p_id, p_title, p_category, p_level, p_duration_minutes, p_description,
    p_content_json, p_actor, now_value, null
  ) returning * into saved;

  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'create-studio-challenge',
    'activity_custom_challenges', saved.id, 'Created custom Academy Studio challenge ' || saved.title || '.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(saved);
end;
$$;

create or replace function public.red_archive_activity_custom_challenge(p_id text, p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  saved public.activity_custom_challenges%rowtype;
  now_value text := public.red_now();
begin
  update public.activity_custom_challenges set archived_at = now_value
    where id = p_id and archived_at is null returning * into saved;
  if saved.id is null then raise exception 'RED_NOT_FOUND'; end if;
  insert into public.audit_log(id, actor, action, entity, entity_id, details, created_at)
  values (extensions.gen_random_uuid()::text, p_actor, 'archive-studio-challenge',
    'activity_custom_challenges', saved.id,
    'Archived custom Academy Studio challenge ' || saved.title || '. Existing assignments remain available.', now_value);
  perform public.red_bump_revision();
  return to_jsonb(saved);
end;
$$;

revoke all on function public.red_create_activity_custom_challenge(text, text, text, text, integer, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.red_archive_activity_custom_challenge(text, text) from public, anon, authenticated;
grant execute on function public.red_create_activity_custom_challenge(text, text, text, text, integer, text, jsonb, text) to service_role;
grant execute on function public.red_archive_activity_custom_challenge(text, text) to service_role;

commit;
