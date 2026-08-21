-- M028 preflight and scoped safety snapshot.
-- Run as postgres in Supabase Web SQL Editor before M028. This does not copy
-- memory content, provenance, credentials, Evidence, Revenue, or Affiliate data.
begin;

do $$
begin
  if to_regclass('public.ai_memory_records') is null then
    raise exception 'm028_preflight_missing_ai_memory_records';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='ai_memory_records'
      and column_name in ('pinned_at','owner_visibility','owner_archived_at')
  ) or to_regclass('public.operational_objects') is not null
  then raise exception 'm028_preflight_partial_state'; end if;
  if to_regnamespace('m028_recovery') is not null then
    raise exception 'm028_recovery_already_exists';
  end if;
end $$;

create schema m028_recovery authorization postgres;
revoke all on schema m028_recovery from public, anon, authenticated, service_role;

create table m028_recovery.memory_manifest(
  id uuid primary key,
  workspace_id uuid not null,
  owner_user_id uuid not null,
  version bigint not null,
  status text not null,
  content_sha256 text not null,
  updated_at timestamptz not null
);

insert into m028_recovery.memory_manifest
  (id,workspace_id,owner_user_id,version,status,content_sha256,updated_at)
select id,workspace_id,owner_user_id,version,status,content_sha256,updated_at
from public.ai_memory_records;

create table m028_recovery.snapshot_manifest(
  captured_at timestamptz not null,
  memory_rows bigint not null,
  deterministic_checksum text not null
);

insert into m028_recovery.snapshot_manifest
select clock_timestamp(), count(*),
       encode(digest(coalesce(string_agg(
         concat_ws('|',id,workspace_id,owner_user_id,version,status,content_sha256,
                   extract(epoch from updated_at)), E'\n' order by id),''),'sha256'),'hex')
from m028_recovery.memory_manifest;

alter table m028_recovery.memory_manifest owner to postgres;
alter table m028_recovery.snapshot_manifest owner to postgres;
revoke all on all tables in schema m028_recovery from public, anon, authenticated, service_role;
commit;

select case when s.memory_rows=count(m.id)
              and s.deterministic_checksum=encode(digest(coalesce(string_agg(
                concat_ws('|',m.id,m.workspace_id,m.owner_user_id,m.version,m.status,
                          m.content_sha256,extract(epoch from m.updated_at)), E'\n' order by m.id),''),
                'sha256'),'hex')
            then 'M028_SCOPED_SNAPSHOT_PASS' else 'M028_SCOPED_SNAPSHOT_FAIL' end as result,
       s.captured_at, s.memory_rows
from m028_recovery.snapshot_manifest s
left join m028_recovery.memory_manifest m on true
group by s.captured_at,s.memory_rows,s.deterministic_checksum;
