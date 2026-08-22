begin read only;
with required_tables(name) as(values('canonical_domain_drafts'),('canonical_domain_conversions')),
required_functions(sig) as(values
 ('save_canonical_domain_object(text,uuid,bigint,jsonb,text)'),('save_personal_operational_record_v2(uuid,text,text,jsonb,text,bigint,text)'),
 ('save_canonical_domain_draft(text,uuid,bigint,bigint,jsonb,text)'),('archive_canonical_domain_object(text,uuid,bigint,text)'),
 ('link_canonical_domain_objects(text,uuid,text,uuid,text,jsonb)'),('convert_canonical_domain_object(text,uuid,text,jsonb,text,jsonb)')),
table_check as(select count(*) n from required_tables where to_regclass('public.'||name) is not null),
function_check as(select count(*) n from required_functions where to_regprocedure('public.'||sig) is not null),
direct_dml as(select count(*) n from information_schema.role_table_grants where grantee in('anon','authenticated') and table_schema='public' and table_name in('canonical_domain_drafts','canonical_domain_conversions','clients','opportunities','owner_decisions','campaigns','tasks','content_assets','business_memory_records') and privilege_type in('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER','REFERENCES')),
security as(select count(*) n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('save_canonical_domain_object','save_personal_operational_record_v2','save_canonical_domain_draft','archive_canonical_domain_object','link_canonical_domain_objects','convert_canonical_domain_object') and p.prosecdef and coalesce(array_to_string(p.proconfig,','),'') like '%search_path=""%'),
rls as(select count(*) n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('canonical_domain_drafts','canonical_domain_conversions') and c.relrowsecurity and c.relforcerowsecurity)
select jsonb_build_object('result',case when table_check.n=2 and function_check.n=6 and direct_dml.n=0 and security.n=6 and rls.n=2 then 'M029_READ_ONLY_VERIFICATION_PASS' else 'FAIL' end,'tables',table_check.n,'functions',function_check.n,'browser_direct_dml',direct_dml.n,'secure_functions',security.n,'force_rls',rls.n,'paid_ai_jpy',0,'external_execution','LOCKED') verification
from table_check,function_check,direct_dml,security,rls;
rollback;
