begin isolation level serializable;
set local lock_timeout='8s';
set local statement_timeout='60s';

do $$ begin
  if to_regclass('public.operational_objects') is null or to_regprocedure('public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb)') is null then raise exception 'm029_preflight_m028_required';end if;
  if to_regclass('public.canonical_domain_drafts') is not null or to_regprocedure('public.save_canonical_domain_object(text,uuid,bigint,jsonb,text)') is not null then raise exception 'm029_partial_or_applied_state';end if;
  if to_regprocedure('extensions.gen_random_uuid()') is null or to_regprocedure('extensions.digest(text,text)') is null then raise exception 'm029_extensions_namespace_incompatible';end if;
end $$;

create table public._m029_backup_manifest(
  captured_at timestamptz not null default clock_timestamp(),table_name text primary key,row_count bigint not null,id_checksum text not null,status_checksum text not null
);
revoke all on public._m029_backup_manifest from public,anon,authenticated,service_role;

insert into public._m029_backup_manifest(table_name,row_count,id_checksum,status_checksum)
select 'clients',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,status,updated_at),',' order by id),''),'sha256'),'hex') from public.clients union all
select 'opportunities',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,version,status,updated_at),',' order by id),''),'sha256'),'hex') from public.opportunities union all
select 'owner_decisions',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,is_active,decided_at),',' order by id),''),'sha256'),'hex') from public.owner_decisions union all
select 'campaigns',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,version,status,updated_at),',' order by id),''),'sha256'),'hex') from public.campaigns union all
select 'tasks',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,status,updated_at),',' order by id),''),'sha256'),'hex') from public.tasks union all
select 'content_assets',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,version,status,updated_at),',' order by id),''),'sha256'),'hex') from public.content_assets union all
select 'business_memory_records',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,deletion_status,updated_at),',' order by id),''),'sha256'),'hex') from public.business_memory_records union all
select 'personal_operational_records',count(*),encode(extensions.digest(coalesce(string_agg(id::text,',' order by id),''),'sha256'),'hex'),encode(extensions.digest(coalesce(string_agg(concat_ws(':',id,record_type,lifecycle_status,updated_at),',' order by id),''),'sha256'),'hex') from public.personal_operational_records;

commit;
select 'M029_SCOPED_SNAPSHOT_PASS' as result,count(*) as manifest_rows,min(captured_at) as captured_at from public._m029_backup_manifest;
