-- Post-use recovery export. Run before rollback after M028 has accepted data.
-- This freezes M028 writes and preserves only M028-owned data in a locked schema.
begin;

do $$ begin
  if to_regclass('public.operational_objects') is null then raise exception 'm028_not_active'; end if;
  if to_regnamespace('m028_postuse_recovery') is not null then raise exception 'm028_postuse_recovery_exists'; end if;
end $$;

revoke execute on function public.save_operational_object(uuid,text,text,text,text,text,timestamptz,jsonb,text,bigint),
  public.save_operational_draft(uuid,bigint,bigint,jsonb,text),public.archive_operational_object(uuid,bigint),
  public.link_operational_objects(text,uuid,text,uuid,text,jsonb),
  public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb),
  public.set_ai_memory_owner_state(uuid,bigint,boolean,boolean) from authenticated;
revoke execute on function public.complete_internal_action(uuid,bigint,boolean,text,text),
  public.register_research_source(uuid,text,text,text,text,text,text,text,text,text,jsonb),
  public.upsert_provider_free_quota_state(uuid,text,text,text,text,text,bigint,bigint,timestamptz,text,text,jsonb),
  public.record_research_finding(uuid,uuid,text,text,text,text,timestamptz,timestamptz,text,text,numeric,jsonb,uuid) from service_role;

create schema m028_postuse_recovery authorization postgres;
revoke all on schema m028_postuse_recovery from public,anon,authenticated,service_role;

create table m028_postuse_recovery.operational_objects as table public.operational_objects;
create table m028_postuse_recovery.operational_object_drafts as table public.operational_object_drafts;
create table m028_postuse_recovery.operational_object_links as table public.operational_object_links;
create table m028_postuse_recovery.operational_activity_events as table public.operational_activity_events;
create table m028_postuse_recovery.research_sources as table public.research_sources;
create table m028_postuse_recovery.research_findings as table public.research_findings;
create table m028_postuse_recovery.internal_action_records as table public.internal_action_records;
create table m028_postuse_recovery.provider_free_quota_states as table public.provider_free_quota_states;
create table m028_postuse_recovery.memory_owner_state as
  select id,pinned_at,owner_visibility,owner_archived_at,version from public.ai_memory_records
  where pinned_at is not null or owner_archived_at is not null;

create table m028_postuse_recovery.manifest as
select clock_timestamp() as captured_at,
  (select count(*) from public.operational_objects) as operational_objects,
  (select count(*) from public.operational_object_drafts) as operational_object_drafts,
  (select count(*) from public.operational_object_links) as operational_object_links,
  (select count(*) from public.operational_activity_events) as operational_activity_events,
  (select count(*) from public.research_sources) as research_sources,
  (select count(*) from public.research_findings) as research_findings,
  (select count(*) from public.internal_action_records) as internal_action_records,
  (select count(*) from public.provider_free_quota_states) as provider_free_quota_states,
  (select count(*) from m028_postuse_recovery.memory_owner_state) as memory_owner_state;

revoke all on all tables in schema m028_postuse_recovery from public,anon,authenticated,service_role;
commit;

select 'M028_POSTUSE_EXPORT_PASS' as result,* from m028_postuse_recovery.manifest;
