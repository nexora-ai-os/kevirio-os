begin read only;
do $$ begin
 if current_database() is null then raise exception 'm031_identity_unavailable';end if;
 if to_regclass('public.affiliate_program_master') is null or to_regclass('public.research_findings') is null or to_regclass('public.operational_object_links') is null then raise exception 'm031_baseline_missing';end if;
 if to_regclass('public.affiliate_strategies') is not null then raise exception 'm031_already_or_partially_applied';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like '%affiliate_strategy%') then raise exception 'm031_partial_function_state';end if;
end $$;
select jsonb_build_object('result','M031_PREFLIGHT_PASS','m001_m030_mutation',false,'paid_ai_jpy',0,'external_execution','LOCKED') verification;
commit;
