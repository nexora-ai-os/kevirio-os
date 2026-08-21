-- Reimport a verified post-use export after M028 has been reapplied.
begin;
do $$ begin
  if to_regnamespace('m028_postuse_recovery') is null or to_regclass('public.operational_objects') is null
  then raise exception 'm028_reimport_prerequisite_missing'; end if;
  if exists(select 1 from public.operational_objects) or exists(select 1 from public.research_sources)
  then raise exception 'm028_reimport_target_not_empty'; end if;
end $$;

insert into public.operational_objects select * from m028_postuse_recovery.operational_objects;
insert into public.operational_object_drafts select * from m028_postuse_recovery.operational_object_drafts;
insert into public.research_sources select * from m028_postuse_recovery.research_sources;
insert into public.research_findings select * from m028_postuse_recovery.research_findings;
insert into public.operational_object_links select * from m028_postuse_recovery.operational_object_links;
insert into public.internal_action_records select * from m028_postuse_recovery.internal_action_records;
insert into public.provider_free_quota_states select * from m028_postuse_recovery.provider_free_quota_states;
insert into public.operational_activity_events overriding system value select * from m028_postuse_recovery.operational_activity_events;
select setval(pg_get_serial_sequence('public.operational_activity_events','id'),
  greatest(coalesce((select max(id) from public.operational_activity_events),1),1),true);
update public.ai_memory_records m set pinned_at=r.pinned_at,owner_visibility=r.owner_visibility,
  owner_archived_at=r.owner_archived_at,version=greatest(m.version,r.version),updated_at=clock_timestamp()
from m028_postuse_recovery.memory_owner_state r where m.id=r.id;
commit;

select case when
  (select count(*) from public.operational_objects)=(select operational_objects from m028_postuse_recovery.manifest)
  and (select count(*) from public.operational_activity_events)=(select operational_activity_events from m028_postuse_recovery.manifest)
  and (select count(*) from public.research_findings)=(select research_findings from m028_postuse_recovery.manifest)
then 'M028_REIMPORT_PASS' else 'M028_REIMPORT_FAIL' end as result;
