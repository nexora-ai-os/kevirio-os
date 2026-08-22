-- E. Reapply M029 using this complete, single transaction.
begin;

-- M029: additive canonical mutation foundation. M001-M028 remain byte-stable.
-- All cryptographic calls are explicitly schema-qualified for Production compatibility.

alter table public.clients add column if not exists version bigint not null default 1 check(version>0);
alter table public.clients add column if not exists data_owner_id uuid references auth.users(id);
alter table public.clients add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));
do $backfill$ declare w record;begin for w in select id,owner_id from public.workspaces loop perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',w.owner_id::text,true);update public.clients set data_owner_id=w.owner_id where workspace_id=w.id and data_owner_id is null;end loop;end; $backfill$;
alter table public.clients alter column data_owner_id set not null;

alter table public.opportunities add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));

alter table public.owner_decisions add column if not exists version bigint not null default 1 check(version>0);
alter table public.owner_decisions add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));

alter table public.campaigns add column if not exists data_owner_id uuid references auth.users(id);
alter table public.campaigns add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));
do $backfill$ declare w record;begin for w in select id,owner_id from public.workspaces loop perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',w.owner_id::text,true);update public.campaigns set data_owner_id=w.owner_id where workspace_id=w.id and data_owner_id is null;end loop;end; $backfill$;
alter table public.campaigns alter column data_owner_id set not null;

alter table public.tasks add column if not exists version bigint not null default 1 check(version>0);
alter table public.tasks add column if not exists data_owner_id uuid references auth.users(id);
alter table public.tasks add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));
do $backfill$ declare w record;begin for w in select id,owner_id from public.workspaces loop perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',w.owner_id::text,true);update public.tasks set data_owner_id=w.owner_id where workspace_id=w.id and data_owner_id is null;end loop;end; $backfill$;
alter table public.tasks alter column data_owner_id set not null;

alter table public.content_assets add column if not exists data_owner_id uuid references auth.users(id);
alter table public.content_assets add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));
do $backfill$ declare w record;begin for w in select id,owner_id from public.workspaces loop perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',w.owner_id::text,true);update public.content_assets set data_owner_id=w.owner_id where workspace_id=w.id and data_owner_id is null;end loop;end; $backfill$;
alter table public.content_assets alter column data_owner_id set not null;

alter table public.business_memory_records add column if not exists version bigint not null default 1 check(version>0);
alter table public.business_memory_records add column if not exists data_owner_id uuid references auth.users(id);
alter table public.business_memory_records add column if not exists visibility text not null default 'PRIVATE' check(visibility in('PRIVATE','EXPLICIT_SHARED','TEAM'));
do $backfill$ declare w record;begin for w in select id,owner_id from public.workspaces loop perform set_config('request.jwt.claim.role','authenticated',true);perform set_config('request.jwt.claim.sub',w.owner_id::text,true);update public.business_memory_records set data_owner_id=w.owner_id where workspace_id=w.id and data_owner_id is null;end loop;end; $backfill$;
alter table public.business_memory_records alter column data_owner_id set not null;

alter table public.personal_operational_records add column if not exists version bigint not null default 1 check(version>0);

create table public.canonical_domain_drafts(
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  owner_user_id uuid not null references auth.users(id),
  object_type text not null check(object_type in('GOAL','STRATEGY','WORK','APPLICATION','CLIENT','CONTENT','SNS_ITEM','KNOWLEDGE','IMPROVEMENT')),
  object_id uuid not null,
  base_object_version bigint not null check(base_object_version>0),
  draft_version bigint not null default 1 check(draft_version>0),
  payload jsonb not null default '{}'::jsonb,
  device_hint text check(device_hint is null or length(device_hint)<=120),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(owner_user_id,object_type,object_id)
);

create table public.canonical_domain_conversions(
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  owner_user_id uuid not null references auth.users(id),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  conversion_type text not null,
  idempotency_key text not null check(idempotency_key~'^[A-Za-z0-9:_-]{8,180}$'),
  provenance jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique(owner_user_id,idempotency_key),
  unique(owner_user_id,source_type,source_id,target_type,conversion_type)
);

create index canonical_drafts_resume_idx on public.canonical_domain_drafts(owner_user_id,object_type,updated_at desc);
create index canonical_conversions_source_idx on public.canonical_domain_conversions(owner_user_id,source_type,source_id);
create index clients_owner_updated_idx on public.clients(data_owner_id,status,updated_at desc);
create index campaigns_owner_updated_idx on public.campaigns(data_owner_id,status,updated_at desc);
create index tasks_owner_due_idx on public.tasks(data_owner_id,status,due_at);
create index content_assets_owner_updated_idx on public.content_assets(data_owner_id,status,updated_at desc);
create index memory_owner_updated_idx on public.business_memory_records(data_owner_id,deletion_status,updated_at desc);

alter table public.canonical_domain_drafts enable row level security;
alter table public.canonical_domain_drafts force row level security;
alter table public.canonical_domain_conversions enable row level security;
alter table public.canonical_domain_conversions force row level security;
create policy canonical_drafts_self_read on public.canonical_domain_drafts for select to authenticated using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
create policy canonical_conversions_self_read on public.canonical_domain_conversions for select to authenticated using(owner_user_id=auth.uid() and workspace_id=public.resolve_personal_workspace());
revoke all on public.canonical_domain_drafts,public.canonical_domain_conversions from public,anon,authenticated;
grant select on public.canonical_domain_drafts,public.canonical_domain_conversions to authenticated;
grant all on public.canonical_domain_drafts,public.canonical_domain_conversions to service_role;

-- Existing broad owner-workspace policies cannot remain permissive because Owner/admin
-- status must not reveal another principal's PRIVATE canonical row.
drop policy if exists clients_member_all on public.clients;
drop policy if exists opportunities_member_all on public.opportunities;
drop policy if exists owner_decisions_member_all on public.owner_decisions;
drop policy if exists campaigns_member_all on public.campaigns;
drop policy if exists tasks_member_all on public.tasks;
drop policy if exists business_memory_member_all on public.business_memory_records;
drop policy if exists company_owner_read on public.content_assets;
alter table public.clients force row level security;
alter table public.opportunities force row level security;
alter table public.owner_decisions force row level security;
alter table public.campaigns force row level security;
alter table public.tasks force row level security;
alter table public.content_assets force row level security;
alter table public.business_memory_records force row level security;
create policy clients_private_read on public.clients for select to authenticated using(data_owner_id=auth.uid());
create policy opportunities_private_read on public.opportunities for select to authenticated using(created_by=auth.uid());
create policy owner_decisions_private_read on public.owner_decisions for select to authenticated using(decided_by=auth.uid());
create policy campaigns_private_read on public.campaigns for select to authenticated using(data_owner_id=auth.uid());
create policy tasks_private_read on public.tasks for select to authenticated using(data_owner_id=auth.uid());
create policy content_assets_private_read on public.content_assets for select to authenticated using(data_owner_id=auth.uid());
create policy business_memory_private_read on public.business_memory_records for select to authenticated using(data_owner_id=auth.uid());
revoke all privileges on table public.clients,public.opportunities,public.owner_decisions,public.campaigns,public.tasks,public.content_assets,public.business_memory_records from public,anon,authenticated;
grant select on table public.clients,public.opportunities,public.owner_decisions,public.campaigns,public.tasks,public.content_assets,public.business_memory_records to authenticated;

create function public.m029_owned_reference_exists(p_type text,p_id uuid,p_owner uuid,p_workspace uuid)
returns boolean as $m029_owned$
begin
  if p_owner is null or p_workspace is null or p_id is null then return false; end if;
  case p_type
    when 'GOAL' then return exists(select 1 from public.campaigns where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status not in('closed','cancelled'));
    when 'STRATEGY' then return exists(select 1 from public.owner_decisions where id=p_id and workspace_id=p_workspace and decided_by=p_owner and is_active);
    when 'WORK' then return exists(select 1 from public.tasks where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'cancelled');
    when 'APPLICATION' then return exists(select 1 from public.opportunities where id=p_id and workspace_id=p_workspace and created_by=p_owner and status not in('rejected','expired'));
    when 'CLIENT' then return exists(select 1 from public.clients where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'archived');
    when 'CONTENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='CONTENT' and lifecycle_status<>'ARCHIVED');
    when 'SNS_ITEM' then return exists(select 1 from public.content_assets where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'archived');
    when 'KNOWLEDGE' then return exists(select 1 from public.business_memory_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and deletion_status='active');
    when 'IMPROVEMENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='FEEDBACK' and lifecycle_status<>'ARCHIVED');
    else return public.m028_reference_exists(p_type,p_id,p_owner,p_workspace);
  end case;
end;
$m029_owned$ language plpgsql stable security definer set search_path='';

create or replace function public.m028_reference_exists(p_type text,p_id uuid,p_owner uuid,p_workspace uuid)
returns boolean as $m029_resolver$
begin
  if p_id is null or p_owner is null or p_workspace is null or not exists(select 1 from public.account_personal_workspaces where user_id=p_owner and workspace_id=p_workspace) then return false;end if;
  case p_type
    when 'GOAL' then return exists(select 1 from public.campaigns where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status not in('closed','cancelled'));
    when 'STRATEGY' then return exists(select 1 from public.owner_decisions where id=p_id and workspace_id=p_workspace and decided_by=p_owner and is_active);
    when 'WORK' then return exists(select 1 from public.tasks where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'cancelled');
    when 'APPLICATION' then return exists(select 1 from public.opportunities where id=p_id and workspace_id=p_workspace and created_by=p_owner and status not in('rejected','expired'));
    when 'CLIENT' then return exists(select 1 from public.clients where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'archived');
    when 'CONTENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='CONTENT' and lifecycle_status<>'ARCHIVED');
    when 'SNS_ITEM' then return exists(select 1 from public.content_assets where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and status<>'archived');
    when 'KNOWLEDGE' then return exists(select 1 from public.business_memory_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and deletion_status='active');
    when 'IMPROVEMENT' then return exists(select 1 from public.personal_operational_records where id=p_id and workspace_id=p_workspace and data_owner_id=p_owner and record_type='FEEDBACK' and lifecycle_status<>'ARCHIVED');
    when 'GLOBAL_OPPORTUNITY' then return exists(select 1 from public.research_findings where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and research_domain='OPPORTUNITY' and status='ACTIVE');
    when 'RESEARCH_PACKAGE' then return exists(select 1 from public.operational_objects where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and object_type='RESEARCH_PACKAGE' and lifecycle_status<>'ARCHIVED');
    when 'QUICK_CAPTURE' then return exists(select 1 from public.operational_objects where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and object_type='QUICK_CAPTURE' and lifecycle_status<>'ARCHIVED');
    when 'AI_THREAD' then return exists(select 1 from public.ai_conversation_threads where id=p_id and workspace_id=p_workspace and owner_user_id=p_owner and status<>'ARCHIVED');
    when 'AFFILIATE_PROGRAM' then return exists(select 1 from public.affiliate_program_master where id=p_id and workspace_id=p_workspace and program_status<>'EXPIRED');
    else return false;
  end case;
end;
$m029_resolver$ language plpgsql stable security definer set search_path='';

create function public.m029_append_event(p_workspace uuid,p_owner uuid,p_type text,p_id uuid,p_event text,p_version bigint,p_key text,p_metadata jsonb default '{}'::jsonb)
returns void as $m029_event$
begin
  insert into public.operational_activity_events(workspace_id,owner_user_id,object_type,object_id,event_type,actor_type,actor_id,truth_class,safe_metadata,idempotency_key)
  values(p_workspace,p_owner,p_type,p_id,p_event,'OWNER',p_owner::text,'OWNER_STATED',public.m028_safe_json(coalesce(p_metadata,'{}')||jsonb_build_object('version',p_version,'external_execution','LOCKED','paid_ai_jpy',0),12000),p_key)
  on conflict(owner_user_id,idempotency_key) do nothing;
end;
$m029_event$ language plpgsql security definer set search_path='';

create function public.save_personal_operational_record_v2(p_record_id uuid,p_record_type text,p_title text,p_payload jsonb,p_lifecycle_status text,p_expected_version bigint default null,p_idempotency_key text default null)
returns table(object_id uuid,object_version bigint) as $m029_personal$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;v_version bigint;v_event text;v_hash text;v_prior record;
begin
  if auth.role()<>'authenticated' or v_actor is null or p_record_type not in('CONTENT','OPPORTUNITY','FEEDBACK','REVENUE_CANDIDATE','RETROSPECTIVE') or p_lifecycle_status not in('DRAFT','ACTIVE','ARCHIVED') then raise exception 'm029_personal_record_invalid';end if;
  if p_idempotency_key is null or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'm029_idempotency_required';end if;
  v_hash:=encode(extensions.digest(concat_ws('|',p_record_type,coalesce(p_record_id::text,'CREATE'),coalesce(p_expected_version::text,''),p_title,p_lifecycle_status,p_payload::text),'sha256'),'hex');
  select e.object_id,(e.safe_metadata->>'version')::bigint version,e.safe_metadata->>'request_sha256' request_sha256 into v_prior from public.operational_activity_events e where e.owner_user_id=v_actor and e.idempotency_key=p_idempotency_key;
  if found then if v_prior.request_sha256<>v_hash then raise exception 'm029_idempotency_payload_mismatch';end if;return query select v_prior.object_id,v_prior.version;return;end if;
  if p_record_type='REVENUE_CANDIDATE' and (coalesce(p_payload->>'truth_state','') not in('FORECAST','UNKNOWN') or p_payload ?| array['actual','actual_amount_minor']) then raise exception 'm029_revenue_truth_denied';end if;
  if p_record_id is null then
    insert into public.personal_operational_records(workspace_id,data_owner_id,record_type,title,payload,lifecycle_status)
    values(v_workspace,v_actor,p_record_type,left(public.m028_safe_text(p_title,240),240),public.m028_safe_json(p_payload,50000),p_lifecycle_status)
    returning id,version into v_id,v_version;v_event:='CREATED';
  else
    update public.personal_operational_records set title=left(public.m028_safe_text(p_title,240),240),payload=public.m028_safe_json(p_payload,50000),lifecycle_status=p_lifecycle_status,version=version+1,updated_at=clock_timestamp()
    where id=p_record_id and workspace_id=v_workspace and data_owner_id=v_actor and record_type=p_record_type and version=p_expected_version
    returning id,version into v_id,v_version;
    if v_id is null then raise exception 'm029_stale_or_not_found';end if;v_event:=case when p_lifecycle_status='ARCHIVED' then 'ARCHIVED' else 'EDITED' end;
  end if;
  perform public.m029_append_event(v_workspace,v_actor,case p_record_type when 'OPPORTUNITY' then 'APPLICATION' when 'FEEDBACK' then 'IMPROVEMENT' else p_record_type end,v_id,v_event,v_version,p_idempotency_key,jsonb_build_object('request_sha256',v_hash));
  return query select v_id,v_version;
end;
$m029_personal$ language plpgsql security definer set search_path='';

create function public.save_canonical_domain_draft(p_type text,p_id uuid,p_expected_draft_version bigint,p_base_object_version bigint,p_payload jsonb,p_device_hint text default null)
returns bigint as $m029_draft$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_version bigint;
begin
  if auth.role()<>'authenticated' or not public.m029_owned_reference_exists(p_type,p_id,v_actor,v_workspace) then raise exception 'm029_draft_target_denied';end if;
  select draft_version into v_version from public.canonical_domain_drafts where owner_user_id=v_actor and workspace_id=v_workspace and object_type=p_type and object_id=p_id and base_object_version=p_base_object_version and payload=p_payload and coalesce(device_hint,'')=coalesce(nullif(left(btrim(p_device_hint),120),''),'');
  if found then return v_version;end if;
  insert into public.canonical_domain_drafts(workspace_id,owner_user_id,object_type,object_id,base_object_version,payload,device_hint)
  values(v_workspace,v_actor,p_type,p_id,p_base_object_version,public.m028_safe_json(p_payload,50000),nullif(left(btrim(p_device_hint),120),''))
  on conflict(owner_user_id,object_type,object_id) do update set base_object_version=excluded.base_object_version,payload=excluded.payload,device_hint=excluded.device_hint,draft_version=public.canonical_domain_drafts.draft_version+1,updated_at=clock_timestamp()
  where public.canonical_domain_drafts.workspace_id=v_workspace and public.canonical_domain_drafts.draft_version=p_expected_draft_version
  returning draft_version into v_version;
  if v_version is null then raise exception 'm029_draft_stale_or_not_found';end if;
  perform public.m029_append_event(v_workspace,v_actor,p_type,p_id,'DRAFT_SAVED',p_base_object_version,concat('m029:draft:',p_type,':',p_id,':v',v_version),jsonb_build_object('draft_version',v_version,'base_object_version',p_base_object_version));
  return v_version;
end;
$m029_draft$ language plpgsql security definer set search_path='';

create function public.save_canonical_domain_object(p_type text,p_id uuid,p_expected_version bigint,p_payload jsonb,p_idempotency_key text)
returns table(object_id uuid,object_version bigint) as $m029_object$
declare
  v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;v_version bigint;v_event text;v_hash text;v_prior record;
  v_brand uuid;v_opportunity uuid;v_campaign uuid;v_client uuid;v_market uuid;v_engine uuid;
begin
  if auth.role()<>'authenticated' or v_actor is null or p_idempotency_key is null or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'm029_mutation_denied';end if;
  perform public.m028_safe_json(p_payload,50000);
  v_hash:=encode(extensions.digest(concat_ws('|',p_type,coalesce(p_id::text,'CREATE'),coalesce(p_expected_version::text,''),p_payload::text),'sha256'),'hex');
  select e.object_id,(e.safe_metadata->>'version')::bigint version,e.safe_metadata->>'request_sha256' request_sha256 into v_prior from public.operational_activity_events e where e.owner_user_id=v_actor and e.idempotency_key=p_idempotency_key;
  if found then if v_prior.request_sha256<>v_hash then raise exception 'm029_idempotency_payload_mismatch';end if;return query select v_prior.object_id,v_prior.version;return;end if;
  if p_payload ?| array['actual','actual_amount_minor','evidence_verified','external_execution_allowed','paid_ai','paid_cost'] then raise exception 'm029_truth_or_execution_denied';end if;

  case p_type
    when 'CLIENT' then
      if p_id is null then
        insert into public.clients(workspace_id,display_name,status,confidentiality_level,metadata,business_context,data_owner_id,visibility)
        values(v_workspace,public.m028_safe_text(p_payload->>'display_name',300),coalesce(p_payload->>'status','active'),coalesce(p_payload->>'confidentiality_level','customer_confidential'),coalesce(p_payload->'metadata','{}'),coalesce(p_payload->'business_context','{}'),v_actor,'PRIVATE')
        returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.clients set display_name=public.m028_safe_text(p_payload->>'display_name',300),status=coalesce(p_payload->>'status',status),confidentiality_level=coalesce(p_payload->>'confidentiality_level',confidentiality_level),metadata=coalesce(p_payload->'metadata',metadata),business_context=coalesce(p_payload->'business_context',business_context),version=version+1,updated_at=clock_timestamp()
        where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning id,version into v_id,v_version;v_event:='EDITED';
      end if;

    when 'APPLICATION' then
      v_brand:=nullif(p_payload->>'brand_id','')::uuid;v_client:=nullif(p_payload->>'client_id','')::uuid;
      if not exists(select 1 from public.brand_profiles where id=v_brand and workspace_id=v_workspace) or (v_client is not null and not public.m029_owned_reference_exists('CLIENT',v_client,v_actor,v_workspace)) then raise exception 'm029_application_reference_denied';end if;
      if p_id is null then
        insert into public.opportunities(workspace_id,brand_id,client_id,source_signal_id,title,summary,lane,status,score_snapshot,confidence_snapshot,risk_snapshot,provenance,freshness_at,expires_at,created_by,visibility)
        values(v_workspace,v_brand,v_client,nullif(p_payload->>'source_signal_id',''),public.m028_safe_text(p_payload->>'title',300),public.m028_safe_text(p_payload->>'summary',4000),p_payload->>'lane',coalesce(p_payload->>'status','discovered'),coalesce(p_payload->'score_snapshot','{}'),coalesce(p_payload->'confidence_snapshot','{}'),coalesce(p_payload->'risk_snapshot','{}'),public.m028_safe_json(coalesce(p_payload->'provenance','{}'),12000),nullif(p_payload->>'freshness_at','')::timestamptz,nullif(p_payload->>'expires_at','')::timestamptz,v_actor,'PRIVATE')
        returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.opportunities set client_id=v_client,title=public.m028_safe_text(p_payload->>'title',300),summary=public.m028_safe_text(p_payload->>'summary',4000),lane=coalesce(p_payload->>'lane',lane),status=coalesce(p_payload->>'status',status),score_snapshot=coalesce(p_payload->'score_snapshot',score_snapshot),confidence_snapshot=coalesce(p_payload->'confidence_snapshot',confidence_snapshot),risk_snapshot=coalesce(p_payload->'risk_snapshot',risk_snapshot),provenance=coalesce(p_payload->'provenance',provenance),freshness_at=coalesce(nullif(p_payload->>'freshness_at','')::timestamptz,freshness_at),expires_at=coalesce(nullif(p_payload->>'expires_at','')::timestamptz,expires_at),version=version+1,updated_at=clock_timestamp()
        where id=p_id and workspace_id=v_workspace and created_by=v_actor and version=p_expected_version returning id,version into v_id,v_version;v_event:='EDITED';
      end if;

    when 'GOAL' then
      v_brand:=nullif(p_payload->>'brand_id','')::uuid;v_client:=nullif(p_payload->>'client_id','')::uuid;v_opportunity:=nullif(p_payload->>'opportunity_id','')::uuid;
      if not public.m029_owned_reference_exists('APPLICATION',v_opportunity,v_actor,v_workspace) or not exists(select 1 from public.brand_profiles where id=v_brand and workspace_id=v_workspace) then raise exception 'm029_goal_reference_denied';end if;
      if p_id is null then
        insert into public.campaigns(workspace_id,brand_id,client_id,opportunity_id,business_mode,lane,status,offer,channel,forecast_currency,forecast_revenue_minor,forecast_cost_minor,external_execution_allowed,data_owner_id,visibility)
        values(v_workspace,v_brand,v_client,v_opportunity,p_payload->>'business_mode',p_payload->>'lane',coalesce(p_payload->>'status','draft'),coalesce(p_payload->'offer','{}'),public.m028_safe_text(p_payload->>'channel',120),nullif(p_payload->>'forecast_currency',''),nullif(p_payload->>'forecast_revenue_minor','')::bigint,nullif(p_payload->>'forecast_cost_minor','')::bigint,false,v_actor,'PRIVATE')
        returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.campaigns set client_id=v_client,status=coalesce(p_payload->>'status',status),offer=coalesce(p_payload->'offer',offer),channel=coalesce(nullif(p_payload->>'channel',''),channel),forecast_currency=case when p_payload ? 'forecast_currency' then nullif(p_payload->>'forecast_currency','') else forecast_currency end,forecast_revenue_minor=case when p_payload ? 'forecast_revenue_minor' then nullif(p_payload->>'forecast_revenue_minor','')::bigint else forecast_revenue_minor end,forecast_cost_minor=case when p_payload ? 'forecast_cost_minor' then nullif(p_payload->>'forecast_cost_minor','')::bigint else forecast_cost_minor end,version=version+1,updated_at=clock_timestamp()
        where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version and external_execution_allowed=false returning id,version into v_id,v_version;v_event:='EDITED';
      end if;

    when 'STRATEGY' then
      v_opportunity:=nullif(p_payload->>'opportunity_id','')::uuid;
      if not public.m029_owned_reference_exists('APPLICATION',v_opportunity,v_actor,v_workspace) then raise exception 'm029_strategy_reference_denied';end if;
      if p_id is null then
        insert into public.owner_decisions(workspace_id,opportunity_id,opportunity_version,decision,reason,decided_by,is_active,visibility)
        select v_workspace,o.id,o.version,p_payload->>'decision',public.m028_safe_text(p_payload->>'reason',4000),v_actor,true,'PRIVATE' from public.opportunities o where o.id=v_opportunity and o.created_by=v_actor and o.workspace_id=v_workspace returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.owner_decisions set decision=coalesce(p_payload->>'decision',decision),reason=coalesce(nullif(p_payload->>'reason',''),reason),version=version+1
        where id=p_id and workspace_id=v_workspace and decided_by=v_actor and is_active and version=p_expected_version returning id,version into v_id,v_version;v_event:='EDITED';
      end if;

    when 'WORK' then
      v_campaign:=nullif(p_payload->>'campaign_id','')::uuid;
      if not public.m029_owned_reference_exists('GOAL',v_campaign,v_actor,v_workspace) then raise exception 'm029_work_reference_denied';end if;
      if p_id is null then
        insert into public.tasks(campaign_id,workspace_id,type,status,assignee_type,assignee_ref,due_at,input_ref,output_ref,data_owner_id,visibility)
        values(v_campaign,v_workspace,public.m028_safe_text(p_payload->>'type',120),coalesce(p_payload->>'status','pending'),coalesce(p_payload->>'assignee_type','owner'),nullif(p_payload->>'assignee_ref',''),nullif(p_payload->>'due_at','')::timestamptz,coalesce(p_payload->'input_ref','{}'),coalesce(p_payload->'output_ref','{}'),v_actor,'PRIVATE') returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.tasks set type=coalesce(nullif(p_payload->>'type',''),type),status=coalesce(p_payload->>'status',status),assignee_type=coalesce(p_payload->>'assignee_type',assignee_type),assignee_ref=case when p_payload ? 'assignee_ref' then nullif(p_payload->>'assignee_ref','') else assignee_ref end,due_at=case when p_payload ? 'due_at' then nullif(p_payload->>'due_at','')::timestamptz else due_at end,input_ref=coalesce(p_payload->'input_ref',input_ref),output_ref=coalesce(p_payload->'output_ref',output_ref),version=version+1,updated_at=clock_timestamp()
        where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning id,version into v_id,v_version;v_event:='EDITED';
      end if;

    when 'KNOWLEDGE' then
      v_brand:=nullif(p_payload->>'brand_id','')::uuid;v_client:=nullif(p_payload->>'client_id','')::uuid;
      if p_id is null then
        insert into public.business_memory_records(workspace_id,brand_id,client_id,record_type,sensitivity_level,provenance,content_json,external_output_allowed,provider_output_allowed,retention_policy,deletion_status,data_owner_id,visibility)
        values(v_workspace,v_brand,v_client,p_payload->>'record_type',p_payload->>'sensitivity_level',public.m028_safe_json(p_payload->'provenance',12000),public.m028_safe_json(p_payload->'content_json',50000),false,false,public.m028_safe_text(p_payload->>'retention_policy',120),'active',v_actor,'PRIVATE') returning id,version into v_id,v_version;v_event:='CREATED';
      else
        update public.business_memory_records set record_type=coalesce(p_payload->>'record_type',record_type),sensitivity_level=coalesce(p_payload->>'sensitivity_level',sensitivity_level),provenance=coalesce(p_payload->'provenance',provenance),content_json=coalesce(p_payload->'content_json',content_json),retention_policy=coalesce(nullif(p_payload->>'retention_policy',''),retention_policy),version=version+1,updated_at=clock_timestamp()
        where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version and deletion_status='active' returning id,version into v_id,v_version;v_event:='EDITED';
      end if;
    else raise exception 'm029_mutation_type_invalid';
  end case;
  if v_id is null then raise exception 'm029_stale_or_not_found';end if;
  perform public.m029_append_event(v_workspace,v_actor,p_type,v_id,v_event,v_version,p_idempotency_key,jsonb_build_object('request_sha256',v_hash));
  return query select v_id,v_version;
end;
$m029_object$ language plpgsql security definer set search_path='';

create function public.archive_canonical_domain_object(p_type text,p_id uuid,p_expected_version bigint,p_idempotency_key text)
returns bigint as $m029_archive$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_version bigint;
begin
  if auth.role()<>'authenticated' or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,180}$' then raise exception 'm029_archive_denied';end if;
  case p_type
    when 'GOAL' then update public.campaigns set status='cancelled',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning version into v_version;
    when 'STRATEGY' then update public.owner_decisions set is_active=false,version=version+1 where id=p_id and workspace_id=v_workspace and decided_by=v_actor and version=p_expected_version returning version into v_version;
    when 'WORK' then update public.tasks set status='cancelled',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning version into v_version;
    when 'APPLICATION' then update public.opportunities set status='expired',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and created_by=v_actor and version=p_expected_version returning version into v_version;
    when 'CLIENT' then update public.clients set status='archived',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning version into v_version;
    when 'SNS_ITEM' then update public.content_assets set status='archived',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning version into v_version;
    when 'KNOWLEDGE' then update public.business_memory_records set deletion_status='deletion_requested',version=version+1,updated_at=clock_timestamp() where id=p_id and workspace_id=v_workspace and data_owner_id=v_actor and version=p_expected_version returning version into v_version;
    else raise exception 'm029_archive_type_invalid';
  end case;
  if v_version is null then raise exception 'm029_stale_or_not_found';end if;
  perform public.m029_append_event(v_workspace,v_actor,p_type,p_id,'ARCHIVED',v_version,p_idempotency_key);
  return v_version;
end;
$m029_archive$ language plpgsql security definer set search_path='';

create function public.link_canonical_domain_objects(p_from_type text,p_from_id uuid,p_to_type text,p_to_id uuid,p_relation_type text,p_provenance jsonb)
returns uuid as $m029_link$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_id uuid;
begin
  if auth.role()<>'authenticated' or p_relation_type not in('RELATES_TO','SUPPORTS','DERIVED_FROM','CREATED_FOR','RESULTED_IN','BLOCKS','IMPLEMENTS','MEASURES') or jsonb_typeof(p_provenance)<>'object' or p_provenance='{}'::jsonb or not public.m029_owned_reference_exists(p_from_type,p_from_id,v_actor,v_workspace) or not public.m029_owned_reference_exists(p_to_type,p_to_id,v_actor,v_workspace) then raise exception 'm029_link_denied';end if;
  insert into public.operational_object_links(workspace_id,owner_user_id,from_type,from_id,to_type,to_id,relation_type,provenance)
  values(v_workspace,v_actor,p_from_type,p_from_id,p_to_type,p_to_id,public.m028_safe_text(p_relation_type,80),public.m028_safe_json(p_provenance,12000))
  on conflict(owner_user_id,from_type,from_id,to_type,to_id,relation_type) do update set provenance=excluded.provenance returning id into v_id;
  perform public.m029_append_event(v_workspace,v_actor,p_from_type,p_from_id,'LINKED',1,concat('m029:link:',v_id),jsonb_build_object('link_id',v_id,'to_type',p_to_type));return v_id;
end;
$m029_link$ language plpgsql security definer set search_path='';

create function public.convert_canonical_domain_object(p_source_type text,p_source_id uuid,p_target_type text,p_payload jsonb,p_idempotency_key text,p_provenance jsonb)
returns uuid as $m029_convert$
declare v_actor uuid:=auth.uid();v_workspace uuid:=public.resolve_personal_workspace();v_target uuid;v_version bigint;v_conversion uuid;v_pair text:=p_source_type||'->'||p_target_type;
begin
  if auth.role()<>'authenticated' or p_idempotency_key!~'^[A-Za-z0-9:_-]{8,170}$' or jsonb_typeof(p_provenance)<>'object' or p_provenance='{}'::jsonb or not public.m029_owned_reference_exists(p_source_type,p_source_id,v_actor,v_workspace) then raise exception 'm029_convert_source_denied';end if;
  select target_id into v_target from public.canonical_domain_conversions where owner_user_id=v_actor and idempotency_key=p_idempotency_key;
  if found then return v_target;end if;
  case v_pair
    when 'QUICK_CAPTURE->CONTENT','AFFILIATE_PROGRAM->CONTENT' then
      select object_id,object_version into v_target,v_version from public.save_personal_operational_record_v2(null,'CONTENT',p_payload->>'title',coalesce(p_payload->'payload','{}'),'DRAFT',null,p_idempotency_key||':target');
    when 'QUICK_CAPTURE->WORK','IMPROVEMENT->WORK','APPLICATION->WORK' then
      select object_id,object_version into v_target,v_version from public.save_canonical_domain_object('WORK',null,null,p_payload,p_idempotency_key||':target');
    when 'APPLICATION->CLIENT' then
      select object_id,object_version into v_target,v_version from public.save_canonical_domain_object('CLIENT',null,null,p_payload,p_idempotency_key||':target');
    when 'GLOBAL_OPPORTUNITY->STRATEGY' then
      select object_id,object_version into v_target,v_version from public.save_canonical_domain_object('STRATEGY',null,null,p_payload,p_idempotency_key||':target');
    else raise exception 'm029_convert_pair_denied';
  end case;
  if not public.m029_owned_reference_exists(p_target_type,v_target,v_actor,v_workspace) then raise exception 'm029_convert_target_invalid';end if;
  insert into public.canonical_domain_conversions(workspace_id,owner_user_id,source_type,source_id,target_type,target_id,conversion_type,idempotency_key,provenance)
  values(v_workspace,v_actor,p_source_type,p_source_id,p_target_type,v_target,v_pair,p_idempotency_key,public.m028_safe_json(p_provenance,12000)) returning id into v_conversion;
  perform public.link_canonical_domain_objects(p_target_type,v_target,p_source_type,p_source_id,'DERIVED_FROM',p_provenance||jsonb_build_object('conversion_id',v_conversion));
  perform public.m029_append_event(v_workspace,v_actor,p_source_type,p_source_id,'CONVERTED',1,concat('m029:conversion:',v_conversion),jsonb_build_object('target_type',p_target_type,'target_id',v_target,'conversion_id',v_conversion));
  return v_target;
end;
$m029_convert$ language plpgsql security definer set search_path='';

revoke all on function public.m029_owned_reference_exists(text,uuid,uuid,uuid),public.m029_append_event(uuid,uuid,text,uuid,text,bigint,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.save_personal_operational_record_v2(uuid,text,text,jsonb,text,bigint,text),public.save_canonical_domain_draft(text,uuid,bigint,bigint,jsonb,text),public.save_canonical_domain_object(text,uuid,bigint,jsonb,text),public.archive_canonical_domain_object(text,uuid,bigint,text),public.link_canonical_domain_objects(text,uuid,text,uuid,text,jsonb),public.convert_canonical_domain_object(text,uuid,text,jsonb,text,jsonb) from public,anon;
grant execute on function public.save_personal_operational_record_v2(uuid,text,text,jsonb,text,bigint,text),public.save_canonical_domain_draft(text,uuid,bigint,bigint,jsonb,text),public.save_canonical_domain_object(text,uuid,bigint,jsonb,text),public.archive_canonical_domain_object(text,uuid,bigint,text),public.link_canonical_domain_objects(text,uuid,text,uuid,text,jsonb),public.convert_canonical_domain_object(text,uuid,text,jsonb,text,jsonb) to authenticated;

alter function public.m029_owned_reference_exists(text,uuid,uuid,uuid) owner to postgres;
alter function public.m029_append_event(uuid,uuid,text,uuid,text,bigint,text,jsonb) owner to postgres;
alter function public.save_personal_operational_record_v2(uuid,text,text,jsonb,text,bigint,text) owner to postgres;
alter function public.save_canonical_domain_draft(text,uuid,bigint,bigint,jsonb,text) owner to postgres;
alter function public.save_canonical_domain_object(text,uuid,bigint,jsonb,text) owner to postgres;
alter function public.archive_canonical_domain_object(text,uuid,bigint,text) owner to postgres;
alter function public.link_canonical_domain_objects(text,uuid,text,uuid,text,jsonb) owner to postgres;
alter function public.convert_canonical_domain_object(text,uuid,text,jsonb,text,jsonb) owner to postgres;

commit;
