-- Reversible archive metadata; operational data remains attached and intact.
begin;

alter table public.batches add column if not exists archived_at text;
alter table public.batches add column if not exists archived_by text;

create or replace function public.red_archive_batch(p_id text,p_expected_version integer,p_archived boolean,p_actor text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare current_batch public.batches%rowtype; saved_batch public.batches%rowtype; archive_time text;
begin
  if p_id is null or p_expected_version < 1 or p_archived is null or p_actor is null or length(p_actor) > 254 then
    raise exception 'RED_INVALID_OPERATION';
  end if;
  select * into current_batch from public.batches where id = p_id for update;
  if not found then raise exception 'RED_NOT_FOUND'; end if;
  if current_batch.version <> p_expected_version then raise exception 'RED_CONFLICT'; end if;
  if (current_batch.archived_at is not null) = p_archived then raise exception 'RED_CONFLICT'; end if;

  archive_time := case when p_archived then public.red_now() else null end;
  update public.batches
  set archived_at = archive_time,
      archived_by = case when p_archived then p_actor else null end,
      version = version + 1,
      updated_at = public.red_now()
  where id = p_id
  returning * into saved_batch;

  insert into public.audit_log(id,actor,action,entity,entity_id,details,created_at)
  values (extensions.gen_random_uuid()::text,p_actor,case when p_archived then 'archive-batch' else 'restore-batch' end,
    'batches',p_id,case when p_archived then 'Archived ' else 'Restored ' end || current_batch.batch_name || '; records preserved.',public.red_now());
  perform public.red_bump_revision();
  return to_jsonb(saved_batch);
end;
$$;

revoke all on function public.red_archive_batch(text,integer,boolean,text) from public, anon, authenticated;
grant execute on function public.red_archive_batch(text,integer,boolean,text) to service_role;

commit;
