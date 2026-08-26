begin;
select pg_advisory_xact_lock(hashtextextended('kevirio:m033:affiliate-write-contract',0));
do $preflight$
begin
  if current_database() is null then raise exception 'm033_database_identity_missing'; end if;
  if to_regclass('public.affiliate_program_master') is null then raise exception 'm033_affiliate_program_master_missing'; end if;
  if to_regprocedure('public.save_affiliate_program_master_link(uuid,uuid,text,text)') is null then raise exception 'm033_m025_rpc_missing'; end if;
  if to_regprocedure('public.save_affiliate_program_master_link(uuid,uuid,text,text,timestamp with time zone,bigint)') is not null then raise exception 'm033_already_or_partially_applied'; end if;
  if not exists(select 1 from pg_constraint where conrelid='public.affiliate_program_master'::regclass and conname='affiliate_program_master_url_check' and pg_get_constraintdef(oid) like '%{1,1990}%') then raise exception 'm033_unexpected_url_contract'; end if;
end $preflight$;
create schema if not exists _m033_recovery;
revoke all on schema _m033_recovery from public,anon,authenticated;
drop table if exists _m033_recovery.contract_snapshot;
create table _m033_recovery.contract_snapshot as
select clock_timestamp() captured_at,current_database() database_name,
  (select pg_get_constraintdef(oid) from pg_constraint where conrelid='public.affiliate_program_master'::regclass and conname='affiliate_program_master_url_check') constraint_definition,
  pg_get_functiondef('public.save_affiliate_program_master_link(uuid,uuid,text,text)'::regprocedure) legacy_function_definition,
  (select proacl from pg_proc where oid='public.save_affiliate_program_master_link(uuid,uuid,text,text)'::regprocedure) legacy_acl;
revoke all on all tables in schema _m033_recovery from public,anon,authenticated;
commit;
select jsonb_build_object('result','M033_PRE_APPLY_SNAPSHOT_PASS','snapshot_rows',(select count(*) from _m033_recovery.contract_snapshot),'business_rows_copied',0,'browser_privileges',(select count(*) from information_schema.role_table_grants where table_schema='_m033_recovery' and grantee in('anon','authenticated'))) verification;
