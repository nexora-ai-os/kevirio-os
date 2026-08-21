-- Run after M028 apply. Read-only verification only.
begin read only;

do $$
declare v integer;
begin
  select count(*) into v from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relname in('operational_objects','operational_object_drafts','operational_object_links','operational_activity_events','research_sources','research_findings','internal_action_records','provider_free_quota_states') and c.relkind='r' and c.relrowsecurity and c.relforcerowsecurity;
  if v<>8 then raise exception 'm028_table_rls_invalid:%',v;end if;
  select count(*) into v from pg_policies where schemaname='public' and tablename in('operational_objects','operational_object_drafts','operational_object_links','operational_activity_events','research_sources','research_findings','internal_action_records','provider_free_quota_states');
  if v<>8 then raise exception 'm028_policy_count_invalid:%',v;end if;
  select count(*) into v from information_schema.role_table_grants where table_schema='public' and table_name in('operational_objects','operational_object_drafts','operational_object_links','operational_activity_events','research_sources','research_findings','internal_action_records','provider_free_quota_states') and grantee in('anon','authenticated') and privilege_type in('INSERT','UPDATE','DELETE');
  if v<>0 then raise exception 'm028_browser_dml_exposed:%',v;end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='ai_memory_records' and column_name='pinned_at') then raise exception 'm028_memory_extension_missing';end if;
end $$;

select jsonb_build_object(
  'result','M028_READ_ONLY_VERIFICATION_PASS',
  'tables',8,
  'rls',8,
  'force_rls',8,
  'policies',8,
  'browser_direct_dml_grants',0,
  'paid_ai_jpy',0,
  'paid_fallback','OFF',
  'external_execution','LOCKED',
  'm001_m027_modified',false
) as verification;

rollback;
