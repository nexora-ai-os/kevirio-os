-- Read-only M028 corruption/orphan health check.
begin read only;
do $$ begin
  if exists(select 1 from public.operational_objects where (lifecycle_status='ARCHIVED')<>(archived_at is not null) or version<1) then raise exception 'm028_health_object_state'; end if;
  if exists(select 1 from public.operational_object_drafts d join public.operational_objects o on o.id=d.object_id where d.owner_user_id<>o.owner_user_id or d.workspace_id<>o.workspace_id or d.base_object_version>o.version) then raise exception 'm028_health_draft_version'; end if;
  if exists(select 1 from public.operational_object_links l where not public.m028_reference_exists(l.from_type,l.from_id,l.owner_user_id,l.workspace_id) or not public.m028_reference_exists(l.to_type,l.to_id,l.owner_user_id,l.workspace_id)) then raise exception 'm028_health_orphan_link'; end if;
  if exists(select 1 from public.research_findings f left join public.research_sources s on s.id=f.source_id and s.workspace_id=f.workspace_id and s.owner_user_id=f.owner_user_id where s.id is null) then raise exception 'm028_health_finding_source'; end if;
  if exists(select 1 from public.research_findings f left join public.research_findings p on p.id=f.supersedes_id and p.workspace_id=f.workspace_id and p.owner_user_id=f.owner_user_id where f.supersedes_id is not null and p.id is null) then raise exception 'm028_health_supersession'; end if;
  if exists(select 1 from public.internal_action_records a where a.target_id is not null and not public.m028_reference_exists(a.target_type,a.target_id,a.owner_user_id,a.workspace_id)) then raise exception 'm028_health_action_target'; end if;
  if exists(select 1 from public.provider_free_quota_states where paid_fallback or external_execution or cost_class in('PAID','UNKNOWN') and quota_state='AVAILABLE') then raise exception 'm028_health_quota_truth'; end if;
  if exists(select 1 from public.operational_activity_events group by owner_user_id,idempotency_key having count(*)>1) then raise exception 'm028_health_duplicate_event'; end if;
end $$;
select 'M028_DATA_HEALTH_PASS' as result;
rollback;
