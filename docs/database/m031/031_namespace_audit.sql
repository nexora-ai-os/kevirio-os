select jsonb_build_object(
 'result',case when count(*)=5 and count(*) filter(where p.proconfig @> array['search_path=""'])=5 then 'M031_NAMESPACE_COMPATIBILITY_PASS' else 'FAIL' end,
 'functions',count(*),'safe_search_path',count(*) filter(where p.proconfig @> array['search_path=""'])) verification
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in('m031_strategy_payload','prepare_affiliate_strategy','review_affiliate_strategy','confirm_affiliate_strategy','archive_affiliate_strategy');
