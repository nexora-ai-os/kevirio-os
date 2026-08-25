begin;
do $$ begin if to_regclass('public.affiliate_program_master') is null or to_regclass('public.revenue_records') is null or to_regclass('public.affiliate_strategies') is null then raise exception 'm032_baseline_missing';end if;if to_regclass('public.affiliate_revenue_candidates') is not null then raise exception 'm032_already_applied';end if;end $$;
create schema if not exists _m032_recovery authorization postgres;
revoke all on schema _m032_recovery from public,anon,authenticated,service_role;
create table _m032_recovery.revenue_contract as select column_name,is_nullable,data_type from information_schema.columns where table_schema='public' and table_name='revenue_records' and column_name in('brand_id','campaign_id','evidence_candidate_id') order by column_name;
create table _m032_recovery.revenue_trigger as select pg_get_triggerdef(oid) definition from pg_trigger where tgrelid='public.revenue_records'::regclass and tgname='revenue_records_workspace_integrity' and not tgisinternal;
revoke all on all tables in schema _m032_recovery from public,anon,authenticated,service_role;
commit;
select jsonb_build_object('result','M032_SNAPSHOT_PASS','columns',(select count(*) from _m032_recovery.revenue_contract),'triggers',(select count(*) from _m032_recovery.revenue_trigger),'browser_privileges',(select count(*) from information_schema.role_table_grants where table_schema='_m032_recovery' and grantee in('anon','authenticated'))) verification;
