begin;

-- Candidate only. Do not apply remotely without separate Owner approval.
-- Migration 012 is immutable and is not modified by this candidate.
do $$
declare
  object_name text;
  existing_count integer := 0;
begin
  if not exists(select 1 from pg_extension where extname='pgcrypto') then
    raise exception 'm013_pgcrypto_required';
  end if;
  foreach object_name in array array[
    'workspaces','workspace_members','brand_profiles','offer_operations',
    'approval_requests','evidence_candidates','revenue_records','operating_cost_records','learning_records'
  ] loop
    if to_regclass(format('public.%I',object_name)) is null then
      raise exception 'm013_parent_missing:%',object_name;
    end if;
  end loop;
  select count(*) into existing_count
  from unnest(array[
    'market_profiles','revenue_engines','company_cycle_runs','content_assets',
    'revenue_learning_records','executive_decisions','company_operating_events','revenue_engine_definitions'
  ]) as target(name)
  where to_regclass(format('public.%I',target.name)) is not null;
  if existing_count <> 0 then
    raise exception 'm013_partial_schema_detected:%/8',existing_count;
  end if;
  if to_regprocedure('public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text)') is not null
    or to_regprocedure('public.enforce_v1_manual_package_contract()') is not null
    or to_regprocedure('public.touch_company_updated_at()') is not null
    or to_regprocedure('public.reject_company_event_mutation()') is not null then
    raise exception 'm013_function_collision';
  end if;
  if exists(select 1 from pg_trigger where tgname in('execution_packages_v1_contract','company_touch_updated_at','company_operating_events_immutable') and not tgisinternal) then
    raise exception 'm013_trigger_collision';
  end if;
  if exists(select 1 from pg_indexes where schemaname='public' and indexname in(
    'revenue_engines_workspace_status_type_idx','company_cycle_runs_workspace_status_stage_idx',
    'content_assets_workspace_status_type_idx','revenue_learning_workspace_status_expiry_idx',
    'executive_decisions_workspace_status_deadline_idx','company_events_workspace_entity_created_idx'
  )) then raise exception 'm013_index_collision'; end if;
  if exists(
    select 1 from pg_class c
    where c.oid in('public.brand_profiles'::regclass,'public.offer_operations'::regclass,'public.execution_packages'::regclass)
      and pg_get_userbyid(c.relowner)<>current_user
  ) then raise exception 'm013_existing_object_ownership_mismatch'; end if;
end $$;
do $$ begin
  if exists(select 1 from pg_constraint where conrelid='public.brand_profiles'::regclass and conname='brand_profiles_id_workspace_unique' and pg_get_constraintdef(oid,true)<>'UNIQUE (id, workspace_id)') then
    raise exception 'm013_brand_workspace_constraint_collision';
  end if;
  if exists(select 1 from pg_constraint where conrelid='public.offer_operations'::regclass and conname='offer_operations_id_workspace_unique' and pg_get_constraintdef(oid,true)<>'UNIQUE (id, workspace_id)') then
    raise exception 'm013_offer_workspace_constraint_collision';
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.brand_profiles'::regclass and conname='brand_profiles_id_workspace_unique') then
    alter table public.brand_profiles add constraint brand_profiles_id_workspace_unique unique(id,workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.offer_operations'::regclass and conname='offer_operations_id_workspace_unique') then
    alter table public.offer_operations add constraint offer_operations_id_workspace_unique unique(id,workspace_id);
  end if;
end $$;
create table if not exists public.revenue_engine_definitions (
  engine_type text primary key check(engine_type in('affiliate','media_advertising','sns_operations','owned_media','digital_products','service_client')),
  label_ja text not null,
  label_en text not null,
  display_order integer not null unique check(display_order between 1 and 6),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.revenue_engine_definitions(engine_type,label_ja,label_en,display_order) values
  ('affiliate','アフィリエイト','Affiliate',1),
  ('media_advertising','メディア・広告','Media / Advertising',2),
  ('sns_operations','SNS運用','SNS Operations',3),
  ('owned_media','ブログ・オウンドメディア','Blog / Owned Media',4),
  ('digital_products','デジタル商品','Digital Products',5),
  ('service_client','サービス・クライアント事業','Service / Client Business',6)
on conflict(engine_type) do update set
  label_ja=excluded.label_ja,label_en=excluded.label_en,display_order=excluded.display_order,updated_at=now();
create table if not exists public.market_profiles (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  country text not null, country_code text not null check(country_code~'^[A-Z]{2}$'), region text,
  locale text not null, language text not null, currency text not null check(currency~'^[A-Z]{3}$'), timezone_name text not null,
  regulation_profile jsonb not null default '{}', platform_availability jsonb not null default '{}',
  offer_eligibility jsonb not null default '{}', audience_segment text, search_intent text, commercial_intent text,
  channel_fit jsonb not null default '{}', content_formats text[] not null default '{}', cta_profile jsonb not null default '{}',
  disclosure_requirements jsonb not null default '{}', posting_windows jsonb not null default '{}',
  cost_assumptions jsonb not null default '{}', revenue_assumptions jsonb not null default '{}', evidence_source text,
  check(public.ai_metadata_is_safe(regulation_profile,0) and public.ai_metadata_is_safe(platform_availability,0) and public.ai_metadata_is_safe(offer_eligibility,0) and public.ai_metadata_is_safe(channel_fit,0) and public.ai_metadata_is_safe(cta_profile,0) and public.ai_metadata_is_safe(disclosure_requirements,0) and public.ai_metadata_is_safe(posting_windows,0) and public.ai_metadata_is_safe(cost_assumptions,0) and public.ai_metadata_is_safe(revenue_assumptions,0)),
  maturity text not null check(maturity in('Production','Conditional','Mock','Locked')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,workspace_id), unique(workspace_id,country_code,locale)
);
create table if not exists public.revenue_engines (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), brand_id uuid not null,
  market_id uuid not null, name text not null, type text not null check(type in('affiliate','media_advertising','sns_operations','owned_media','digital_products','service_client')),
  currency text not null check(currency~'^[A-Z]{3}$'), status text not null check(status in('draft','active','paused','stopped','archived')),
  maturity text not null check(maturity in('Production','Conditional','Mock','Locked')), objective text not null,
  business_model jsonb not null default '{}', revenue_source text, cost_model jsonb not null default '{}', target_audience text,
  channels text[] not null default '{}', approval_policy jsonb not null default '{}', owner_workload_minutes integer check(owner_workload_minutes is null or owner_workload_minutes>=0),
  risk_level text not null default 'unknown' check(risk_level in('low','medium','high','unknown')),
  check(public.ai_metadata_is_safe(business_model,0) and public.ai_metadata_is_safe(cost_model,0) and public.ai_metadata_is_safe(approval_policy,0)),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  idempotency_key_hash text not null check(idempotency_key_hash~'^[A-F0-9]{64}$'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), suspended_at timestamptz,
  unique(id,workspace_id), unique(workspace_id,name), unique(workspace_id,idempotency_key_hash),
  foreign key(brand_id,workspace_id) references public.brand_profiles(id,workspace_id), foreign key(market_id,workspace_id) references public.market_profiles(id,workspace_id)
);
create table if not exists public.company_cycle_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), revenue_engine_id uuid not null,
  operation_id uuid, current_stage text not null,
  status text not null default 'not_started' check(status in('not_started','ready','waiting','in_progress','blocked','awaiting_approval','manually_executed','evidence_pending','completed','failed','cancelled','unknown')),
  truth_class text not null check(truth_class in('Actual','Forecast','Mock','Unknown')), blocker text, next_action text,
  owner_intervention_required boolean not null default false, metrics jsonb not null default '{}' check(public.ai_metadata_is_safe(metrics,0)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), completed_at timestamptz,
  unique(id,workspace_id), foreign key(revenue_engine_id,workspace_id) references public.revenue_engines(id,workspace_id),
  foreign key(operation_id,workspace_id) references public.offer_operations(id,workspace_id)
);
create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), revenue_engine_id uuid not null,
  cycle_run_id uuid, asset_type text not null check(asset_type in('article','blog_post','note_post','sns_post','thread','short_video_script','long_video_script','thumbnail_brief','advertisement_copy','landing_page_copy','email_draft','localization_variant','cta_variant')),
  market_id uuid not null, language text not null, version integer not null default 1 check(version>0), status text not null check(status in('draft','review','awaiting_approval','approved','manual_package_ready','archived')),
  content_reference text not null, content_hash text not null check(content_hash~'^[a-f0-9]{64}$'), approval_id uuid,
  raw_content_stored boolean not null default false check(raw_content_stored=false), external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,workspace_id), unique(workspace_id,content_hash), foreign key(revenue_engine_id,workspace_id) references public.revenue_engines(id,workspace_id),
  foreign key(cycle_run_id,workspace_id) references public.company_cycle_runs(id,workspace_id), foreign key(market_id,workspace_id) references public.market_profiles(id,workspace_id),
  foreign key(approval_id,workspace_id) references public.approval_requests(id,workspace_id)
);
-- Revenue learning remains separate from the Migration 003 Business Memory boundary.
create table if not exists public.revenue_learning_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), revenue_engine_id uuid,
  source_type text not null, source_id text not null, statement text not null check(length(statement) between 1 and 1000),
  evidence_status text not null check(evidence_status in('verified','rejected','expired')), confidence numeric(5,4) check(confidence between 0 and 1),
  status text not null check(status in('candidate','active','rejected','expired','superseded')), expires_at timestamptz, metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(metadata,0)),
  raw_content_stored boolean not null default false check(raw_content_stored=false), retention_until timestamptz not null default (now()+interval '7 years'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,workspace_id), unique(workspace_id,source_type,source_id,statement), foreign key(revenue_engine_id,workspace_id) references public.revenue_engines(id,workspace_id)
);
create table if not exists public.executive_decisions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), revenue_engine_id uuid,
  source_entity text not null, source_id text not null, status text not null check(status in('pending','resolved','expired','cancelled')),
  revenue_impact_minor bigint, cost_impact_minor bigint, currency text check(currency is null or currency~'^[A-Z]{3}$'), risk_impact text,
  urgency integer not null default 0 check(urgency between 0 and 100), confidence numeric(5,4) check(confidence between 0 and 1),
  deadline timestamptz, owner_action text not null, alternatives jsonb not null default '[]' check(public.ai_metadata_is_safe(alternatives,0)), consequence_of_no_action text,
  required_approval_id uuid, evidence_reference text, resolved_at timestamptz, created_at timestamptz not null default now(),
  unique(id,workspace_id), foreign key(revenue_engine_id,workspace_id) references public.revenue_engines(id,workspace_id),
  foreign key(required_approval_id,workspace_id) references public.approval_requests(id,workspace_id)
);
create table if not exists public.company_operating_events (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), entity_type text not null, entity_id uuid not null,
  event_type text not null check(event_type~'^[a-z][a-z0-9_]{1,63}$'), actor_type text not null check(actor_type in('owner','ai_employee','system')),
  actor_id text, safe_metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(safe_metadata,0)), retention_until timestamptz not null default (now()+interval '7 years'), created_at timestamptz not null default now()
);

do $$
declare
  required_column record;
begin
  for required_column in select * from (values
    ('revenue_engine_definitions','engine_type'),('revenue_engine_definitions','external_execution_allowed'),
    ('market_profiles','workspace_id'),('market_profiles','currency'),('market_profiles','maturity'),
    ('revenue_engines','workspace_id'),('revenue_engines','brand_id'),('revenue_engines','market_id'),('revenue_engines','idempotency_key_hash'),('revenue_engines','external_execution_allowed'),
    ('company_cycle_runs','workspace_id'),('company_cycle_runs','revenue_engine_id'),('company_cycle_runs','operation_id'),('company_cycle_runs','current_stage'),('company_cycle_runs','status'),('company_cycle_runs','truth_class'),
    ('content_assets','workspace_id'),('content_assets','revenue_engine_id'),('content_assets','cycle_run_id'),('content_assets','approval_id'),('content_assets','raw_content_stored'),('content_assets','external_execution_allowed'),
    ('revenue_learning_records','workspace_id'),('revenue_learning_records','evidence_status'),('revenue_learning_records','raw_content_stored'),('revenue_learning_records','retention_until'),
    ('executive_decisions','workspace_id'),('executive_decisions','required_approval_id'),('executive_decisions','currency'),
    ('company_operating_events','workspace_id'),('company_operating_events','event_type'),('company_operating_events','safe_metadata'),('company_operating_events','retention_until')
  ) as required(table_name,column_name) loop
    if not exists(
      select 1 from information_schema.columns c
      where c.table_schema='public' and c.table_name=required_column.table_name and c.column_name=required_column.column_name
    ) then
      raise exception 'm013_partial_schema_missing_column:%.%',required_column.table_name,required_column.column_name;
    end if;
  end loop;
  if not exists(select 1 from pg_constraint where conrelid='public.revenue_engines'::regclass and contype='f' and pg_get_constraintdef(oid) like 'FOREIGN KEY (brand_id, workspace_id)%') then
    raise exception 'm013_revenue_engine_brand_workspace_fk_missing';
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.company_cycle_runs'::regclass and contype='f' and pg_get_constraintdef(oid) like 'FOREIGN KEY (operation_id, workspace_id)%') then
    raise exception 'm013_cycle_operation_workspace_fk_missing';
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.content_assets'::regclass and contype='f' and pg_get_constraintdef(oid) like 'FOREIGN KEY (approval_id, workspace_id)%') then
    raise exception 'm013_content_approval_workspace_fk_missing';
  end if;
end $$;
create index if not exists revenue_engines_workspace_status_type_idx on public.revenue_engines(workspace_id,status,type);
create index if not exists company_cycle_runs_workspace_status_stage_idx on public.company_cycle_runs(workspace_id,status,current_stage);
create index if not exists content_assets_workspace_status_type_idx on public.content_assets(workspace_id,status,asset_type);
create index revenue_learning_workspace_status_expiry_idx on public.revenue_learning_records(workspace_id,status,expires_at);
create index if not exists executive_decisions_workspace_status_deadline_idx on public.executive_decisions(workspace_id,status,deadline);
create index if not exists company_events_workspace_entity_created_idx on public.company_operating_events(workspace_id,entity_type,entity_id,created_at);

create function public.register_revenue_engine(p_workspace_id uuid,p_brand_id uuid,p_market_id uuid,p_name text,p_type text,p_currency text,p_objective text,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$ declare v_id uuid; v_key_hash text; begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 8 then raise exception 'idempotency_key_required'; end if;
  v_key_hash:=upper(encode(digest(p_idempotency_key,'sha256'),'hex'));
  select id into v_id from public.revenue_engines where workspace_id=p_workspace_id and idempotency_key_hash=v_key_hash;
  if v_id is not null then return v_id; end if;
  insert into public.revenue_engines(workspace_id,brand_id,market_id,name,type,currency,status,maturity,objective,idempotency_key_hash)
  values(p_workspace_id,p_brand_id,p_market_id,p_name,p_type,upper(p_currency),'draft','Conditional',p_objective,v_key_hash) returning id into v_id;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(p_workspace_id,'revenue_engine',v_id,'revenue_engine_registered','system',null,jsonb_build_object('idempotency_key_hash',v_key_hash));
  return v_id;
exception when unique_violation then
  select id into v_id from public.revenue_engines
    where workspace_id=p_workspace_id and idempotency_key_hash=v_key_hash;
  if v_id is null then raise; end if;
  return v_id;
end $$;
create function public.enforce_v1_manual_package_contract()
returns trigger language plpgsql set search_path='' as $$
declare
  v_payload jsonb:=coalesce(new.payload_snapshot,'{}'::jsonb);
begin
  if v_payload->>'operationType'='affiliate_media_operation' then
    new.payload_snapshot:=v_payload||jsonb_build_object(
      'targetChannel',new.channel,
      'accountDestination',new.destination,
      'copyableTextSource','payload.content',
      'downloadableAssetReference',coalesce(v_payload#>>'{approvalSnapshot,contentHash}','Unknown'),
      'cta',coalesce(v_payload#>>'{content,article,cta}','Unknown'),
      'publishChecklist',coalesce(v_payload->'executionChecklist','[]'::jsonb),
      'scheduledTime',coalesce(v_payload#>'{schedule,scheduledTime}','null'::jsonb),
      'timezone',coalesce(v_payload#>>'{schedule,timezone}','Unknown'),
      'evidenceCollectionInstructions',jsonb_build_array(
        'Ownerが外部公開または送信を完了した後に、実在する参照番号を登録する',
        '通貨とminor unit金額を原資料と照合する',
        'Evidence候補をOwner承認し、保護RPCでActual Revenueを確定する'
      ),
      'expectedMetricFields',jsonb_build_array('impressions','clicks','conversions','grossAmountMinor','costAmountMinor','currency','sourceReference'),
      'actualResultEntry',jsonb_build_object('mode','owner_manual','status','not_recorded'),
      'failureRecording',jsonb_build_object('available',true,'rawProviderPayloadAllowed',false),
      'ownerCompletionConfirmation',jsonb_build_object('required',true,'status','not_confirmed'),
      'externalExecutionAllowed',false
    );
  end if;
  return new;
end $$;
create trigger execution_packages_v1_contract
before insert or update of payload_snapshot on public.execution_packages
for each row execute function public.enforce_v1_manual_package_contract();
create function public.touch_company_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['revenue_engine_definitions','market_profiles','revenue_engines','company_cycle_runs','content_assets','revenue_learning_records'] loop
    execute format('create trigger company_touch_updated_at before update on public.%I for each row execute function public.touch_company_updated_at()',t);
  end loop;
end $$;
create function public.reject_company_event_mutation() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'company_operating_events_append_only'; end $$;
create trigger company_operating_events_immutable before update or delete on public.company_operating_events for each row execute function public.reject_company_event_mutation();

alter table public.revenue_engine_definitions enable row level security;
create policy revenue_engine_definitions_read on public.revenue_engine_definitions for select to authenticated using (true);
do $$ declare t text; begin foreach t in array array['market_profiles','revenue_engines','company_cycle_runs','content_assets','revenue_learning_records','executive_decisions','company_operating_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('create policy company_owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active''))',t,t);
end loop; end $$;
revoke all on table public.revenue_engine_definitions,public.market_profiles,public.revenue_engines,public.company_cycle_runs,public.content_assets,public.revenue_learning_records,public.executive_decisions,public.company_operating_events from public,anon,authenticated;
grant select on table public.revenue_engine_definitions,public.market_profiles,public.revenue_engines,public.company_cycle_runs,public.content_assets,public.revenue_learning_records,public.executive_decisions,public.company_operating_events to authenticated,service_role;
revoke all on function public.enforce_v1_manual_package_contract() from public,anon,authenticated;
revoke all on function public.touch_company_updated_at() from public,anon,authenticated;
revoke all on function public.reject_company_event_mutation() from public,anon,authenticated;
revoke all on function public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.register_revenue_engine(uuid,uuid,uuid,text,text,text,text,text) to service_role;
commit;
