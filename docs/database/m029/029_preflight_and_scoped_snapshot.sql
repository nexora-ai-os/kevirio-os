begin isolation level serializable;
set local lock_timeout='8s'; set local statement_timeout='120s';
do $$ begin
 if to_regclass('public.operational_objects') is null or to_regprocedure('public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb)') is null then raise exception 'm029_preflight_m028_required';end if;
 if to_regclass('public.canonical_domain_drafts') is not null or to_regprocedure('public.save_canonical_domain_object(text,uuid,bigint,jsonb,text)') is not null then raise exception 'm029_partial_or_applied_state';end if;
 if to_regprocedure('extensions.gen_random_uuid()') is null or to_regprocedure('extensions.digest(text,text)') is null then raise exception 'm029_extensions_namespace_incompatible';end if;
 if exists(select 1 from pg_namespace where nspname='_m029_recovery') then raise exception 'm029_recovery_already_exists_cleanup_forbidden';end if;
end $$;
create schema _m029_recovery authorization postgres;
revoke all on schema _m029_recovery from public,anon,authenticated,service_role;
create table _m029_recovery.snapshot_control(snapshot_id uuid primary key default extensions.gen_random_uuid(),captured_at timestamptz not null default clock_timestamp(),package_revision text not null default 'M029_PRE_APPLY_RECOVERY_V2',state text not null check(state in('BUILDING','SEALED')));
create table _m029_recovery.business_rows(source_table text not null,source_id uuid not null,row_data jsonb not null,row_hash text not null,primary key(source_table,source_id),check(source_table in('clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records')));
create table _m029_recovery.manifest(source_table text primary key,row_count bigint not null,id_checksum text not null,row_checksum text not null);
create table _m029_recovery.security_metadata(kind text not null,object_identity text not null,definition text not null,definition_hash text not null,primary key(kind,object_identity));
alter table _m029_recovery.snapshot_control enable row level security; alter table _m029_recovery.snapshot_control force row level security;
alter table _m029_recovery.business_rows enable row level security; alter table _m029_recovery.business_rows force row level security;
alter table _m029_recovery.manifest enable row level security; alter table _m029_recovery.manifest force row level security;
alter table _m029_recovery.security_metadata enable row level security; alter table _m029_recovery.security_metadata force row level security;
revoke all on all tables in schema _m029_recovery from public,anon,authenticated,service_role;
insert into _m029_recovery.snapshot_control(state) values('BUILDING');
do $snapshot$ declare t text; begin
 foreach t in array array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records'] loop
  execute format('insert into _m029_recovery.business_rows(source_table,source_id,row_data,row_hash) select %L,id,to_jsonb(x),encode(extensions.digest(to_jsonb(x)::text,%L),%L) from public.%I x',t,'sha256','hex',t);
  execute format('insert into _m029_recovery.manifest select %L,count(*),encode(extensions.digest(coalesce(string_agg(source_id::text,%L order by source_id),%L),%L),%L),encode(extensions.digest(coalesce(string_agg(row_hash,%L order by source_id),%L),%L),%L) from _m029_recovery.business_rows where source_table=%L',t,',','','sha256','hex',',','','sha256','hex',t);
 end loop;
end $snapshot$;
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select 'TABLE_SECURITY',c.oid::regclass::text,jsonb_build_object('rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner))::text,encode(extensions.digest(jsonb_build_object('rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner))::text,'sha256'),'hex') from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any(array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records']);
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select 'POLICY',tablename||'.'||policyname,to_jsonb(p)::text,encode(extensions.digest(to_jsonb(p)::text,'sha256'),'hex') from pg_policies p where schemaname='public' and tablename=any(array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records']);
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select 'GRANT',table_name||':'||grantee||':'||privilege_type,to_jsonb(g)::text,encode(extensions.digest(to_jsonb(g)::text,'sha256'),'hex') from information_schema.role_table_grants g where table_schema='public' and table_name=any(array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records']) and grantee in('anon','authenticated','service_role');
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select 'FUNCTION',p.oid::regprocedure::text,pg_get_functiondef(p.oid),encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='m028_reference_exists';
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select case c.contype when 'p' then 'PRIMARY_KEY' when 'f' then 'FOREIGN_KEY' when 'u' then 'UNIQUE' else 'CHECK' end,c.conrelid::regclass::text||'.'||c.conname,pg_get_constraintdef(c.oid,true),encode(extensions.digest(pg_get_constraintdef(c.oid,true),'sha256'),'hex') from pg_constraint c where c.conrelid=any(array['public.clients'::regclass,'public.opportunities'::regclass,'public.owner_decisions'::regclass,'public.campaigns'::regclass,'public.tasks'::regclass,'public.content_assets'::regclass,'public.business_memory_records'::regclass,'public.personal_operational_records'::regclass]);
insert into _m029_recovery.security_metadata(kind,object_identity,definition,definition_hash)
select 'INDEX',schemaname||'.'||indexname,indexdef,encode(extensions.digest(indexdef,'sha256'),'hex') from pg_indexes where schemaname='public' and tablename=any(array['clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records','personal_operational_records']);
update _m029_recovery.snapshot_control set state='SEALED'; commit;
select jsonb_build_object('result','M029_PRE_APPLY_SNAPSHOT_CREATED','manifest_rows',(select count(*) from _m029_recovery.manifest),'business_rows',(select count(*) from _m029_recovery.business_rows),'metadata_rows',(select count(*) from _m029_recovery.security_metadata),'browser_privileges',(select count(*) from information_schema.table_privileges where table_schema='_m029_recovery' and grantee in('anon','authenticated','service_role'))) verification;
