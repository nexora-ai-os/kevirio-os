do $$ declare bad int;begin
 select count(*) into bad from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('m032_owner_cycle_context','m032_audit_cycle_change','save_affiliate_cycle_publication','record_affiliate_cycle_performance','create_affiliate_revenue_candidate','attach_affiliate_revenue_evidence','confirm_affiliate_actual_revenue','enforce_m032_revenue_record_origin','enforce_m032_actual_revenue_snapshot') and not(coalesce(p.proconfig,'{}')@>array['search_path=""']);
 if bad<>0 then raise exception 'm032_unsafe_search_path:%',bad;end if;
 if not exists(select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='pgcrypto' and n.nspname='extensions') then raise exception 'm032_pgcrypto_namespace_incompatible';end if;
end $$;
select jsonb_build_object('result','M032_NAMESPACE_COMPATIBILITY_PASS','safe_search_path',9,'extension_schema','extensions','paid_ai_jpy',0) verification;
