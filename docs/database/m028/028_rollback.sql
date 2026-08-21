-- M028 rollback. Owner approval required. Run only after bounded impact review.
begin;

drop function if exists public.set_ai_memory_owner_state(uuid,bigint,boolean,boolean);
drop function if exists public.record_research_finding(uuid,uuid,text,text,text,text,timestamptz,timestamptz,text,text,numeric,jsonb,uuid);
drop function if exists public.upsert_provider_free_quota_state(uuid,text,text,text,text,text,bigint,bigint,timestamptz,text,text,jsonb);
drop function if exists public.register_research_source(uuid,text,text,text,text,text,text,text,text,text,jsonb);
drop function if exists public.complete_internal_action(uuid,bigint,boolean,text,text);
drop function if exists public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb);
drop function if exists public.link_operational_objects(text,uuid,text,uuid,text,jsonb);
drop function if exists public.archive_operational_object(uuid,bigint);
drop function if exists public.save_operational_draft(uuid,bigint,bigint,jsonb,text);
drop function if exists public.save_operational_object(uuid,text,text,text,text,text,timestamptz,jsonb,text,bigint);
drop function if exists public.m028_safe_json(jsonb,integer);
drop function if exists public.m028_safe_text(text,integer);
drop function if exists public.m028_reference_exists(text,uuid,uuid,uuid);

drop table if exists public.provider_free_quota_states;
drop table if exists public.internal_action_records;
drop table if exists public.research_findings;
drop table if exists public.research_sources;
drop table if exists public.operational_activity_events;
drop table if exists public.operational_object_links;
drop table if exists public.operational_object_drafts;
drop table if exists public.operational_objects;

alter table public.ai_memory_records
  drop column if exists owner_archived_at,
  drop column if exists owner_visibility,
  drop column if exists pinned_at;

commit;
