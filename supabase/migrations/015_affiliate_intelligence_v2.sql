begin;

-- Candidate only. No seed, no canonical Actual mutation, and no provider execution.
do $$
declare v_name text;
begin
  foreach v_name in array array[
    'workspaces','workspace_members','owner_profiles','affiliate_programs','affiliate_offers',
    'content_assets','evidence_candidates','revenue_records','operating_cost_records',
    'revenue_learning_records','executive_decisions','company_operating_events','ai_employee_definitions','ai_employee_tasks'
  ] loop
    if to_regclass(format('public.%I',v_name)) is null then raise exception 'm015_parent_missing:%',v_name; end if;
  end loop;
  if to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)') is null then raise exception 'm015_safe_metadata_function_missing'; end if;
  if exists(select 1 from pg_class where relnamespace='public'::regnamespace and relname in(
    'affiliate_products','affiliate_product_sources','affiliate_research_entities','affiliate_experiments',
    'affiliate_intelligence_snapshots','affiliate_risk_findings','affiliate_alerts','affiliate_daily_briefs','reusable_business_assets'
  )) then raise exception 'm015_partial_schema_detected'; end if;
end $$;

create table public.affiliate_products (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  name text not null check(length(name) between 1 and 240), model_name text, price_minor bigint check(price_minor is null or price_minor>=0),
  currency text check(currency is null or currency~'^[A-Z]{3}$'), lifecycle_status text not null default 'active' check(lifecycle_status in('active','superseded','archived')),
  truth_class text not null default 'Unknown' check(truth_class in('Actual','Forecast','Inference','Unknown','Mock','Test')),
  generated_at timestamptz, source_reference text, assumptions text[] not null default '{}', confidence numeric(5,4) check(confidence is null or confidence between 0 and 1), model_version text,
  evidence_candidate_id uuid, safe_metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(safe_metadata,0)),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_products_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_products_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_products_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_products_workspace_program_name_unique unique(workspace_id,affiliate_program_id,name,model_name),
  constraint affiliate_products_truth_evidence_check check(truth_class<>'Actual' or evidence_candidate_id is not null),
  constraint affiliate_products_generated_truth_check check(truth_class not in('Forecast','Inference') or (generated_at is not null and source_reference is not null and cardinality(assumptions)>0 and confidence is not null and model_version is not null))
);

create table public.affiliate_product_sources (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), product_id uuid not null,
  source_type text not null check(source_type in('owner_input','official_url','advertiser_program','uploaded_document','existing_safe_data','evidence')),
  source_reference text not null check(length(source_reference) between 1 and 2000), attribution text not null check(length(attribution) between 1 and 500),
  observed_at timestamptz, evidence_candidate_id uuid, safe_metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(safe_metadata,0)),
  lifecycle_status text not null default 'active' check(lifecycle_status in('active','stale','rejected','archived')),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_product_sources_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_product_sources_product_workspace_fk foreign key(product_id,workspace_id) references public.affiliate_products(id,workspace_id),
  constraint affiliate_product_sources_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_product_sources_workspace_reference_unique unique(workspace_id,product_id,source_reference)
);

create table public.affiliate_research_entities (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  entity_type text not null check(entity_type in('audience','competitor','keyword')), name text not null check(length(name) between 1 and 300),
  lifecycle_status text not null default 'draft' check(lifecycle_status in('draft','review','active','rejected','archived')),
  truth_class text not null default 'Unknown' check(truth_class in('Actual','Forecast','Inference','Unknown','Mock','Test')),
  generated_at timestamptz, source_reference text, assumptions text[] not null default '{}', confidence numeric(5,4) check(confidence is null or confidence between 0 and 1), model_version text,
  evidence_candidate_id uuid, attributes jsonb not null default '{}' check(public.ai_metadata_is_safe(attributes,0) and pg_column_size(attributes)<=16384),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_research_entities_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_research_entities_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_research_entities_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_research_entities_workspace_name_unique unique(workspace_id,affiliate_program_id,entity_type,name),
  constraint affiliate_research_entities_truth_evidence_check check(truth_class<>'Actual' or evidence_candidate_id is not null),
  constraint affiliate_research_entities_generated_truth_check check(truth_class not in('Forecast','Inference') or (generated_at is not null and source_reference is not null and cardinality(assumptions)>0 and confidence is not null and model_version is not null))
);

create table public.affiliate_experiments (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  title text not null check(length(title) between 1 and 240), hypothesis text not null check(length(hypothesis) between 1 and 2000),
  lifecycle_status text not null default 'hypothesis' check(lifecycle_status in('hypothesis','designed','owner_approved','manual_execution','measuring','completed','inconclusive','cancelled')),
  approval_request_id uuid, evidence_candidate_id uuid, result_truth_class text not null default 'Unknown' check(result_truth_class in('Actual','Forecast','Inference','Unknown','Mock','Test')),
  result_summary text, external_execution_allowed boolean not null default false check(external_execution_allowed=false), idempotency_key text not null check(length(idempotency_key) between 8 and 240),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_experiments_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_experiments_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_experiments_approval_workspace_fk foreign key(approval_request_id,workspace_id) references public.approval_requests(id,workspace_id),
  constraint affiliate_experiments_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_experiments_workspace_idempotency_unique unique(workspace_id,idempotency_key),
  constraint affiliate_experiments_actual_evidence_check check(result_truth_class<>'Actual' or evidence_candidate_id is not null)
);

create table public.affiliate_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  snapshot_type text not null check(snapshot_type in('opportunity_score','swot','strategy','content_plan','forecast','brand_audit','duplicate_audit','ai_meeting')),
  version integer not null default 1 check(version>0), lifecycle_status text not null default 'draft' check(lifecycle_status in('draft','review','owner_approved','superseded','archived')),
  truth_class text not null check(truth_class in('Forecast','Inference','Unknown','Mock','Test')), generated_at timestamptz not null,
  source_reference text not null, assumptions text[] not null default '{}', confidence numeric(5,4) check(confidence is null or confidence between 0 and 1), model_version text not null,
  prompt_version text, prompt_hash text check(prompt_hash is null or prompt_hash~'^[a-f0-9]{64}$'), payload jsonb not null check(public.ai_metadata_is_safe(payload,0) and pg_column_size(payload)<=32768),
  idempotency_key text not null check(length(idempotency_key) between 8 and 240), external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_intelligence_snapshots_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_intelligence_snapshots_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_intelligence_snapshots_workspace_version_unique unique(workspace_id,affiliate_program_id,snapshot_type,version),
  constraint affiliate_intelligence_snapshots_workspace_idempotency_unique unique(workspace_id,idempotency_key),
  constraint affiliate_intelligence_snapshots_generated_truth_check check(truth_class not in('Forecast','Inference') or (cardinality(assumptions)>0 and confidence is not null))
);

create table public.affiliate_risk_findings (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  snapshot_id uuid, finding_type text not null, classification text not null check(classification in('PASS','REVIEW_REQUIRED','BLOCKED','UNKNOWN')),
  title text not null check(length(title) between 1 and 240), rationale text not null check(length(rationale) between 1 and 2000), source_reference text,
  lifecycle_status text not null default 'open' check(lifecycle_status in('open','reviewed','resolved','accepted','archived')),
  owner_decision_id uuid, external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_risk_findings_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_risk_findings_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_risk_findings_snapshot_workspace_fk foreign key(snapshot_id,workspace_id) references public.affiliate_intelligence_snapshots(id,workspace_id),
  constraint affiliate_risk_findings_decision_workspace_fk foreign key(owner_decision_id,workspace_id) references public.executive_decisions(id,workspace_id)
);

create table public.affiliate_alerts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  risk_finding_id uuid, severity text not null check(severity in('Critical','High','Medium','Low','Info')), alert_code text not null check(alert_code~'^[A-Z][A-Z0-9_]{2,63}$'),
  summary text not null check(length(summary) between 1 and 500), lifecycle_status text not null default 'open' check(lifecycle_status in('open','acknowledged','resolved','archived')),
  dedupe_key text not null check(length(dedupe_key) between 8 and 240), detected_at timestamptz not null default now(), resolved_at timestamptz,
  external_execution_allowed boolean not null default false check(external_execution_allowed=false), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_alerts_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_alerts_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_alerts_risk_workspace_fk foreign key(risk_finding_id,workspace_id) references public.affiliate_risk_findings(id,workspace_id),
  constraint affiliate_alerts_workspace_dedupe_unique unique(workspace_id,dedupe_key)
);

create table public.affiliate_daily_briefs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), brief_date date not null,
  rule_version text not null, action_count integer not null check(action_count between 0 and 3), decision_ids uuid[] not null default '{}',
  summary jsonb not null check(public.ai_metadata_is_safe(summary,0) and pg_column_size(summary)<=16384), truth_class text not null default 'Inference' check(truth_class in('Inference','Unknown','Mock','Test')),
  generated_at timestamptz not null, source_reference text not null, assumptions text[] not null default '{}', confidence numeric(5,4) check(confidence is null or confidence between 0 and 1), model_version text not null,
  lifecycle_status text not null default 'active' check(lifecycle_status in('active','superseded','archived')), external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint affiliate_daily_briefs_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_daily_briefs_workspace_date_version_unique unique(workspace_id,brief_date,rule_version),
  constraint affiliate_daily_briefs_generated_truth_check check(truth_class<>'Inference' or (cardinality(assumptions)>0 and confidence is not null))
);

create table public.reusable_business_assets (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), source_content_asset_id uuid,
  asset_type text not null check(asset_type in('prompt_reference','content_template','strategy_template','workflow_template','ai_employee_reference','offer_template','compliance_checklist','successful_pattern')),
  title text not null check(length(title) between 1 and 240), version text not null, maturity text not null check(maturity in('internal','review','approved','deprecated','archived')),
  ownership text not null, license_classification text not null check(license_classification in('internal_only','owned','licensed','unknown')),
  internal_reuse boolean not null default true, export_ready boolean not null default false check(export_ready=false), public_marketplace boolean not null default false check(public_marketplace=false), payment_enabled boolean not null default false check(payment_enabled=false),
  content_reference text not null, safe_metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(safe_metadata,0)),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint reusable_business_assets_id_workspace_unique unique(id,workspace_id),
  constraint reusable_business_assets_content_workspace_fk foreign key(source_content_asset_id,workspace_id) references public.content_assets(id,workspace_id),
  constraint reusable_business_assets_workspace_title_version_unique unique(workspace_id,asset_type,title,version)
);

create index affiliate_products_workspace_program_status_idx on public.affiliate_products(workspace_id,affiliate_program_id,lifecycle_status,updated_at desc);
create index affiliate_product_sources_workspace_product_status_idx on public.affiliate_product_sources(workspace_id,product_id,lifecycle_status);
create index affiliate_research_workspace_program_type_idx on public.affiliate_research_entities(workspace_id,affiliate_program_id,entity_type,lifecycle_status);
create index affiliate_experiments_workspace_program_status_idx on public.affiliate_experiments(workspace_id,affiliate_program_id,lifecycle_status,updated_at desc);
create index affiliate_snapshots_workspace_program_type_idx on public.affiliate_intelligence_snapshots(workspace_id,affiliate_program_id,snapshot_type,version desc);
create index affiliate_risks_workspace_program_class_idx on public.affiliate_risk_findings(workspace_id,affiliate_program_id,classification,lifecycle_status);
create index affiliate_alerts_workspace_severity_status_idx on public.affiliate_alerts(workspace_id,severity,lifecycle_status,detected_at desc);
create index affiliate_daily_briefs_workspace_date_idx on public.affiliate_daily_briefs(workspace_id,brief_date desc);
create index reusable_business_assets_workspace_type_idx on public.reusable_business_assets(workspace_id,asset_type,maturity,updated_at desc);

create function public.touch_affiliate_v2_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare v_table text; begin foreach v_table in array array['affiliate_products','affiliate_product_sources','affiliate_research_entities','affiliate_experiments','affiliate_intelligence_snapshots','affiliate_risk_findings','affiliate_alerts','affiliate_daily_briefs','reusable_business_assets'] loop
  execute format('create trigger affiliate_v2_touch_updated_at before update on public.%I for each row execute function public.touch_affiliate_v2_updated_at()',v_table);
end loop; end $$;

create function public.save_affiliate_intelligence_snapshot(p_affiliate_program_id uuid,p_snapshot_type text,p_truth_class text,p_input jsonb,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_program public.affiliate_programs; v_id uuid; v_actor uuid:=auth.uid(); v_version integer;
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  select * into v_program from public.affiliate_programs where id=p_affiliate_program_id;
  if v_program.id is null or not exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=v_program.workspace_id and wm.user_id=v_actor and wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active') then raise exception 'workspace_owner_access_denied'; end if;
  if p_snapshot_type not in('opportunity_score','swot','strategy','content_plan','forecast','brand_audit','duplicate_audit','ai_meeting') or p_truth_class not in('Forecast','Inference','Unknown','Mock','Test') then raise exception 'affiliate_snapshot_classification_invalid'; end if;
  if p_input is null or jsonb_typeof(p_input)<>'object' or pg_column_size(p_input)>32768 or not public.ai_metadata_is_safe(p_input,0) then raise exception 'affiliate_snapshot_input_invalid'; end if;
  if p_truth_class in('Forecast','Inference') and (nullif(p_input->>'sourceReference','') is null or jsonb_typeof(p_input->'assumptions')<>'array' or jsonb_array_length(p_input->'assumptions')=0 or p_input->>'confidence' is null or nullif(p_input->>'modelVersion','') is null) then raise exception 'affiliate_snapshot_truth_metadata_required'; end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) not between 8 and 240 then raise exception 'idempotency_key_invalid'; end if;
  select id into v_id from public.affiliate_intelligence_snapshots where workspace_id=v_program.workspace_id and idempotency_key=p_idempotency_key;
  if v_id is not null then return v_id; end if;
  select coalesce(max(version),0)+1 into v_version from public.affiliate_intelligence_snapshots where workspace_id=v_program.workspace_id and affiliate_program_id=v_program.id and snapshot_type=p_snapshot_type;
  insert into public.affiliate_intelligence_snapshots(workspace_id,affiliate_program_id,snapshot_type,version,truth_class,generated_at,source_reference,assumptions,confidence,model_version,prompt_version,prompt_hash,payload,idempotency_key)
  values(v_program.workspace_id,v_program.id,p_snapshot_type,v_version,p_truth_class,coalesce((p_input->>'generatedAt')::timestamptz,now()),p_input->>'sourceReference',array(select jsonb_array_elements_text(coalesce(p_input->'assumptions','[]'))),nullif(p_input->>'confidence','')::numeric,p_input->>'modelVersion',p_input->>'promptVersion',p_input->>'promptHash',p_input->'payload',p_idempotency_key) returning id into v_id;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata) values(v_program.workspace_id,'affiliate_intelligence_snapshot',v_id,'affiliate_intelligence_snapshot_saved','owner',v_actor::text,jsonb_build_object('snapshot_type',p_snapshot_type,'truth_class',p_truth_class,'version',v_version,'external_execution','LOCKED'));
  return v_id;
end $$;

do $$ declare v_table text; begin foreach v_table in array array['affiliate_products','affiliate_product_sources','affiliate_research_entities','affiliate_experiments','affiliate_intelligence_snapshots','affiliate_risk_findings','affiliate_alerts','affiliate_daily_briefs','reusable_business_assets'] loop
  execute format('alter table public.%I enable row level security',v_table);
  execute format('create policy affiliate_v2_owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active'' and op.role=''owner'' and op.status=''active''))',v_table,v_table);
  execute format('revoke all on table public.%I from public,anon,authenticated',v_table);
  execute format('grant select on table public.%I to authenticated,service_role',v_table);
end loop; end $$;

revoke all on function public.touch_affiliate_v2_updated_at() from public,anon,authenticated;
revoke all on function public.save_affiliate_intelligence_snapshot(uuid,text,text,jsonb,text) from public,anon;
grant execute on function public.save_affiliate_intelligence_snapshot(uuid,text,text,jsonb,text) to authenticated,service_role;

commit;


