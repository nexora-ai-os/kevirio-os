begin read only;
with health as(
 select 'orphan_drafts' check_name,count(*) violations from public.canonical_domain_drafts d where not public.m029_owned_reference_exists(d.object_type,d.object_id,d.owner_user_id,d.workspace_id)
 union all select 'invalid_draft_versions',count(*) from public.canonical_domain_drafts where base_object_version<=0 or draft_version<=0
 union all select 'invalid_links',count(*) from public.operational_object_links l where l.from_type in('GOAL','STRATEGY','WORK','APPLICATION','CLIENT','CONTENT','SNS_ITEM','KNOWLEDGE','IMPROVEMENT') and not public.m029_owned_reference_exists(l.from_type,l.from_id,l.owner_user_id,l.workspace_id)
 union all select 'invalid_conversions',count(*) from public.canonical_domain_conversions c where not public.m029_owned_reference_exists(c.source_type,c.source_id,c.owner_user_id,c.workspace_id) or not public.m029_owned_reference_exists(c.target_type,c.target_id,c.owner_user_id,c.workspace_id)
 union all select 'nonpositive_versions',count(*) from (select version from public.clients union all select version::bigint from public.opportunities union all select version from public.owner_decisions union all select version::bigint from public.campaigns union all select version from public.tasks union all select version::bigint from public.content_assets union all select version from public.business_memory_records union all select version from public.personal_operational_records)x where version<=0
 union all select 'execution_truth_violation',count(*) from public.campaigns where external_execution_allowed
)
select jsonb_build_object('result',case when sum(violations)=0 then 'M029_DATA_HEALTH_PASS' else 'FAIL' end,'checks',jsonb_object_agg(check_name,violations),'total_violations',sum(violations)) verification from health;
rollback;
