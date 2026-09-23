-- Let administrators correct staff display names without changing roles or sessions.
begin;

create or replace function public.red_rename_user(p_target text,p_full_name text,p_actor text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare old_name text; new_name text := btrim(coalesce(p_full_name, ''));
begin
  if p_target is null or new_name = '' or length(new_name) > 160 or p_actor is null or length(p_actor) > 254 then
    raise exception 'RED_INVALID_RECORD';
  end if;
  select full_name into old_name from public.users where id = p_target for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if old_name = new_name then return true; end if;

  update public.users set full_name = new_name where id = p_target;
  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
  values (extensions.gen_random_uuid()::text,p_actor,'display-name','users',p_target,
    'Updated display name from ' || old_name || ' to ' || new_name || '.',public.red_now());
  perform public.red_bump_revision();
  return true;
end;
$$;

revoke all on function public.red_rename_user(text,text,text) from public, anon, authenticated;
grant execute on function public.red_rename_user(text,text,text) to service_role;

commit;
