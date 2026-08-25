select jsonb_build_object(
 'result',case when to_regclass('public.affiliate_strategies') is not null and count(*)=4 then 'M031_READ_ONLY_VERIFICATION_PASS' else 'FAIL' end,
 'tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='affiliate_strategies'),
 'force_rls',(select relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='affiliate_strategies'),
 'functions',count(*),
 'browser_direct_dml',(select count(*) from information_schema.role_table_grants where table_schema='public' and table_name='affiliate_strategies' and grantee in('anon','authenticated') and privilege_type in('INSERT','UPDATE','DELETE')),
 'paid_ai_jpy',0,'external_execution','LOCKED') verification
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in('prepare_affiliate_strategy','review_affiliate_strategy','confirm_affiliate_strategy','archive_affiliate_strategy');
