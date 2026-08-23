begin;
do $$ begin
 if to_regprocedure('public.update_affiliate_program_master_practical(uuid,timestamp with time zone,bigint,jsonb)') is not null or to_regprocedure('public.delete_affiliate_program_master_if_safe(uuid,timestamp with time zone,bigint,text)') is not null then raise exception 'm030_unexpected_existing_state';end if;
 if exists(select 1 from pg_namespace where nspname='_m030_recovery') then raise exception 'm030_recovery_already_exists';end if;
 if to_regprocedure('public.update_affiliate_program_master(uuid,timestamp with time zone,jsonb)') is null or to_regprocedure('public.update_affiliate_program_operational(uuid,bigint,jsonb)') is null or to_regprocedure('public.save_canonical_domain_object(text,uuid,bigint,jsonb,text)') is null then raise exception 'm030_m027_m029_baseline_missing';end if;
end $$;
create schema _m030_recovery authorization postgres;
revoke all on schema _m030_recovery from public,anon,authenticated,service_role;
create table _m030_recovery.control(captured_at timestamptz not null default clock_timestamp(),state text not null check(state in('BUILDING','SEALED')));
create table _m030_recovery.program_rows(id uuid primary key,row_data jsonb not null,row_hash text not null);
create table _m030_recovery.draft_rows(program_master_id uuid primary key,row_data jsonb not null,row_hash text not null);
create table _m030_recovery.security_metadata(kind text not null,identity text not null,definition text not null,definition_hash text not null,primary key(kind,identity));
alter table _m030_recovery.control enable row level security;alter table _m030_recovery.control force row level security;
alter table _m030_recovery.program_rows enable row level security;alter table _m030_recovery.program_rows force row level security;
alter table _m030_recovery.draft_rows enable row level security;alter table _m030_recovery.draft_rows force row level security;
alter table _m030_recovery.security_metadata enable row level security;alter table _m030_recovery.security_metadata force row level security;
revoke all on all tables in schema _m030_recovery from public,anon,authenticated,service_role;
insert into _m030_recovery.control(state) values('BUILDING');
insert into _m030_recovery.program_rows select id,to_jsonb(x),encode(extensions.digest(to_jsonb(x)::text,'sha256'),'hex') from public.affiliate_program_master x;
insert into _m030_recovery.draft_rows select program_master_id,to_jsonb(x),encode(extensions.digest(to_jsonb(x)::text,'sha256'),'hex') from public.affiliate_program_drafts x;
insert into _m030_recovery.security_metadata
select 'FUNCTION',p.oid::regprocedure::text,pg_get_functiondef(p.oid),encode(extensions.digest(pg_get_functiondef(p.oid),'sha256'),'hex') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('update_affiliate_program_master','update_affiliate_program_operational');
insert into _m030_recovery.security_metadata
select 'GRANT',routine_name||':'||grantee||':'||privilege_type,routine_name||':'||grantee||':'||privilege_type,encode(extensions.digest(routine_name||':'||grantee||':'||privilege_type,'sha256'),'hex') from information_schema.routine_privileges where specific_schema='public' and routine_name in('update_affiliate_program_master','update_affiliate_program_operational');
update _m030_recovery.control set state='SEALED';
commit;
select jsonb_build_object('result','M030_PRE_APPLY_SNAPSHOT_CREATED','program_rows',(select count(*) from _m030_recovery.program_rows),'draft_rows',(select count(*) from _m030_recovery.draft_rows),'metadata_rows',(select count(*) from _m030_recovery.security_metadata),'browser_privileges',(select count(*) from information_schema.table_privileges where table_schema='_m030_recovery' and grantee in('anon','authenticated','service_role'))) verification;
