-- KEVIRIO M028_FULL_OPERATIONAL_COMPLETION
-- OWNER REVIEW REQUIRED. DO NOT APPLY WITHOUT SEPARATE PRODUCTION APPROVAL.
begin;

do $$
begin
  if to_regclass('public.account_personal_workspaces') is null
    or to_regclass('public.ai_memory_records') is null
    or to_regclass('public.ai_conversation_threads') is null
    or to_regclass('public.affiliate_program_master') is null
    or to_regprocedure('public.resolve_personal_workspace()') is null
  then raise exception 'm028_foundation_missing'; end if;
  if to_regclass('public.operational_objects') is not null
    or to_regclass('public.operational_object_drafts') is not null
    or to_regclass('public.operational_object_links') is not null
    or to_regclass('public.operational_activity_events') is not null
    or to_regclass('public.research_sources') is not null
    or to_regclass('public.research_findings') is not null
    or to_regclass('public.internal_action_records') is not null
    or to_regclass('public.provider_free_quota_states') is not null
    or exists(select 1 from information_schema.columns where table_schema='public' and table_name='ai_memory_records' and column_name in('pinned_at','owner_visibility','owner_archived_at'))
    or to_regprocedure('public.m028_safe_json(jsonb,integer)') is not null
    or to_regprocedure('public.m028_safe_text(text,integer)') is not null
    or to_regprocedure('public.m028_reference_exists(text,uuid,uuid,uuid)') is not null
    or to_regprocedure('public.save_operational_object(uuid,text,text,text,text,text,timestamp with time zone,jsonb,text,bigint)') is not null
    or to_regprocedure('public.link_operational_objects(text,uuid,text,uuid,text,jsonb)') is not null
  then raise exception 'm028_partial_state_detected'; end if;
end $$;

alter table public.ai_memory_records
  add column pinned_at timestamptz,
  add column owner_visibility text not null default 'PRIVATE' check(owner_visibility='PRIVATE'),
  add column owner_archived_at timestamptz;

create table public.operational_objects(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  -- M028 owns only object classes without an existing canonical table. Existing
  -- domain objects are referenced through the guarded link resolver below.
  object_type text not null check(object_type in('RESEARCH_PACKAGE','QUICK_CAPTURE')),
  title text not null check(length(btrim(title)) between 1 and 300),
  summary text check(summary is null or length(summary)<=4000),
  state text not null check(state~'^[A-Z][A-Z0-9_]{1,63}$'),
  attention_state text check(attention_state is null or attention_state in(
    'DUE','OVERDUE','NEEDS_ATTENTION','BLOCKED','FOLLOW_UP','OPPORTUNITY','WAITING','READY'
  )),
  due_at timestamptz,
  details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object' and length(details::text)<=50000),
  truth_class text not null default 'OWNER_STATED' check(truth_class in(
    'OWNER_STATED','KEVIRIO_FACT','CONNECTED_DATA','WEB_SOURCE','AI_INFERENCE','AI_RECOMMENDATION'
  )),
  lifecycle_status text not null default 'ACTIVE' check(lifecycle_status in('DRAFT','ACTIVE','COMPLETED','ARCHIVED')),
  version bigint not null default 1 check(version>0),
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  constraint operational_objects_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  constraint operational_objects_archive_consistency check((lifecycle_status='ARCHIVED')=(archived_at is not null)),
  unique(id,workspace_id,owner_user_id)
);

create table public.operational_object_drafts(
  object_id uuid primary key,
  workspace_id uuid not null,
  owner_user_id uuid not null,
  base_object_version bigint not null check(base_object_version>0),
  draft_payload jsonb not null check(jsonb_typeof(draft_payload)='object' and length(draft_payload::text)<=50000),
  draft_version bigint not null default 1 check(draft_version>0),
  device_hint text check(device_hint is null or length(device_hint)<=80),
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint operational_drafts_object_fk foreign key(object_id,workspace_id,owner_user_id)
    references public.operational_objects(id,workspace_id,owner_user_id) on delete cascade
);

create table public.operational_object_links(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  from_type text not null check(from_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  from_id uuid not null,
  to_type text not null check(to_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  to_id uuid not null,
  relation_type text not null check(relation_type in(
    'RELATES_TO','SUPPORTS','DERIVED_FROM','CREATED_FOR','RESULTED_IN','BLOCKS','IMPLEMENTS','MEASURES'
  )),
  provenance jsonb not null check(jsonb_typeof(provenance)='object' and provenance<>'{}'::jsonb),
  created_at timestamptz not null default clock_timestamp(),
  constraint operational_links_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  constraint operational_links_no_self check(from_type<>to_type or from_id<>to_id),
  unique(owner_user_id,from_type,from_id,to_type,to_id,relation_type)
);

create table public.operational_activity_events(
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  owner_user_id uuid not null,
  object_type text not null check(object_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  object_id uuid not null,
  event_type text not null check(event_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  actor_type text not null check(actor_type in('OWNER','MEMBER','AI_RUNTIME','SYSTEM')),
  actor_id text not null check(length(actor_id) between 1 and 120),
  truth_class text not null check(truth_class in('OWNER_STATED','KEVIRIO_FACT','CONNECTED_DATA','WEB_SOURCE','AI_INFERENCE','AI_RECOMMENDATION','SYSTEM_METADATA')),
  safe_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(safe_metadata)='object' and length(safe_metadata::text)<=12000),
  idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'),
  created_at timestamptz not null default clock_timestamp(),
  constraint operational_events_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  unique(owner_user_id,idempotency_key)
);

create table public.research_sources(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  canonical_url text not null check(length(canonical_url) between 9 and 2000 and canonical_url~'^https://[^[:space:]]+$'),
  source_name text not null check(length(btrim(source_name)) between 1 and 300),
  source_domain text not null check(source_domain~'^[a-z0-9.-]{1,253}$'),
  country_code text check(country_code is null or country_code~'^[A-Z]{2}$'),
  region text check(region is null or length(region)<=120),
  source_type text not null check(source_type in('OFFICIAL_GOVERNMENT','OFFICIAL_COMPANY','PROVIDER_OFFICIAL','NEWS','MARKETPLACE','PUBLIC_SOCIAL','PUBLIC_COMMUNITY','SEARCH_SIGNAL','OTHER_WEB')),
  reliability_class text not null check(reliability_class in('PRIMARY','HIGH','MEDIUM','LOW','UNKNOWN')),
  cost_class text not null check(cost_class in('FREE_CONFIRMED','FREE_LIMITED','PAID','UNKNOWN')),
  limitations text check(limitations is null or length(limitations)<=2000),
  last_success_at timestamptz,
  last_failure_code text check(last_failure_code is null or last_failure_code~'^[A-Z][A-Z0-9_]{1,63}$'),
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint research_sources_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  unique(owner_user_id,canonical_url),
  unique(id,workspace_id,owner_user_id)
);

create table public.research_findings(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  source_id uuid not null,
  research_domain text not null check(research_domain in('GLOBAL','MARKET','TREND','COMPETITOR','OPPORTUNITY','AFFILIATE','CONTENT','WORK','REGULATION')),
  market text check(market is null or length(market)<=200),
  country_code text check(country_code is null or country_code~'^[A-Z]{2}$'),
  language_code text check(language_code is null or language_code~'^[a-z]{2,3}(-[A-Z]{2})?$'),
  observed_at timestamptz not null,
  retrieved_at timestamptz not null default clock_timestamp(),
  freshness_expires_at timestamptz,
  statement text not null check(length(btrim(statement)) between 1 and 8000),
  truth_class text not null check(truth_class in('WEB_SOURCE','CONNECTED_DATA','AI_INFERENCE','AI_RECOMMENDATION')),
  confidence numeric(4,3) check(confidence is null or confidence between 0 and 1),
  content_sha256 text not null check(content_sha256~'^[0-9a-f]{64}$'),
  provenance jsonb not null check(jsonb_typeof(provenance)='object' and provenance<>'{}'::jsonb),
  status text not null default 'ACTIVE' check(status in('ACTIVE','SUPERSEDED','RETRACTED','ARCHIVED')),
  supersedes_id uuid,
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  constraint research_findings_source_fk foreign key(source_id,workspace_id,owner_user_id)
    references public.research_sources(id,workspace_id,owner_user_id) on delete restrict,
  constraint research_findings_supersedes_fk foreign key(supersedes_id)
    references public.research_findings(id) on delete restrict,
  check(supersedes_id is null or supersedes_id<>id),
  unique(owner_user_id,source_id,content_sha256),
  unique(id,workspace_id,owner_user_id)
);

alter table public.research_findings drop constraint research_findings_supersedes_fk;
alter table public.research_findings add constraint research_findings_supersedes_fk
  foreign key(supersedes_id,workspace_id,owner_user_id)
  references public.research_findings(id,workspace_id,owner_user_id) on delete restrict;

create table public.internal_action_records(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  employee_id text not null check(length(employee_id) between 1 and 80),
  initiating_user_id uuid not null,
  target_type text not null check(target_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  target_id uuid,
  action_type text not null check(action_type~'^[A-Z][A-Z0-9_]{1,63}$'),
  autonomy_level text not null check(autonomy_level in('L0_READ','L1_THINK','L2_PREPARE')),
  risk_class text not null check(risk_class in('LOW','MEDIUM','HIGH')),
  policy_approval text not null check(policy_approval in('AUTO_LOW_RISK','OWNER_POLICY_REQUIRED','PER_ACTION_REQUIRED')),
  idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'),
  payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object' and length(payload::text)<=50000),
  status text not null default 'PREPARED' check(status in('PREPARED','RUNNING','COMPLETED','FAILED','BLOCKED','ARCHIVED')),
  result_summary text check(result_summary is null or length(result_summary)<=8000),
  result_truth_class text check(result_truth_class is null or result_truth_class in('KEVIRIO_FACT','OWNER_MEMORY','CONNECTED_DATA','WEB_SOURCE','AI_INFERENCE','AI_RECOMMENDATION')),
  paid_cost_jpy numeric(12,4) not null default 0 check(paid_cost_jpy=0),
  external_execution boolean not null default false check(external_execution=false),
  version bigint not null default 1 check(version>0),
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint internal_actions_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  unique(owner_user_id,idempotency_key)
);

create table public.provider_free_quota_states(
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  owner_user_id uuid not null,
  provider text not null check(provider~'^[a-z0-9_-]{1,40}$'),
  model_or_action text not null check(length(model_or_action) between 1 and 120),
  cost_class text not null check(cost_class in('FREE_CONFIRMED','FREE_LIMITED','PAID','UNKNOWN')),
  quota_state text not null check(quota_state in('AVAILABLE','LIMITED','EXHAUSTED','UNKNOWN','BLOCKED')),
  rate_limit_state text not null check(rate_limit_state in('OK','LIMITED','BLOCKED','UNKNOWN')),
  requests_used bigint check(requests_used is null or requests_used>=0),
  requests_limit bigint check(requests_limit is null or requests_limit>=0),
  resets_at timestamptz,
  last_error_code text check(last_error_code is null or last_error_code~'^[A-Z][A-Z0-9_]{1,63}$'),
  fallback_state text not null check(fallback_state in('FREE_AVAILABLE','DETERMINISTIC_AVAILABLE','UNAVAILABLE')),
  paid_fallback boolean not null default false check(paid_fallback=false),
  external_execution boolean not null default false check(external_execution=false),
  checked_at timestamptz not null default clock_timestamp(),
  valid_until timestamptz not null,
  audit_metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_metadata)='object'),
  constraint provider_quota_personal_workspace_fk foreign key(owner_user_id,workspace_id)
    references public.account_personal_workspaces(user_id,workspace_id) on delete restrict,
  unique(owner_user_id,provider,model_or_action),
  check(valid_until>checked_at)
);

create index operational_objects_attention_idx on public.operational_objects(owner_user_id,lifecycle_status,attention_state,due_at);
create index operational_objects_type_updated_idx on public.operational_objects(owner_user_id,object_type,updated_at desc);
create index operational_links_from_idx on public.operational_object_links(owner_user_id,from_type,from_id);
create index operational_links_to_idx on public.operational_object_links(owner_user_id,to_type,to_id);
create index operational_activity_object_idx on public.operational_activity_events(owner_user_id,object_type,object_id,created_at desc);
create index research_sources_domain_idx on public.research_sources(owner_user_id,source_domain,source_type,updated_at desc);
create index research_findings_retrieval_idx on public.research_findings(owner_user_id,research_domain,country_code,status,retrieved_at desc);
create index internal_actions_status_idx on public.internal_action_records(owner_user_id,status,risk_class,updated_at desc);
create index provider_quota_health_idx on public.provider_free_quota_states(owner_user_id,cost_class,quota_state,checked_at desc);
create index ai_memory_owner_pinned_idx on public.ai_memory_records(owner_user_id,status,pinned_at desc nulls last,updated_at desc);

alter table public.operational_objects enable row level security;
alter table public.operational_object_drafts enable row level security;
alter table public.operational_object_links enable row level security;
alter table public.operational_activity_events enable row level security;
alter table public.research_sources enable row level security;
alter table public.research_findings enable row level security;
alter table public.internal_action_records enable row level security;
alter table public.provider_free_quota_states enable row level security;
alter table public.operational_objects force row level security;
alter table public.operational_object_drafts force row level security;
alter table public.operational_object_links force row level security;
alter table public.operational_activity_events force row level security;
alter table public.research_sources force row level security;
alter table public.research_findings force row level security;
alter table public.internal_action_records force row level security;
alter table public.provider_free_quota_states force row level security;

create policy operational_objects_self_read on public.operational_objects for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy operational_drafts_self_read on public.operational_object_drafts for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy operational_links_self_read on public.operational_object_links for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy operational_activity_self_read on public.operational_activity_events for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy research_sources_self_read on public.research_sources for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy research_findings_self_read on public.research_findings for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy internal_actions_self_read on public.internal_action_records for select to authenticated
  using(owner_user_id=auth.uid() and initiating_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy provider_quota_owner_read on public.provider_free_quota_states for select to authenticated
  using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());

revoke all on table public.operational_objects,public.operational_object_drafts,public.operational_object_links,
  public.operational_activity_events,public.research_sources,public.research_findings,
  public.internal_action_records,public.provider_free_quota_states from public,anon,authenticated;
grant select on table public.operational_objects,public.operational_object_drafts,public.operational_object_links,
  public.operational_activity_events,public.research_sources,public.research_findings,
  public.internal_action_records,public.provider_free_quota_states to authenticated;
grant select,insert,update,delete on table public.operational_objects,public.operational_object_drafts,
  public.operational_object_links,public.research_sources,public.research_findings,
  public.internal_action_records,public.provider_free_quota_states to service_role;
grant select,insert on table public.operational_activity_events to service_role;

create function public.m028_safe_json(p_value jsonb,p_max integer) returns jsonb language plpgsql immutable set search_path='' as $$
begin
  if jsonb_typeof(coalesce(p_value,'{}'))<>'object' or length(coalesce(p_value,'{}')::text)>p_max
    or coalesce(p_value,'{}')::text~*'(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|bearer[[:space:]]+[a-z0-9._-]+|password|passphrase|client[_ -]?secret|service[_ -]?role|private[_ -]?key|begin[[:space:]]+(rsa[[:space:]]+)?private[[:space:]]+key|eyj[a-z0-9_-]+[.][a-z0-9_-]+[.][a-z0-9_-]+)'
  then raise exception 'unsafe_or_invalid_json'; end if; return coalesce(p_value,'{}');
end $$;

create function public.m028_safe_text(p_value text,p_max integer) returns text language plpgsql immutable set search_path='' as $$
declare v text:=btrim(p_value);
begin
  if v is null or length(v)>p_max or v~*'(api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization|bearer[[:space:]]+|password[[:space:]]*[=:]|passphrase|client[_ -]?secret|service[_ -]?role|private[_ -]?key|begin[[:space:]]+(rsa[[:space:]]+)?private[[:space:]]+key)'
  then raise exception 'unsafe_or_invalid_text'; end if;
  return v;
end $$;

create function public.m028_reference_exists(p_type text,p_id uuid,p_owner uuid,p_workspace uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
  if p_id is null or p_owner is null or p_workspace is null or not exists(
    select 1 from public.account_personal_workspaces where user_id=p_owner and workspace_id=p_workspace
  ) then return false; end if;
  case p_type
    when 'GOAL' then return exists(select 1 from public.campaigns where id=p_id and workspace_id=p_workspace and status not in('closed','cancelled'));
    when 'STRATEGY' then return exists(select 1 from public.owner_decisions where id=p_id and workspace_id=p_workspace and decided_by=p_owner and is_active);
    when 'WORK' then return exists(select 1 from public.tasks where id=p_id and workspace_id=p_workspace and status<>'cancelled');
    when 'APPLICATION' then return exists(select 1 from public.opportunities where id=p_id and workspace_id=p_workspace and created_by=p_owner and status not in('rejected','expired'));
    when 'CLIENT' then return exists(select 1 from public.clients where id=p_id and workspace_id=p_workspace and status<>'archived');
    when 'CONTENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='CONTENT' and lifecycle_status not in('ARCHIVED','DELETED'));
    when 'SNS_ITEM' then return exists(select 1 from public.content_assets where id=p_id and workspace_id=p_workspace and asset_type in('sns_post','thread','short_video_script','long_video_script') and status<>'archived');
    when 'KNOWLEDGE' then return exists(select 1 from public.business_memory_records where id=p_id and workspace_id=p_workspace and deletion_status='active');
    when 'IMPROVEMENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='FEEDBACK' and lifecycle_status not in('ARCHIVED','DELETED'));
    when 'GLOBAL_OPPORTUNITY' then return exists(select 1 from public.research_findings where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and research_domain='OPPORTUNITY' and status='ACTIVE');
    when 'RESEARCH_PACKAGE' then return exists(select 1 from public.operational_objects where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and object_type='RESEARCH_PACKAGE' and lifecycle_status<>'ARCHIVED');
    when 'QUICK_CAPTURE' then return exists(select 1 from public.operational_objects where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and object_type='QUICK_CAPTURE' and lifecycle_status<>'ARCHIVED');
    when 'AI_THREAD' then return exists(select 1 from public.ai_conversation_threads where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and status<>'ARCHIVED');
    when 'AFFILIATE_PROGRAM' then return exists(select 1 from public.affiliate_program_master where id=p_id and workspace_id=p_workspace and program_status<>'EXPIRED');
    else return false;
  end case;
end $$;

create function public.save_operational_object(p_object_id uuid,p_object_type text,p_title text,p_summary text,p_state text,p_attention_state text,p_due_at timestamptz,p_details jsonb,p_truth_class text,p_expected_version bigint default null)
returns table(object_id uuid,object_version bigint) language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;v_version bigint;v_title text:=public.m028_safe_text(p_title,300);
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'authentication_required';end if;
  if p_object_id is null then
    insert into public.operational_objects(workspace_id,owner_user_id,object_type,title,summary,state,attention_state,due_at,details,truth_class)
    values(v_workspace,v_actor,p_object_type,v_title,case when nullif(btrim(p_summary),'') is null then null else public.m028_safe_text(p_summary,4000) end,p_state,p_attention_state,p_due_at,public.m028_safe_json(p_details,50000),p_truth_class)
    returning id,version into v_id,v_version;
  else
    update public.operational_objects set title=v_title,summary=case when nullif(btrim(p_summary),'') is null then null else public.m028_safe_text(p_summary,4000) end,state=p_state,attention_state=p_attention_state,due_at=p_due_at,
      details=public.m028_safe_json(p_details,50000),truth_class=p_truth_class,version=version+1,updated_at=clock_timestamp()
    where id=p_object_id and owner_user_id=v_actor and workspace_id=v_workspace and lifecycle_status<>'ARCHIVED' and version=p_expected_version
    returning id,version into v_id,v_version;
    if v_id is null then raise exception 'operational_object_stale_or_not_found';end if;
  end if;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(v_workspace,v_actor,p_object_type,v_id,case when p_object_id is null then 'CREATED' else 'EDITED' end,'OWNER',v_actor::text,'OWNER_STATED',jsonb_build_object('version',v_version,'external_execution','LOCKED','paid_ai_jpy',0),
    concat('object:',v_id,':v',v_version,':save')) on conflict(owner_user_id,idempotency_key) do nothing;
  return query select v_id,v_version;
end $$;

create function public.save_operational_draft(p_object_id uuid,p_expected_draft_version bigint,p_base_object_version bigint,p_payload jsonb,p_device_hint text default null)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_version bigint;v_type text;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'authentication_required';end if;
  insert into public.operational_object_drafts(object_id,workspace_id,owner_user_id,base_object_version,draft_payload,device_hint)
  select o.id,v_workspace,v_actor,p_base_object_version,public.m028_safe_json(p_payload,50000),nullif(btrim(p_device_hint),'') from public.operational_objects o
    where o.id=p_object_id and o.owner_user_id=v_actor and o.workspace_id=v_workspace and o.version=p_base_object_version and o.lifecycle_status<>'ARCHIVED'
  on conflict(object_id) do update set base_object_version=excluded.base_object_version,draft_payload=excluded.draft_payload,device_hint=excluded.device_hint,draft_version=public.operational_object_drafts.draft_version+1,updated_at=clock_timestamp()
    where public.operational_object_drafts.owner_user_id=v_actor and public.operational_object_drafts.workspace_id=v_workspace and public.operational_object_drafts.draft_version=p_expected_draft_version
  returning draft_version into v_version;
  if v_version is null then raise exception 'operational_draft_stale_or_not_found';end if;
  select object_type into v_type from public.operational_objects where id=p_object_id and owner_user_id=v_actor and workspace_id=v_workspace;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(v_workspace,v_actor,v_type,p_object_id,'DRAFT_SAVED','OWNER',v_actor::text,'SYSTEM_METADATA',
    jsonb_build_object('draft_version',v_version,'base_object_version',p_base_object_version),concat('draft:',p_object_id,':v',v_version))
  on conflict(owner_user_id,idempotency_key) do nothing;
  return v_version;
end $$;

create function public.archive_operational_object(p_object_id uuid,p_expected_version bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_version bigint;v_type text;
begin
  update public.operational_objects set lifecycle_status='ARCHIVED',archived_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp()
  where id=p_object_id and owner_user_id=v_actor and workspace_id=v_workspace and lifecycle_status<>'ARCHIVED' and version=p_expected_version returning version,object_type into v_version,v_type;
  if v_version is null then raise exception 'operational_object_stale_or_not_found';end if;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,idempotency_key)
  values(v_workspace,v_actor,v_type,p_object_id,'ARCHIVED','OWNER',v_actor::text,'OWNER_STATED',concat('object:',p_object_id,':v',v_version,':archive'))
  on conflict(owner_user_id,idempotency_key) do nothing;return v_version;
end $$;

create function public.link_operational_objects(p_from_type text,p_from_id uuid,p_to_type text,p_to_id uuid,p_relation_type text,p_provenance jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null or jsonb_typeof(p_provenance)<>'object' or p_provenance='{}' then raise exception 'operational_link_invalid';end if;
  if not public.m028_reference_exists(p_from_type,p_from_id,v_actor,v_workspace) then raise exception 'operational_link_source_denied';end if;
  if not public.m028_reference_exists(p_to_type,p_to_id,v_actor,v_workspace) then raise exception 'operational_link_target_denied';end if;
  insert into public.operational_object_links(workspace_id,owner_user_id,from_type,from_id,to_type,to_id,relation_type,provenance)
  values(v_workspace,v_actor,p_from_type,p_from_id,p_to_type,p_to_id,p_relation_type,public.m028_safe_json(p_provenance,12000))
  on conflict(owner_user_id,from_type,from_id,to_type,to_id,relation_type) do update set provenance=excluded.provenance returning id into v_id;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(v_workspace,v_actor,p_from_type,p_from_id,'LINKED','OWNER',v_actor::text,'OWNER_STATED',
    jsonb_build_object('link_id',v_id,'to_type',p_to_type,'relation_type',p_relation_type),concat('link:',v_id,':created'))
  on conflict(owner_user_id,idempotency_key) do nothing;
  return v_id;
end $$;

create function public.prepare_internal_action(p_employee_id text,p_target_type text,p_target_id uuid,p_action_type text,p_autonomy_level text,p_risk_class text,p_policy_approval text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;v_key text:=p_payload->>'idempotency_key';
begin
  if auth.role()<>'authenticated' or v_actor is null or p_autonomy_level not in('L0_READ','L1_THINK','L2_PREPARE') or p_risk_class='HIGH'
    or (p_risk_class='LOW' and p_policy_approval<>'AUTO_LOW_RISK') or (p_risk_class='MEDIUM' and p_policy_approval<>'OWNER_POLICY_REQUIRED')
  then raise exception 'internal_action_policy_denied';end if;
  if v_key is null or v_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'internal_action_idempotency_required';end if;
  if p_target_id is not null and not public.m028_reference_exists(p_target_type,p_target_id,v_actor,v_workspace) then raise exception 'internal_action_target_denied';end if;
  insert into public.internal_action_records(workspace_id,owner_user_id,employee_id,initiating_user_id,target_type,target_id,action_type,autonomy_level,risk_class,policy_approval,idempotency_key,payload)
  values(v_workspace,v_actor,public.m028_safe_text(p_employee_id,80),v_actor,p_target_type,p_target_id,p_action_type,p_autonomy_level,p_risk_class,p_policy_approval,v_key,public.m028_safe_json(p_payload,50000))
  on conflict(owner_user_id,idempotency_key) do update set updated_at=public.internal_action_records.updated_at returning id into v_id;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(v_workspace,v_actor,p_target_type,coalesce(p_target_id,v_id),'INTERNAL_ACTION_PREPARED','AI_RUNTIME',p_employee_id,'AI_RECOMMENDATION',jsonb_build_object('action_id',v_id,'autonomy_level',p_autonomy_level),concat('action:',v_id,':prepared'))
  on conflict(owner_user_id,idempotency_key) do nothing;
  return v_id;
end $$;

create function public.complete_internal_action(p_action_id uuid,p_expected_version bigint,p_success boolean,p_result_summary text,p_truth_class text)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_version bigint;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required';end if;
  update public.internal_action_records set status=case when p_success then 'COMPLETED' else 'FAILED' end,result_summary=public.m028_safe_text(p_result_summary,8000),result_truth_class=p_truth_class,version=version+1,updated_at=clock_timestamp()
  where id=p_action_id and status in('PREPARED','RUNNING') and version=p_expected_version returning version into v_version;
  if v_version is null then raise exception 'internal_action_stale_or_not_found';end if;return v_version;
end $$;

create function public.register_research_source(p_owner_user_id uuid,p_canonical_url text,p_source_name text,p_source_domain text,p_country_code text,p_region text,p_source_type text,p_reliability_class text,p_cost_class text,p_limitations text,p_audit_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_workspace uuid;v_id uuid;
begin
  if auth.role()<>'service_role' or p_cost_class in('PAID','UNKNOWN') then raise exception 'research_source_cost_denied';end if;
  select workspace_id into v_workspace from public.account_personal_workspaces where user_id=p_owner_user_id;if not found then raise exception 'personal_workspace_required';end if;
  insert into public.research_sources(workspace_id,owner_user_id,canonical_url,source_name,source_domain,country_code,region,source_type,reliability_class,cost_class,limitations,audit_metadata)
  values(v_workspace,p_owner_user_id,p_canonical_url,public.m028_safe_text(p_source_name,300),lower(btrim(p_source_domain)),p_country_code,nullif(btrim(p_region),''),p_source_type,p_reliability_class,p_cost_class,case when nullif(btrim(p_limitations),'') is null then null else public.m028_safe_text(p_limitations,2000) end,public.m028_safe_json(p_audit_metadata,12000))
  on conflict(owner_user_id,canonical_url) do update set source_name=excluded.source_name,source_domain=excluded.source_domain,country_code=excluded.country_code,region=excluded.region,source_type=excluded.source_type,reliability_class=excluded.reliability_class,cost_class=excluded.cost_class,limitations=excluded.limitations,audit_metadata=excluded.audit_metadata,updated_at=clock_timestamp()
  returning id into v_id;return v_id;
end $$;

create function public.upsert_provider_free_quota_state(p_owner_user_id uuid,p_provider text,p_model_or_action text,p_cost_class text,p_quota_state text,p_rate_limit_state text,p_requests_used bigint,p_requests_limit bigint,p_resets_at timestamptz,p_last_error_code text,p_fallback_state text,p_audit_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_workspace uuid;v_id uuid;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required';end if;
  select workspace_id into v_workspace from public.account_personal_workspaces where user_id=p_owner_user_id;if not found then raise exception 'personal_workspace_required';end if;
  insert into public.provider_free_quota_states(workspace_id,owner_user_id,provider,model_or_action,cost_class,quota_state,rate_limit_state,requests_used,requests_limit,resets_at,last_error_code,fallback_state,checked_at,valid_until,audit_metadata)
  values(v_workspace,p_owner_user_id,lower(btrim(p_provider)),public.m028_safe_text(p_model_or_action,120),p_cost_class,p_quota_state,p_rate_limit_state,p_requests_used,p_requests_limit,p_resets_at,p_last_error_code,p_fallback_state,clock_timestamp(),
    least(coalesce(p_resets_at,clock_timestamp()+case when p_cost_class='FREE_LIMITED' then interval '15 minutes' else interval '24 hours' end),clock_timestamp()+case when p_cost_class='FREE_LIMITED' then interval '15 minutes' else interval '24 hours' end),public.m028_safe_json(p_audit_metadata,12000))
  on conflict(owner_user_id,provider,model_or_action) do update set cost_class=excluded.cost_class,quota_state=excluded.quota_state,rate_limit_state=excluded.rate_limit_state,requests_used=excluded.requests_used,requests_limit=excluded.requests_limit,resets_at=excluded.resets_at,last_error_code=excluded.last_error_code,fallback_state=excluded.fallback_state,checked_at=excluded.checked_at,valid_until=excluded.valid_until,audit_metadata=excluded.audit_metadata
  returning id into v_id;return v_id;
end $$;

create function public.record_research_finding(p_owner_user_id uuid,p_source_id uuid,p_domain text,p_market text,p_country_code text,p_language_code text,p_observed_at timestamptz,p_freshness_expires_at timestamptz,p_statement text,p_truth_class text,p_confidence numeric,p_provenance jsonb,p_supersedes_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_workspace uuid;v_id uuid;v_text text:=public.m028_safe_text(p_statement,8000);v_hash text;
begin
  if auth.role()<>'service_role' then raise exception 'service_role_required';end if;
  select workspace_id into v_workspace from public.account_personal_workspaces where user_id=p_owner_user_id;
  if not found then raise exception 'personal_workspace_required';end if;v_hash:=encode(extensions.digest(v_text,'sha256'),'hex');
  if p_truth_class not in('WEB_SOURCE','CONNECTED_DATA','AI_INFERENCE','AI_RECOMMENDATION') or jsonb_typeof(p_provenance)<>'object' or p_provenance='{}' then raise exception 'research_provenance_required';end if;
  if p_supersedes_id is not null then update public.research_findings set status='SUPERSEDED' where id=p_supersedes_id and owner_user_id=p_owner_user_id and workspace_id=v_workspace and status='ACTIVE';if not found then raise exception 'research_supersession_invalid';end if;end if;
  insert into public.research_findings(workspace_id,owner_user_id,source_id,research_domain,market,country_code,language_code,observed_at,freshness_expires_at,statement,truth_class,confidence,content_sha256,provenance,supersedes_id)
  values(v_workspace,p_owner_user_id,p_source_id,p_domain,nullif(btrim(p_market),''),p_country_code,p_language_code,p_observed_at,p_freshness_expires_at,v_text,p_truth_class,p_confidence,v_hash,public.m028_safe_json(p_provenance,12000),p_supersedes_id)
  on conflict(owner_user_id,source_id,content_sha256) do update set retrieved_at=public.research_findings.retrieved_at returning id into v_id;
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(v_workspace,p_owner_user_id,'RESEARCH_FINDING',v_id,'RESEARCH_RECORDED','AI_RUNTIME','research_runtime',p_truth_class,jsonb_build_object('domain',p_domain,'source_id',p_source_id),concat('finding:',v_id,':recorded'))
  on conflict(owner_user_id,idempotency_key) do nothing;
  return v_id;
end $$;

create function public.set_ai_memory_owner_state(p_memory_id uuid,p_expected_version bigint,p_pinned boolean,p_archived boolean)
returns bigint language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_version bigint;
begin
  update public.ai_memory_records set pinned_at=case when p_pinned then coalesce(pinned_at,clock_timestamp()) else null end,owner_archived_at=case when p_archived then coalesce(owner_archived_at,clock_timestamp()) else null end,version=version+1,updated_at=clock_timestamp()
  where id=p_memory_id and owner_user_id=v_actor and workspace_id=v_workspace and version=p_expected_version returning version into v_version;
  if v_version is null then raise exception 'memory_stale_or_not_found';end if;return v_version;
end $$;

revoke all on function public.m028_safe_json(jsonb,integer) from public,anon,authenticated;
revoke all on function public.m028_safe_text(text,integer) from public,anon,authenticated,service_role;
revoke all on function public.m028_reference_exists(text,uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.save_operational_object(uuid,text,text,text,text,text,timestamptz,jsonb,text,bigint) from public,anon;
revoke all on function public.save_operational_draft(uuid,bigint,bigint,jsonb,text) from public,anon;
revoke all on function public.archive_operational_object(uuid,bigint) from public,anon;
revoke all on function public.link_operational_objects(text,uuid,text,uuid,text,jsonb) from public,anon;
revoke all on function public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb) from public,anon;
revoke all on function public.complete_internal_action(uuid,bigint,boolean,text,text) from public,anon,authenticated;
revoke all on function public.register_research_source(uuid,text,text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.upsert_provider_free_quota_state(uuid,text,text,text,text,text,bigint,bigint,timestamptz,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.record_research_finding(uuid,uuid,text,text,text,text,timestamptz,timestamptz,text,text,numeric,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.set_ai_memory_owner_state(uuid,bigint,boolean,boolean) from public,anon;
grant execute on function public.save_operational_object(uuid,text,text,text,text,text,timestamptz,jsonb,text,bigint),public.save_operational_draft(uuid,bigint,bigint,jsonb,text),public.archive_operational_object(uuid,bigint),public.link_operational_objects(text,uuid,text,uuid,text,jsonb),public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb),public.set_ai_memory_owner_state(uuid,bigint,boolean,boolean) to authenticated;
grant execute on function public.complete_internal_action(uuid,bigint,boolean,text,text),public.register_research_source(uuid,text,text,text,text,text,text,text,text,text,jsonb),public.upsert_provider_free_quota_state(uuid,text,text,text,text,text,bigint,bigint,timestamptz,text,text,jsonb),public.record_research_finding(uuid,uuid,text,text,text,text,timestamptz,timestamptz,text,text,numeric,jsonb,uuid) to service_role;

alter function public.m028_safe_json(jsonb,integer) owner to postgres;
alter function public.m028_safe_text(text,integer) owner to postgres;
alter function public.m028_reference_exists(text,uuid,uuid,uuid) owner to postgres;
alter function public.save_operational_object(uuid,text,text,text,text,text,timestamptz,jsonb,text,bigint) owner to postgres;
alter function public.save_operational_draft(uuid,bigint,bigint,jsonb,text) owner to postgres;
alter function public.archive_operational_object(uuid,bigint) owner to postgres;
alter function public.link_operational_objects(text,uuid,text,uuid,text,jsonb) owner to postgres;
alter function public.prepare_internal_action(text,text,uuid,text,text,text,text,jsonb) owner to postgres;
alter function public.complete_internal_action(uuid,bigint,boolean,text,text) owner to postgres;
alter function public.register_research_source(uuid,text,text,text,text,text,text,text,text,text,jsonb) owner to postgres;
alter function public.upsert_provider_free_quota_state(uuid,text,text,text,text,text,bigint,bigint,timestamptz,text,text,jsonb) owner to postgres;
alter function public.record_research_finding(uuid,uuid,text,text,text,text,timestamptz,timestamptz,text,text,numeric,jsonb,uuid) owner to postgres;
alter function public.set_ai_memory_owner_state(uuid,bigint,boolean,boolean) owner to postgres;

commit;
