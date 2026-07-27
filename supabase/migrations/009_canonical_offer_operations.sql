begin;

-- Canonical ASP/media operating layer. Existing Revenue, Approval, Evidence and
-- Actual tables remain authoritative; this migration only adds missing stages.
create table if not exists public.affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id),
  title text not null, advertiser text not null, source_url text,
  category text not null, target_markets text[] not null default array['JP','GLOBAL'],
  commission_summary text not null, currency text not null check (currency ~ '^[A-Z]{3}$'),
  commission_minor bigint check (commission_minor is null or commission_minor >= 0),
  terms_summary text not null, disclosure_text text not null,
  source_kind text not null default 'owner_supplied' check (source_kind in ('owner_supplied','provider_import')),
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  idempotency_key text not null, provenance jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,idempotency_key)
);

create table if not exists public.offer_operations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), offer_id uuid not null references public.affiliate_offers(id),
  campaign_id uuid not null unique references public.campaigns(id), artifact_id uuid not null unique references public.artifacts(id),
  approval_request_id uuid not null unique references public.approval_requests(id),
  status text not null default 'owner_artifact_approval' check (status in ('owner_artifact_approval','manual_package_ready','performance_waiting','learning_ready','closed')),
  intelligence_snapshot jsonb not null, audience_snapshot jsonb not null, strategy_snapshot jsonb not null,
  content_snapshot jsonb not null, schedule_snapshot jsonb not null,
  external_execution_allowed boolean not null default false,
  idempotency_key text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,idempotency_key)
);

create table if not exists public.platform_connections (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), provider text not null,
  readiness text not null default 'credentials_missing' check (readiness in ('adapter_unavailable','credentials_missing','authorization_required','permission_missing','configuration_incomplete','dry_run_ready','production_ready','owner_locked','error')),
  external_execution_allowed boolean not null default false, safe_details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), unique(workspace_id,brand_id,provider)
);

create table if not exists public.performance_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid not null references public.campaigns(id), execution_package_id uuid not null references public.execution_packages(id),
  market text not null check (market in ('JP','GLOBAL')), channel text not null,
  period_start date not null, period_end date not null check (period_end >= period_start),
  impressions bigint not null default 0 check (impressions >= 0), clicks bigint not null default 0 check (clicks >= 0),
  conversions bigint not null default 0 check (conversions >= 0),
  source_kind text not null default 'owner_manual' check (source_kind in ('owner_manual','provider_import','test_fixture')),
  source_reference text not null, is_test boolean not null default false,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  unique(workspace_id,source_reference)
);

create table if not exists public.operating_cost_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid not null references public.campaigns(id), category text not null check (category in ('ai_api','content_production','platform','contractor','owner_labor','other')),
  amount_minor bigint not null check (amount_minor >= 0), currency text not null check (currency ~ '^[A-Z]{3}$'),
  value_type text not null check (value_type in ('actual','forecast','test')),
  occurred_at timestamptz not null, source_reference text not null, note text,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  unique(workspace_id,source_reference)
);

create table if not exists public.learning_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), campaign_id uuid not null references public.campaigns(id),
  record_type text not null default 'generated_inference' check (record_type='generated_inference'),
  input_snapshot jsonb not null, learning_snapshot jsonb not null, idempotency_key text not null,
  created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);

create table if not exists public.operation_failures (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid references public.campaigns(id), operation text not null, provider text,
  error_code text not null, retryable boolean not null default false, owner_action text,
  safe_context jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.affiliate_offers enable row level security;
alter table public.offer_operations enable row level security;
alter table public.platform_connections enable row level security;
alter table public.performance_records enable row level security;
alter table public.operating_cost_records enable row level security;
alter table public.learning_records enable row level security;
alter table public.operation_failures enable row level security;

do $$ begin
  create policy affiliate_offers_owner_select on public.affiliate_offers for select to authenticated using (public.is_active_workspace_member(workspace_id));
exception when duplicate_object then null; end $$;
do $$ begin create policy offer_operations_owner_select on public.offer_operations for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy platform_connections_owner_select on public.platform_connections for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy performance_records_owner_select on public.performance_records for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy operating_cost_records_owner_select on public.operating_cost_records for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy learning_records_owner_select on public.learning_records for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;
do $$ begin create policy operation_failures_owner_select on public.operation_failures for select to authenticated using (public.is_active_workspace_member(workspace_id)); exception when duplicate_object then null; end $$;

revoke all privileges on table public.affiliate_offers,public.offer_operations,public.platform_connections,public.performance_records,public.operating_cost_records,public.learning_records,public.operation_failures from public,anon,authenticated;
grant select on table public.affiliate_offers,public.offer_operations,public.platform_connections,public.performance_records,public.operating_cost_records,public.learning_records,public.operation_failures to authenticated;

create or replace function public.register_affiliate_offer(p_workspace_id uuid,p_brand_id uuid,p_idempotency_key text,p_offer jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_title text:=btrim(p_offer->>'title'); v_currency text:=upper(coalesce(p_offer->>'currency','JPY')); v_markets text[];
begin
  if auth.uid() is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'offer_workspace_denied'; end if;
  if not exists(select 1 from public.brand_profiles where id=p_brand_id and workspace_id=p_workspace_id) then raise exception 'offer_brand_mismatch'; end if;
  if coalesce(v_title,'')='' or coalesce(btrim(p_offer->>'advertiser'),'')='' or coalesce(btrim(p_offer->>'commissionSummary'),'')='' then raise exception 'offer_required_fields_missing'; end if;
  if v_currency !~ '^[A-Z]{3}$' then raise exception 'offer_currency_invalid'; end if;
  select coalesce(array_agg(value),array['JP','GLOBAL']) into v_markets from jsonb_array_elements_text(coalesce(p_offer->'targetMarkets','["JP","GLOBAL"]'::jsonb)) value where value in ('JP','GLOBAL');
  if cardinality(v_markets)=0 then raise exception 'offer_market_invalid'; end if;
  insert into public.affiliate_offers(workspace_id,brand_id,title,advertiser,source_url,category,target_markets,commission_summary,currency,commission_minor,terms_summary,disclosure_text,idempotency_key,provenance,created_by)
  values(p_workspace_id,p_brand_id,v_title,btrim(p_offer->>'advertiser'),nullif(btrim(p_offer->>'sourceUrl'),''),coalesce(nullif(btrim(p_offer->>'category'),''),'その他'),v_markets,btrim(p_offer->>'commissionSummary'),v_currency,nullif(p_offer->>'commissionMinor','')::bigint,coalesce(nullif(btrim(p_offer->>'termsSummary'),''),'Owner確認済みのASP条件を参照'),coalesce(nullif(btrim(p_offer->>'disclosure'),''),'広告・アフィリエイトを含むコンテンツです。'),p_idempotency_key,jsonb_build_object('sourceKind','owner_supplied','registeredAt',now()),auth.uid())
  on conflict(workspace_id,idempotency_key) do nothing returning id into v_id;
  if v_id is null then select id into v_id from public.affiliate_offers where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key; end if;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(p_workspace_id,'owner',auth.uid()::text,'affiliate_offer.registered','affiliate_offer',v_id,p_idempotency_key,jsonb_build_object('title',v_title,'sourceKind','owner_supplied'));
  return v_id;
end $$;

create or replace function public.prepare_offer_operation(p_offer_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_o public.affiliate_offers; v_opportunity uuid; v_campaign uuid; v_task uuid; v_artifact uuid; v_approval uuid; v_operation uuid; v_run uuid; v_content jsonb; v_preview jsonb;
begin
  select * into v_o from public.affiliate_offers where id=p_offer_id for update;
  if v_o.id is null or not public.is_active_workspace_member(v_o.workspace_id) then raise exception 'offer_not_available'; end if;
  select id into v_operation from public.offer_operations where workspace_id=v_o.workspace_id and idempotency_key=p_idempotency_key;
  if v_operation is not null then return v_operation; end if;
  v_content:=jsonb_build_object('operationType','affiliate_media_operation','title',v_o.title||' 実践ガイド','disclosure',v_o.disclosure_text,
    'article',jsonb_build_object('headline',v_o.title||'を選ぶ前に確認したいポイント','outline',jsonb_build_array('対象者と課題','特徴と利用条件','比較時の注意点','申込み前の確認'),'cta','公式条件を確認して、自分に合う場合のみ検討してください。'),
    'socialPosts',jsonb_build_array(jsonb_build_object('market','JP','text',v_o.title||'の特徴と注意点を整理しました。条件を確認してから検討しましょう。'),jsonb_build_object('market','GLOBAL','text','A practical, transparent guide to '||v_o.title||'. Check eligibility and official terms before deciding.')),
    'shortVideo',jsonb_build_object('hook',v_o.title||'は誰に向いている？','beats',jsonb_build_array('課題','主な特徴','注意点','公式条件へのCTA')));
  insert into public.opportunities(workspace_id,brand_id,title,summary,lane,status,score_snapshot,confidence_snapshot,risk_snapshot,provenance,created_by)
    values(v_o.workspace_id,v_o.brand_id,v_o.title||' ASP運用',v_o.commission_summary,'affiliate','proceeding',jsonb_build_object('source','owner_offer','score',70),jsonb_build_object('level','owner_supplied'),jsonb_build_object('externalExecutionAllowed',false),jsonb_build_object('offerId',v_o.id,'liveMarketData',false),auth.uid()) returning id into v_opportunity;
  insert into public.campaigns(workspace_id,brand_id,opportunity_id,business_mode,lane,status,offer,channel,forecast_currency,forecast_revenue_minor,forecast_cost_minor,publication_destination,external_execution_allowed)
    values(v_o.workspace_id,v_o.brand_id,v_opportunity,'own_business','affiliate','review_required',jsonb_build_object('title',v_o.title||' ASPコンテンツ運用','affiliateOfferId',v_o.id),'manual_multi_channel',v_o.currency,null,null,'owner_selected_manual_channel',false) returning id into v_campaign;
  insert into public.tasks(campaign_id,workspace_id,type,status,assignee_type,input_ref,output_ref) values(v_campaign,v_o.workspace_id,'content_batch_prepare','completed','ai',jsonb_build_object('offerId',v_o.id,'mode','deterministic_safe'),jsonb_build_object('externalExecutionAllowed',false)) returning id into v_task;
  insert into public.artifacts(workspace_id,brand_id,campaign_id,task_id,type,version,status,content_json,sensitivity_level,external_output_allowed,provider_output_allowed,provenance)
    values(v_o.workspace_id,v_o.brand_id,v_campaign,v_task,'content_batch',1,'review_required',v_content,'internal',false,false,jsonb_build_object('generator','deterministic_safe_v1','offerId',v_o.id)) returning id into v_artifact;
  v_preview:=jsonb_build_object('artifactId',v_artifact,'artifactVersion',1,'campaignId',v_campaign,'offerId',v_o.id,'contentHash',encode(digest(v_content::text,'sha256'),'hex'),'externalExecutionAllowed',false);
  insert into public.approval_requests(workspace_id,campaign_id,artifact_id,scope,status,requested_by,risk_snapshot,preview_snapshot,idempotency_key)
    values(v_o.workspace_id,v_campaign,v_artifact,'internal_artifact','pending',auth.uid(),jsonb_build_object('affiliateDisclosureRequired',true,'externalExecutionAllowed',false),v_preview,'content-approval:'||p_idempotency_key) returning id into v_approval;
  insert into public.offer_operations(workspace_id,brand_id,offer_id,campaign_id,artifact_id,approval_request_id,intelligence_snapshot,audience_snapshot,strategy_snapshot,content_snapshot,schedule_snapshot,idempotency_key)
    values(v_o.workspace_id,v_o.brand_id,v_o.id,v_campaign,v_artifact,v_approval,
      jsonb_build_object('JP',jsonb_build_object('sourceKind','owner_supplied','summary','国内向けに条件・対象者・広告開示を明確化'),'GLOBAL',jsonb_build_object('sourceKind','owner_supplied','summary','English-market adaptation with eligibility and disclosure checks'),'liveDataUsed',false),
      jsonb_build_object('JP',jsonb_build_array(jsonb_build_object('name','比較検討中の国内ユーザー','need','条件と注意点を短時間で把握')),'GLOBAL',jsonb_build_array(jsonb_build_object('name','English-speaking evaluators','need','Transparent eligibility and practical comparison'))),
      jsonb_build_object('JP',jsonb_build_object('channel','article_social','positioning','正確な比較と透明な広告開示'),'GLOBAL',jsonb_build_object('channel','article_social','positioning','Transparent practical guide'),'forecastOnly',true),v_content,
      jsonb_build_object('timezone','Asia/Tokyo','status','approval_required','items',jsonb_build_array(jsonb_build_object('market','JP','channel','article','offsetDays',1),jsonb_build_object('market','GLOBAL','channel','social','offsetDays',2)),'externalExecutionAllowed',false),p_idempotency_key) returning id into v_operation;
  insert into public.workflow_runs(workspace_id,workflow_type,entity_type,entity_id,status,current_step,correlation_id,input_snapshot,started_at)
    values(v_o.workspace_id,'affiliate_media_operation','campaign',v_campaign,'paused_for_approval','owner_artifact_approval','offer-operation:'||v_operation::text,jsonb_build_object('offerId',v_o.id,'operationId',v_operation),now()) returning id into v_run;
  insert into public.workflow_steps(workflow_run_id,workspace_id,step_key,sequence,status,idempotency_key,input_snapshot) values
    (v_run,v_o.workspace_id,'owner_artifact_approval',10,'paused','offer-approval:'||v_operation::text,v_preview),
    (v_run,v_o.workspace_id,'manual_package_ready',20,'pending','offer-package:'||v_operation::text,'{}'),
    (v_run,v_o.workspace_id,'performance_waiting',30,'pending','offer-performance:'||v_operation::text,'{}'),
    (v_run,v_o.workspace_id,'learning_ready',40,'pending','offer-learning:'||v_operation::text,'{}');
  insert into public.platform_connections(workspace_id,brand_id,provider,readiness,external_execution_allowed,safe_details) values
    (v_o.workspace_id,v_o.brand_id,'manual_export','dry_run_ready',false,jsonb_build_object('ownerAction','Copy or download the approved package')),
    (v_o.workspace_id,v_o.brand_id,'google','authorization_required',false,'{}'),(v_o.workspace_id,v_o.brand_id,'meta','authorization_required',false,'{}'),(v_o.workspace_id,v_o.brand_id,'tiktok','authorization_required',false,'{}')
    on conflict(workspace_id,brand_id,provider) do nothing;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_o.workspace_id,'system',auth.uid()::text,'offer_operation.prepared','offer_operation',v_operation,p_idempotency_key,jsonb_build_object('campaignId',v_campaign,'approvalRequestId',v_approval,'externalExecutionAllowed',false));
  return v_operation;
end $$;

-- Runs inside the immutable approval transaction before Migration 007 invokes
-- the legacy package builder. The shared idempotency key makes that invocation a no-op.
create or replace function public.materialize_content_execution_package()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_op public.offer_operations; v_a public.artifacts; v_c public.campaigns; v_o public.affiliate_offers; v_package uuid; v_key text;
begin
  if old.status='pending' and new.status='approved' and new.scope='internal_artifact' then
    select * into v_op from public.offer_operations where approval_request_id=new.id;
    if v_op.id is not null then
      select * into v_a from public.artifacts where id=v_op.artifact_id;
      select * into v_c from public.campaigns where id=v_op.campaign_id;
      select * into v_o from public.affiliate_offers where id=v_op.offer_id;
      if new.preview_snapshot->>'artifactId'<>v_a.id::text or (new.preview_snapshot->>'artifactVersion')::integer<>v_a.version or new.preview_snapshot->>'campaignId'<>v_c.id::text then raise exception 'content_approval_snapshot_mismatch'; end if;
      v_key:='manual-package:'||new.id::text;
      insert into public.execution_packages(workspace_id,campaign_id,approval_request_id,artifact_version,channel,destination,payload_snapshot,status,external_execution_allowed,idempotency_key)
      values(new.workspace_id,v_c.id,new.id,v_a.version,'manual_multi_channel','owner_selected_manual_channel',jsonb_build_object(
        'operationType','affiliate_media_operation','campaignTitle',v_c.offer->>'title','offerTitle',v_o.title,'advertiser',v_o.advertiser,
        'approvalSnapshot',new.preview_snapshot,'artifactVersion',v_a.version,'content',v_op.content_snapshot,'schedule',v_op.schedule_snapshot,
        'executionChecklist',jsonb_build_array('承認済み内容と広告開示を確認','公開先へOwnerが手動で転記','公開URLを保存','Performanceを登録','実収益は別途Evidenceとして登録'),
        'disclosure',v_o.disclosure_text,'ownerAction','Copy or download, publish manually outside KEVIRIO, then record performance.','externalExecutionAllowed',false
      ),'ready',false,v_key) on conflict(workspace_id,idempotency_key) do nothing returning id into v_package;
      select id into v_package from public.execution_packages where workspace_id=new.workspace_id and idempotency_key=v_key;
      update public.artifacts set status='approved',updated_at=now() where id=v_a.id;
      update public.campaigns set status='execution_ready',updated_at=now() where id=v_c.id;
      update public.offer_operations set status='manual_package_ready',schedule_snapshot=jsonb_set(schedule_snapshot,'{status}','"manual_ready"'),updated_at=now() where id=v_op.id;
      update public.workflow_steps set status='completed',completed_at=now() where workflow_run_id in (select id from public.workflow_runs where workflow_type='affiliate_media_operation' and entity_id=v_c.id) and step_key in ('owner_artifact_approval','manual_package_ready');
      update public.workflow_steps set status='available',available_at=now() where workflow_run_id in (select id from public.workflow_runs where workflow_type='affiliate_media_operation' and entity_id=v_c.id) and step_key='performance_waiting';
      update public.workflow_runs set status='running',current_step='manual_package_ready',updated_at=now() where workflow_type='affiliate_media_operation' and entity_id=v_c.id;
      insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(new.workspace_id,'owner',auth.uid()::text,'content_package.generated','execution_package',v_package,v_key,jsonb_build_object('operationId',v_op.id,'externalExecutionAllowed',false));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists approval_content_package on public.approval_requests;
create trigger approval_content_package before update of status on public.approval_requests for each row execute function public.materialize_content_execution_package();

create or replace function public.record_offer_performance(p_operation_id uuid,p_input jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_op public.offer_operations; v_package uuid; v_id uuid; v_ref text:=btrim(p_input->>'sourceReference'); v_test boolean:=coalesce((p_input->>'isTest')::boolean,false);
begin
  select * into v_op from public.offer_operations where id=p_operation_id;
  if v_op.id is null or not public.is_active_workspace_member(v_op.workspace_id) then raise exception 'operation_not_available'; end if;
  select id into v_package from public.execution_packages where approval_request_id=v_op.approval_request_id and external_execution_allowed=false;
  if v_package is null or v_op.status not in ('manual_package_ready','performance_waiting','learning_ready') then raise exception 'approved_package_required'; end if;
  if coalesce(v_ref,'')='' or (p_input->>'market') not in ('JP','GLOBAL') then raise exception 'performance_input_invalid'; end if;
  insert into public.performance_records(workspace_id,campaign_id,execution_package_id,market,channel,period_start,period_end,impressions,clicks,conversions,source_kind,source_reference,is_test,created_by)
  values(v_op.workspace_id,v_op.campaign_id,v_package,p_input->>'market',coalesce(nullif(btrim(p_input->>'channel'),''),'manual'),(p_input->>'periodStart')::date,(p_input->>'periodEnd')::date,coalesce((p_input->>'impressions')::bigint,0),coalesce((p_input->>'clicks')::bigint,0),coalesce((p_input->>'conversions')::bigint,0),case when v_test then 'test_fixture' else 'owner_manual' end,v_ref,v_test,auth.uid()) returning id into v_id;
  update public.offer_operations set status='performance_waiting',updated_at=now() where id=v_op.id and status='manual_package_ready';
  update public.workflow_runs set current_step='performance_waiting',updated_at=now() where workflow_type='affiliate_media_operation' and entity_id=v_op.campaign_id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_op.workspace_id,'owner',auth.uid()::text,'performance.recorded','performance_record',v_id,v_ref,jsonb_build_object('test',v_test,'market',p_input->>'market'));
  return v_id;
exception when unique_violation then raise exception 'duplicate_performance_reference'; end $$;

create or replace function public.record_operating_cost(p_operation_id uuid,p_input jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_op public.offer_operations; v_id uuid; v_ref text:=btrim(p_input->>'sourceReference'); v_value text:=p_input->>'valueType';
begin
  select * into v_op from public.offer_operations where id=p_operation_id;
  if v_op.id is null or not public.is_active_workspace_member(v_op.workspace_id) then raise exception 'operation_not_available'; end if;
  if v_value not in ('actual','forecast','test') or upper(p_input->>'currency') !~ '^[A-Z]{3}$' or (p_input->>'amountMinor')::bigint<0 or coalesce(v_ref,'')='' then raise exception 'cost_input_invalid'; end if;
  insert into public.operating_cost_records(workspace_id,campaign_id,category,amount_minor,currency,value_type,occurred_at,source_reference,note,created_by)
  values(v_op.workspace_id,v_op.campaign_id,p_input->>'category',(p_input->>'amountMinor')::bigint,upper(p_input->>'currency'),v_value,(p_input->>'occurredAt')::timestamptz,v_ref,nullif(btrim(p_input->>'note'),''),auth.uid()) returning id into v_id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_op.workspace_id,'owner',auth.uid()::text,'operating_cost.recorded','operating_cost_record',v_id,v_ref,jsonb_build_object('valueType',v_value,'currency',upper(p_input->>'currency')));
  return v_id;
exception when unique_violation then raise exception 'duplicate_cost_reference'; end $$;

create or replace function public.generate_operation_learning(p_operation_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_op public.offer_operations; v_id uuid; v_perf jsonb; v_key text; v_clicks bigint; v_conversions bigint;
begin
  select * into v_op from public.offer_operations where id=p_operation_id;
  if v_op.id is null or not public.is_active_workspace_member(v_op.workspace_id) then raise exception 'operation_not_available'; end if;
  select coalesce(sum(clicks),0),coalesce(sum(conversions),0),jsonb_build_object('records',count(*),'impressions',coalesce(sum(impressions),0),'clicks',coalesce(sum(clicks),0),'conversions',coalesce(sum(conversions),0),'testRecords',count(*) filter(where is_test)) into v_clicks,v_conversions,v_perf from public.performance_records where workspace_id=v_op.workspace_id and campaign_id=v_op.campaign_id;
  if (v_perf->>'records')::integer=0 then raise exception 'performance_required_for_learning'; end if;
  v_key:='learning:'||v_op.id::text||':'||encode(digest(v_perf::text,'sha256'),'hex');
  insert into public.learning_records(workspace_id,brand_id,campaign_id,input_snapshot,learning_snapshot,idempotency_key)
  values(v_op.workspace_id,v_op.brand_id,v_op.campaign_id,v_perf,jsonb_build_object('classification','generated_inference','finding',case when v_conversions>0 then 'コンバージョンが観測されました。実データを市場別に比較してください。' when v_clicks>0 then 'クリックはありますがコンバージョン未観測です。CTAとOffer適合性を検証してください。' else '反応が未観測です。配信量・訴求・チャネルを順に検証してください。' end,'recommendedNextTest','市場別に一要素だけ変更し、同じ計測定義で比較する','actualRevenueUnaffected',true),v_key)
  on conflict(workspace_id,idempotency_key) do update set learning_snapshot=excluded.learning_snapshot returning id into v_id;
  update public.offer_operations set status='learning_ready',updated_at=now() where id=v_op.id;
  update public.workflow_steps set status='completed',completed_at=now() where workflow_run_id in(select id from public.workflow_runs where workflow_type='affiliate_media_operation' and entity_id=v_op.campaign_id) and step_key in ('performance_waiting','learning_ready');
  update public.workflow_runs set current_step='learning_ready',status='completed',completed_at=now(),updated_at=now() where workflow_type='affiliate_media_operation' and entity_id=v_op.campaign_id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_op.workspace_id,'system',auth.uid()::text,'learning.generated','learning_record',v_id,v_key,jsonb_build_object('recordType','generated_inference','actualRevenueUnaffected',true));
  return v_id;
end $$;

create or replace function public.record_operation_failure(p_operation_id uuid,p_operation text,p_error_code text,p_retryable boolean,p_owner_action text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_op public.offer_operations; v_id uuid;
begin
  select * into v_op from public.offer_operations where id=p_operation_id;
  if v_op.id is null or not public.is_active_workspace_member(v_op.workspace_id) then raise exception 'operation_not_available'; end if;
  if coalesce(btrim(p_operation),'')='' or coalesce(btrim(p_error_code),'')='' then raise exception 'failure_input_invalid'; end if;
  insert into public.operation_failures(workspace_id,campaign_id,operation,error_code,retryable,owner_action,safe_context)
  values(v_op.workspace_id,v_op.campaign_id,left(btrim(p_operation),80),left(btrim(p_error_code),80),coalesce(p_retryable,false),left(nullif(btrim(p_owner_action),''),240),jsonb_build_object('operationId',v_op.id,'recordedAt',now())) returning id into v_id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
  values(v_op.workspace_id,'system',auth.uid()::text,'operation.failed','operation_failure',v_id,v_id::text,jsonb_build_object('operation',left(btrim(p_operation),80),'errorCode',left(btrim(p_error_code),80),'retryable',coalesce(p_retryable,false)));
  return v_id;
end $$;

-- Migration 008 upgrades only legacy sales packages. Content operation packages
-- carry a different owner-safe schema and must remain byte-for-byte intact.
create or replace function public.retrieve_manual_execution_packages(p_workspace_id uuid)
returns setof public.execution_packages language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'manual_package_workspace_denied'; end if;
  update public.execution_packages ep set payload_snapshot=public.build_sales_ready_package_payload(ep.approval_request_id)
    where ep.workspace_id=p_workspace_id and ep.status<>'superseded'
      and not (ep.payload_snapshot ? 'serviceName') and not (ep.payload_snapshot ? 'operationType');
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,correlation_id,after_summary)
    values(p_workspace_id,'owner',auth.uid()::text,'manual_package.retrieved','execution_package','manual-package-retrieval',jsonb_build_object('externalExecutionAllowed',false));
  return query select * from public.execution_packages where workspace_id=p_workspace_id order by created_at desc;
end $$;

revoke all on function public.register_affiliate_offer(uuid,uuid,text,jsonb),public.prepare_offer_operation(uuid,text),public.record_offer_performance(uuid,jsonb),public.record_operating_cost(uuid,jsonb),public.generate_operation_learning(uuid),public.record_operation_failure(uuid,text,text,boolean,text) from public,anon;
grant execute on function public.register_affiliate_offer(uuid,uuid,text,jsonb),public.prepare_offer_operation(uuid,text),public.record_offer_performance(uuid,jsonb),public.record_operating_cost(uuid,jsonb),public.generate_operation_learning(uuid),public.record_operation_failure(uuid,text,text,boolean,text) to authenticated;
revoke all on function public.retrieve_manual_execution_packages(uuid) from public,anon;
grant execute on function public.retrieve_manual_execution_packages(uuid) to authenticated;
revoke all on function public.materialize_content_execution_package() from public,anon,authenticated;

commit;
