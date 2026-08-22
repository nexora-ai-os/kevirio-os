-- A. Freeze/export. Independent SQL Editor execution unit.
begin;
create table if not exists public._m029_recovery_canonical_versions(table_name text not null,id uuid not null,version bigint not null,owner_user_id uuid not null,visibility text not null,primary key(table_name,id));
create table if not exists public._m029_recovery_drafts (like public.canonical_domain_drafts including all);
create table if not exists public._m029_recovery_conversions (like public.canonical_domain_conversions including all);
alter table public._m029_recovery_canonical_versions enable row level security;
alter table public._m029_recovery_canonical_versions force row level security;
alter table public._m029_recovery_drafts enable row level security;
alter table public._m029_recovery_drafts force row level security;
alter table public._m029_recovery_conversions enable row level security;
alter table public._m029_recovery_conversions force row level security;
truncate public._m029_recovery_canonical_versions,public._m029_recovery_drafts,public._m029_recovery_conversions;
insert into public._m029_recovery_canonical_versions select 'clients',id,version,data_owner_id,visibility from public.clients union all select 'opportunities',id,version,created_by,visibility from public.opportunities union all select 'owner_decisions',id,version,decided_by,visibility from public.owner_decisions union all select 'campaigns',id,version,data_owner_id,visibility from public.campaigns union all select 'tasks',id,version,data_owner_id,visibility from public.tasks union all select 'content_assets',id,version,data_owner_id,visibility from public.content_assets union all select 'business_memory_records',id,version,data_owner_id,visibility from public.business_memory_records union all select 'personal_operational_records',id,version,data_owner_id,'PRIVATE' from public.personal_operational_records;
insert into public._m029_recovery_drafts select * from public.canonical_domain_drafts;
insert into public._m029_recovery_conversions select * from public.canonical_domain_conversions;
revoke all on public._m029_recovery_canonical_versions,public._m029_recovery_drafts,public._m029_recovery_conversions from public,anon,authenticated,service_role;
commit;
select jsonb_build_object('result','M029_ACCEPTED_DATA_FROZEN','versions',(select count(*) from public._m029_recovery_canonical_versions),'drafts',(select count(*) from public._m029_recovery_drafts),'conversions',(select count(*) from public._m029_recovery_conversions)) verification;
