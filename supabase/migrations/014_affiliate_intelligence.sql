begin;

-- Candidate only. Existing Offer, Approval, Evidence, Revenue, Cost, Content and
-- Execution tables remain canonical. This migration must not seed real offers.
do $$
declare parent_name text;
begin
  foreach parent_name in array array[
    'workspaces','workspace_members','owner_profiles','affiliate_offers','offer_operations','revenue_engines',
    'content_assets','execution_packages','evidence_candidates','revenue_records','operating_cost_records','company_operating_events'
  ] loop
    if to_regclass(format('public.%I',parent_name)) is null then
      raise exception 'm014_parent_missing:%',parent_name;
    end if;
  end loop;
  if exists(select 1 from pg_class where relnamespace='public'::regnamespace and relname in(
    'affiliate_programs','affiliate_materials','affiliate_publications','affiliate_performance_records'
  )) then raise exception 'm014_partial_schema_detected'; end if;
  if to_regprocedure('public.is_active_workspace_member(uuid)') is null or to_regprocedure('public.ai_metadata_is_safe(jsonb,integer)') is null then
    raise exception 'm014_required_function_missing';
  end if;
end $$;

do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.affiliate_offers'::regclass and conname='affiliate_offers_id_workspace_unique') then
    alter table public.affiliate_offers add constraint affiliate_offers_id_workspace_unique unique(id,workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.revenue_engines'::regclass and conname='revenue_engines_id_workspace_unique') then
    alter table public.revenue_engines add constraint revenue_engines_id_workspace_unique unique(id,workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.content_assets'::regclass and conname='content_assets_id_workspace_unique') then
    alter table public.content_assets add constraint content_assets_id_workspace_unique unique(id,workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.execution_packages'::regclass and conname='execution_packages_id_workspace_unique') then
    alter table public.execution_packages add constraint execution_packages_id_workspace_unique unique(id,workspace_id);
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.evidence_candidates'::regclass and conname='evidence_candidates_id_workspace_unique') then
    alter table public.evidence_candidates add constraint evidence_candidates_id_workspace_unique unique(id,workspace_id);
  end if;
end $$;

create table public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  offer_id uuid not null,
  revenue_engine_id uuid,
  asp_name text not null check(length(asp_name) between 1 and 120),
  advertiser_name text not null check(length(advertiser_name) between 1 and 200),
  program_name text not null check(length(program_name) between 1 and 240),
  program_code text check(program_code is null or length(program_code)<=120),
  commission_type text not null check(commission_type in('percentage','fixed','tiered','other')),
  commission_rate numeric(7,4) check(commission_rate is null or commission_rate between 0 and 100),
  commission_amount_minor bigint check(commission_amount_minor is null or commission_amount_minor>=0),
  currency text not null check(currency~'^[A-Z]{3}$'),
  conversion_conditions text not null default '', rejection_conditions text not null default '',
  listing_restrictions text not null default '', disclosure_requirements text not null default '', prohibited_claims text not null default '',
  target_audience text not null default '', claim_plan text not null default '', planned_channels text not null default '', evidence_plan text not null default '',
  official_product_url text, advertiser_program_url text, asp_management_url text,
  status text not null default 'research_required' check(status in('research_required','compliance_review','content_plan','owner_approval','manual_execution','evidence_pending','actual_review','learning_review','completed','cancelled')),
  preparation_step integer not null default 1 check(preparation_step between 1 and 10),
  owner_confirmed boolean not null default false,
  risk_level text not null default 'unknown' check(risk_level in('low','medium','high','unknown')),
  truth_class text not null default 'Unknown' check(truth_class in('Actual','Forecast','Inference','Unknown')),
  external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  idempotency_key text not null check(length(idempotency_key) between 8 and 240),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint affiliate_programs_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_programs_workspace_offer_unique unique(workspace_id,offer_id),
  constraint affiliate_programs_workspace_idempotency_unique unique(workspace_id,idempotency_key),
  constraint affiliate_programs_offer_workspace_fk foreign key(offer_id,workspace_id) references public.affiliate_offers(id,workspace_id),
  constraint affiliate_programs_engine_workspace_fk foreign key(revenue_engine_id,workspace_id) references public.revenue_engines(id,workspace_id),
  constraint affiliate_programs_official_url_check check(official_product_url is null or official_product_url~'^https?://[^[:space:]]{1,1990}$'),
  constraint affiliate_programs_advertiser_url_check check(advertiser_program_url is null or advertiser_program_url~'^https?://[^[:space:]]{1,1990}$'),
  constraint affiliate_programs_management_url_check check(asp_management_url is null or asp_management_url~'^https?://[^[:space:]]{1,1990}$')
);

create table public.affiliate_materials (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  material_reference text not null check(length(material_reference) between 1 and 200), material_type text not null check(material_type in('text_link','banner','image','html_reference','other')),
  width integer check(width is null or width>0), height integer check(height is null or height>0), destination_url text, tracking_reference text,
  source_reference text, status text not null default 'available' check(status in('available','selected','unused','expired','archived')),
  valid_until timestamptz, safe_metadata jsonb not null default '{}' check(public.ai_metadata_is_safe(safe_metadata,0)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint affiliate_materials_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_materials_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_materials_workspace_reference_unique unique(workspace_id,affiliate_program_id,material_reference),
  constraint affiliate_materials_destination_url_check check(destination_url is null or destination_url~'^https?://[^[:space:]]{1,1990}$')
);

create table public.affiliate_publications (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  content_asset_id uuid, execution_package_id uuid, evidence_candidate_id uuid, channel text not null,
  publication_url text, published_at timestamptz, manual_executor text,
  status text not null default 'planned' check(status in('planned','ready','manually_published','evidence_pending','verified','cancelled')),
  owner_confirmed boolean not null default false, external_execution_allowed boolean not null default false check(external_execution_allowed=false),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint affiliate_publications_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_publications_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_publications_content_workspace_fk foreign key(content_asset_id,workspace_id) references public.content_assets(id,workspace_id),
  constraint affiliate_publications_package_workspace_fk foreign key(execution_package_id,workspace_id) references public.execution_packages(id,workspace_id),
  constraint affiliate_publications_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_publications_url_check check(publication_url is null or publication_url~'^https?://[^[:space:]]{1,1990}$')
);

create table public.affiliate_performance_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id), affiliate_program_id uuid not null,
  publication_id uuid, evidence_candidate_id uuid, period_start date not null, period_end date not null check(period_end>=period_start),
  clicks bigint not null default 0 check(clicks>=0), conversions bigint not null default 0 check(conversions>=0),
  pending_revenue_minor bigint not null default 0 check(pending_revenue_minor>=0), approved_revenue_minor bigint not null default 0 check(approved_revenue_minor>=0),
  rejected_revenue_minor bigint not null default 0 check(rejected_revenue_minor>=0), cost_minor bigint not null default 0 check(cost_minor>=0),
  currency text not null check(currency~'^[A-Z]{3}$'), source_reference text not null,
  truth_class text not null default 'Actual' check(truth_class='Actual'), created_at timestamptz not null default now(),
  constraint affiliate_performance_id_workspace_unique unique(id,workspace_id),
  constraint affiliate_performance_program_workspace_fk foreign key(affiliate_program_id,workspace_id) references public.affiliate_programs(id,workspace_id),
  constraint affiliate_performance_publication_workspace_fk foreign key(publication_id,workspace_id) references public.affiliate_publications(id,workspace_id),
  constraint affiliate_performance_evidence_workspace_fk foreign key(evidence_candidate_id,workspace_id) references public.evidence_candidates(id,workspace_id),
  constraint affiliate_performance_workspace_source_unique unique(workspace_id,source_reference)
);

create index affiliate_programs_workspace_status_idx on public.affiliate_programs(workspace_id,status,updated_at desc);
create index affiliate_materials_workspace_program_status_idx on public.affiliate_materials(workspace_id,affiliate_program_id,status);
create index affiliate_publications_workspace_program_status_idx on public.affiliate_publications(workspace_id,affiliate_program_id,status);
create index affiliate_performance_workspace_program_period_idx on public.affiliate_performance_records(workspace_id,affiliate_program_id,period_end desc);

create function public.touch_affiliate_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare table_name text; begin foreach table_name in array array['affiliate_programs','affiliate_materials','affiliate_publications'] loop
  execute format('create trigger affiliate_touch_updated_at before update on public.%I for each row execute function public.touch_affiliate_updated_at()',table_name);
end loop; end $$;

create function public.save_affiliate_program_draft(p_offer_id uuid,p_input jsonb,p_preparation_step integer,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_offer public.affiliate_offers; v_id uuid; v_step integer:=greatest(1,least(coalesce(p_preparation_step,1),10)); v_status text; v_actor uuid:=auth.uid();
begin
  if auth.role()<>'authenticated' or v_actor is null then raise exception 'owner_authentication_required'; end if;
  if p_input is null or jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>20000 or not public.ai_metadata_is_safe(p_input,0) then
    raise exception 'affiliate_input_invalid';
  end if;
  if nullif(btrim(p_input->>'aspName'),'') is null or nullif(btrim(p_input->>'advertiserName'),'') is null or nullif(btrim(p_input->>'programName'),'') is null then
    raise exception 'affiliate_required_field_missing';
  end if;
  select * into v_offer from public.affiliate_offers where id=p_offer_id;
  if v_offer.id is null or not exists(
    select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id
    where wm.workspace_id=v_offer.workspace_id and wm.user_id=v_actor and wm.role='owner' and wm.status='active' and op.role='owner' and op.status='active'
  ) then raise exception 'workspace_owner_access_denied'; end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key))<8 or length(btrim(p_idempotency_key))>240 then raise exception 'idempotency_key_invalid'; end if;
  if p_input->>'commissionRate' is not null and (p_input->>'commissionRate')::numeric not between 0 and 100 then raise exception 'commission_rate_invalid'; end if;
  v_status:=case when v_step<=2 then 'research_required' when v_step<=4 then 'compliance_review' when v_step<=8 then 'content_plan' else 'owner_approval' end;
  insert into public.affiliate_programs(workspace_id,offer_id,asp_name,advertiser_name,program_name,program_code,commission_type,commission_rate,currency,
    conversion_conditions,rejection_conditions,listing_restrictions,disclosure_requirements,prohibited_claims,target_audience,claim_plan,planned_channels,evidence_plan,
    official_product_url,advertiser_program_url,asp_management_url,status,preparation_step,owner_confirmed,idempotency_key,created_by)
  values(v_offer.workspace_id,v_offer.id,btrim(p_input->>'aspName'),btrim(coalesce(p_input->>'advertiserName',v_offer.advertiser)),btrim(coalesce(p_input->>'programName',v_offer.title)),nullif(btrim(p_input->>'programCode'),''),
    coalesce(nullif(p_input->>'commissionType',''),'percentage'),nullif(p_input->>'commissionRate','')::numeric,upper(coalesce(nullif(p_input->>'currency',''),v_offer.currency)),
    coalesce(p_input->>'conversionConditions',''),coalesce(p_input->>'rejectionConditions',''),coalesce(p_input->>'listingRestrictions',''),coalesce(p_input->>'disclosureRequirements',''),
    coalesce(p_input->>'prohibitedClaims',''),coalesce(p_input->>'targetAudience',''),coalesce(p_input->>'claimPlan',''),coalesce(p_input->>'plannedChannels',''),coalesce(p_input->>'evidencePlan',''),
    nullif(btrim(p_input->>'officialProductUrl'),''),nullif(btrim(p_input->>'advertiserProgramUrl'),''),nullif(btrim(p_input->>'aspManagementUrl'),''),v_status,v_step,
    coalesce((p_input->>'ownerConfirmed')::boolean,false),p_idempotency_key,auth.uid())
  on conflict(workspace_id,offer_id) do update set
    asp_name=excluded.asp_name,advertiser_name=excluded.advertiser_name,program_name=excluded.program_name,program_code=excluded.program_code,
    commission_type=excluded.commission_type,commission_rate=excluded.commission_rate,currency=excluded.currency,conversion_conditions=excluded.conversion_conditions,
    rejection_conditions=excluded.rejection_conditions,listing_restrictions=excluded.listing_restrictions,disclosure_requirements=excluded.disclosure_requirements,
    prohibited_claims=excluded.prohibited_claims,target_audience=excluded.target_audience,claim_plan=excluded.claim_plan,planned_channels=excluded.planned_channels,evidence_plan=excluded.evidence_plan,
    official_product_url=excluded.official_product_url,advertiser_program_url=excluded.advertiser_program_url,asp_management_url=excluded.asp_management_url,
    status=excluded.status,preparation_step=greatest(public.affiliate_programs.preparation_step,excluded.preparation_step),owner_confirmed=excluded.owner_confirmed
  returning id into v_id;
  insert into public.company_operating_events(workspace_id,entity_type,entity_id,event_type,actor_type,actor_id,safe_metadata)
  values(v_offer.workspace_id,'affiliate_program',v_id,'affiliate_program_draft_saved','owner',v_actor::text,
    jsonb_build_object('preparation_step',v_step,'status',v_status,'external_execution','LOCKED'));
  return v_id;
end $$;

do $$ declare table_name text; begin foreach table_name in array array['affiliate_programs','affiliate_materials','affiliate_publications','affiliate_performance_records'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('create policy affiliate_owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=%I.workspace_id and wm.user_id=auth.uid() and wm.role=''owner'' and wm.status=''active'' and op.role=''owner'' and op.status=''active''))',table_name,table_name);
end loop; end $$;

revoke all on table public.affiliate_programs,public.affiliate_materials,public.affiliate_publications,public.affiliate_performance_records from public,anon,authenticated;
grant select on table public.affiliate_programs,public.affiliate_materials,public.affiliate_publications,public.affiliate_performance_records to authenticated,service_role;
revoke all on function public.touch_affiliate_updated_at() from public,anon,authenticated;
revoke all on function public.save_affiliate_program_draft(uuid,jsonb,integer,text) from public,anon;
grant execute on function public.save_affiliate_program_draft(uuid,jsonb,integer,text) to authenticated,service_role;

commit;
