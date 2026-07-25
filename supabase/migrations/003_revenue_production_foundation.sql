begin;

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
  slug text not null unique, name text not null, status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id), user_id uuid not null references auth.users(id),
  role text not null default 'owner' check (role in ('owner','member','reviewer')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(), primary key(workspace_id,user_id)
);
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  name text not null, slug text not null, business_owner_type text not null default 'kevirio_owner',
  external_ai_positioning text not null default 'accurate_disclosure',
  tone_profile jsonb not null default '{}'::jsonb, disclosure_policy jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,slug)
);
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  display_name text not null, status text not null default 'active' check (status in ('active','inactive','archived')),
  confidentiality_level text not null default 'customer_confidential',
  metadata jsonb not null default '{}'::jsonb, business_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), client_id uuid references public.clients(id),
  source_signal_id text, version integer not null default 1 check (version > 0), title text not null, summary text not null,
  lane text not null check (lane in ('service','affiliate','digital_product','media')),
  status text not null default 'discovered' check (status in ('discovered','ranked','recommended','proceeding','on_hold','rejected','expired')),
  score_snapshot jsonb not null default '{}'::jsonb, confidence_snapshot jsonb not null default '{}'::jsonb,
  risk_snapshot jsonb not null default '{}'::jsonb, provenance jsonb not null default '{}'::jsonb,
  freshness_at timestamptz, expires_at timestamptz, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,version)
);
create table if not exists public.owner_decisions (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  opportunity_id uuid not null references public.opportunities(id), opportunity_version integer not null,
  decision text not null check (decision in ('proceed','hold','reject')), reason text not null,
  decided_by uuid not null references auth.users(id), decided_at timestamptz not null default now(),
  supersedes_id uuid references public.owner_decisions(id), is_active boolean not null default true,
  unique(opportunity_id,opportunity_version,is_active)
);
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), client_id uuid references public.clients(id),
  opportunity_id uuid not null references public.opportunities(id),
  business_mode text not null check (business_mode in ('own_business','client_business')),
  lane text not null check (lane in ('service','affiliate','digital_product','media')),
  status text not null default 'draft' check (status in ('draft','preparing','review_required','revision_required','approved_internal','execution_ready','manually_executed','result_pending','evidence_pending','revenue_verified','closed','cancelled')),
  version integer not null default 1 check (version > 0), offer jsonb not null default '{}'::jsonb, channel text not null,
  forecast_currency text check (forecast_currency is null or forecast_currency ~ '^[A-Z]{3}$'),
  forecast_revenue_minor bigint check (forecast_revenue_minor is null or forecast_revenue_minor >= 0),
  forecast_cost_minor bigint check (forecast_cost_minor is null or forecast_cost_minor >= 0),
  revenue_owner text not null default 'kevirio_owner', cost_owner text not null default 'kevirio_owner',
  approval_owner text not null default 'owner', publication_destination text,
  external_execution_allowed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id),
  workspace_id uuid not null references public.workspaces(id), type text not null,
  status text not null default 'pending' check (status in ('pending','active','blocked','completed','cancelled')),
  assignee_type text not null check (assignee_type in ('owner','ai','partner')), assignee_ref text, due_at timestamptz,
  input_ref jsonb not null default '{}'::jsonb, output_ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), client_id uuid references public.clients(id),
  campaign_id uuid not null references public.campaigns(id), task_id uuid references public.tasks(id),
  type text not null, version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft','review_required','approved','superseded','archived')),
  content_json jsonb, storage_ref text,
  sensitivity_level text not null default 'internal' check (sensitivity_level in ('public','internal','confidential','restricted','personal_data','sensitive_personal_data','customer_confidential','authentication_data','financial_data','intellectual_property')),
  external_output_allowed boolean not null default false, provider_output_allowed boolean not null default false,
  provenance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign_id,type,version), check (content_json is not null or storage_ref is not null)
);
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid references public.campaigns(id), artifact_id uuid references public.artifacts(id),
  scope text not null check (scope in ('internal_artifact','external_publish','email_send','social_post','financial_commitment','oauth_scope_change','production_deploy','actual_revenue_verification')),
  status text not null default 'pending' check (status in ('pending','approved','revision_requested','rejected','expired','superseded')),
  requested_by uuid not null references auth.users(id), requested_at timestamptz not null default now(), expires_at timestamptz,
  risk_snapshot jsonb not null default '{}'::jsonb, preview_snapshot jsonb not null,
  idempotency_key text not null, created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
create table if not exists public.approval_decisions (
  id uuid primary key default gen_random_uuid(), approval_request_id uuid not null unique references public.approval_requests(id),
  workspace_id uuid not null references public.workspaces(id),
  decision text not null check (decision in ('approve','revise','reject','hold')), decided_by uuid not null references auth.users(id),
  reason text not null, decision_snapshot jsonb not null, decided_at timestamptz not null default now()
);
create table if not exists public.execution_packages (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid not null references public.campaigns(id), approval_request_id uuid not null references public.approval_requests(id),
  artifact_version integer not null, channel text not null, destination text not null, payload_snapshot jsonb not null,
  status text not null default 'ready' check (status in ('ready','exported','superseded','cancelled')),
  external_execution_allowed boolean not null default false, idempotency_key text not null,
  created_at timestamptz not null default now(), unique(workspace_id,idempotency_key)
);
create table if not exists public.evidence_candidates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  campaign_id uuid not null references public.campaigns(id), execution_package_id uuid references public.execution_packages(id),
  source_type text not null check (source_type in ('invoice_paid','bank_reference','marketplace_order','signed_contract','affiliate_commission','platform_sales_export')),
  source_reference text not null, amount_minor bigint not null check (amount_minor >= 0), cost_amount_minor bigint not null default 0 check (cost_amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'), occurred_at timestamptz not null,
  evidence_payload jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verification_required','verified','rejected','superseded')),
  submitted_by uuid not null references auth.users(id), verified_by uuid references auth.users(id), verified_at timestamptz,
  created_at timestamptz not null default now(), unique(workspace_id,source_type,source_reference)
);
create table if not exists public.revenue_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid not null references public.brand_profiles(id), client_id uuid references public.clients(id),
  campaign_id uuid not null references public.campaigns(id), evidence_candidate_id uuid not null unique references public.evidence_candidates(id),
  lane text not null check (lane in ('service','affiliate','digital_product','media')),
  currency text not null check (currency ~ '^[A-Z]{3}$'), gross_amount_minor bigint not null check (gross_amount_minor >= 0),
  cost_amount_minor bigint not null check (cost_amount_minor >= 0), net_amount_minor bigint not null,
  recognized_at timestamptz not null, attribution jsonb not null, verification_method text not null,
  verified_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  correction_of_id uuid references public.revenue_records(id),
  check (net_amount_minor = gross_amount_minor - cost_amount_minor)
);
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  workflow_type text not null, entity_type text not null, entity_id uuid not null,
  status text not null default 'pending' check (status in ('pending','running','paused_for_approval','completed','failed','cancelled')),
  current_step text, correlation_id text not null unique, input_snapshot jsonb not null default '{}'::jsonb,
  started_at timestamptz, updated_at timestamptz not null default now(), completed_at timestamptz, failure_code text
);
create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(), workflow_run_id uuid not null references public.workflow_runs(id),
  workspace_id uuid not null references public.workspaces(id), step_key text not null, sequence integer not null check (sequence >= 0),
  status text not null default 'pending' check (status in ('pending','available','running','paused','completed','failed','cancelled')),
  attempt integer not null default 0 check (attempt >= 0), max_attempts integer not null default 1 check (max_attempts between 1 and 5),
  idempotency_key text not null, input_snapshot jsonb not null default '{}'::jsonb, output_summary jsonb not null default '{}'::jsonb,
  error_code text, available_at timestamptz, started_at timestamptz, completed_at timestamptz,
  unique(workflow_run_id,step_key), unique(workspace_id,idempotency_key)
);
create table if not exists public.business_memory_records (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  brand_id uuid references public.brand_profiles(id), client_id uuid references public.clients(id),
  record_type text not null check (record_type in ('fact','generated_inference','decision','policy')),
  sensitivity_level text not null check (sensitivity_level in ('public','internal','confidential','restricted','personal_data','sensitive_personal_data','customer_confidential','financial_data','intellectual_property')),
  provenance jsonb not null, content_json jsonb not null, external_output_allowed boolean not null default false,
  provider_output_allowed boolean not null default false, retention_policy text not null, deletion_status text not null default 'active' check (deletion_status in ('active','deletion_requested','deleted')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id),
  actor_type text not null check (actor_type in ('owner','system','ai','partner')), actor_id text not null,
  action text not null, entity_type text not null, entity_id uuid, correlation_id text not null,
  before_summary jsonb, after_summary jsonb, metadata_sanitized jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_active_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.workspace_members wm join public.owner_profiles op on op.owner_id=wm.user_id where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid() and wm.status='active' and op.role='owner' and op.status='active') $$;
revoke all on function public.is_active_workspace_member(uuid) from public, anon;
grant execute on function public.is_active_workspace_member(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.opportunities enable row level security;
alter table public.owner_decisions enable row level security;
alter table public.campaigns enable row level security;
alter table public.tasks enable row level security;
alter table public.artifacts enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.execution_packages enable row level security;
alter table public.evidence_candidates enable row level security;
alter table public.revenue_records enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.business_memory_records enable row level security;
alter table public.audit_logs enable row level security;

create policy workspaces_member_all on public.workspaces for all to authenticated using (public.is_active_workspace_member(id)) with check (owner_id=auth.uid() and public.is_active_workspace_member(id));
create policy workspace_members_member_all on public.workspace_members for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy brand_profiles_member_all on public.brand_profiles for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy clients_member_all on public.clients for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy opportunities_member_all on public.opportunities for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy owner_decisions_member_all on public.owner_decisions for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy campaigns_member_all on public.campaigns for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy tasks_member_all on public.tasks for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy artifacts_member_all on public.artifacts for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy approval_requests_member_all on public.approval_requests for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy approval_decisions_member_all on public.approval_decisions for select to authenticated using (public.is_active_workspace_member(workspace_id));
create policy execution_packages_member_all on public.execution_packages for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy evidence_candidates_member_all on public.evidence_candidates for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy revenue_records_member_select on public.revenue_records for select to authenticated using (public.is_active_workspace_member(workspace_id));
create policy workflow_runs_member_all on public.workflow_runs for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy workflow_steps_member_all on public.workflow_steps for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy business_memory_member_all on public.business_memory_records for all to authenticated using (public.is_active_workspace_member(workspace_id)) with check (public.is_active_workspace_member(workspace_id));
create policy audit_logs_member_select on public.audit_logs for select to authenticated using (public.is_active_workspace_member(workspace_id));

create index if not exists opportunities_workspace_status_idx on public.opportunities(workspace_id,status);
create index if not exists campaigns_workspace_status_idx on public.campaigns(workspace_id,status);
create index if not exists approval_requests_workspace_status_idx on public.approval_requests(workspace_id,status);
create index if not exists evidence_candidates_workspace_status_idx on public.evidence_candidates(workspace_id,verification_status);
create index if not exists revenue_records_workspace_recognized_idx on public.revenue_records(workspace_id,recognized_at);
create index if not exists workflow_runs_workspace_status_idx on public.workflow_runs(workspace_id,status);
create index if not exists audit_logs_workspace_created_idx on public.audit_logs(workspace_id,created_at);

create or replace function public.enforce_revenue_workspace_integrity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_workspace_member(new.workspace_id) then raise exception 'workspace_access_denied'; end if;
  if tg_table_name in ('opportunities','campaigns','artifacts','revenue_records') and not exists(select 1 from public.brand_profiles b where b.id=new.brand_id and b.workspace_id=new.workspace_id) then raise exception 'brand_workspace_mismatch'; end if;
  if tg_table_name in ('opportunities','campaigns','artifacts','revenue_records') and new.client_id is not null and not exists(select 1 from public.clients c where c.id=new.client_id and c.workspace_id=new.workspace_id) then raise exception 'client_workspace_mismatch'; end if;
  if tg_table_name='owner_decisions' and not exists(select 1 from public.opportunities o where o.id=new.opportunity_id and o.workspace_id=new.workspace_id) then raise exception 'opportunity_workspace_mismatch'; end if;
  if tg_table_name='campaigns' and not exists(select 1 from public.opportunities o where o.id=new.opportunity_id and o.workspace_id=new.workspace_id) then raise exception 'opportunity_workspace_mismatch'; end if;
  if tg_table_name='tasks' and not exists(select 1 from public.campaigns c where c.id=new.campaign_id and c.workspace_id=new.workspace_id) then raise exception 'campaign_workspace_mismatch'; end if;
  if tg_table_name='artifacts' and not exists(select 1 from public.campaigns c where c.id=new.campaign_id and c.workspace_id=new.workspace_id) then raise exception 'campaign_workspace_mismatch'; end if;
  if tg_table_name='approval_requests' and new.campaign_id is not null and not exists(select 1 from public.campaigns c where c.id=new.campaign_id and c.workspace_id=new.workspace_id) then raise exception 'campaign_workspace_mismatch'; end if;
  if tg_table_name='approval_decisions' and not exists(select 1 from public.approval_requests a where a.id=new.approval_request_id and a.workspace_id=new.workspace_id) then raise exception 'approval_workspace_mismatch'; end if;
  if tg_table_name='execution_packages' and not exists(select 1 from public.campaigns c join public.approval_requests a on a.id=new.approval_request_id where c.id=new.campaign_id and c.workspace_id=new.workspace_id and a.workspace_id=new.workspace_id) then raise exception 'execution_workspace_mismatch'; end if;
  if tg_table_name='evidence_candidates' and not exists(select 1 from public.campaigns c where c.id=new.campaign_id and c.workspace_id=new.workspace_id) then raise exception 'campaign_workspace_mismatch'; end if;
  if tg_table_name='revenue_records' and not exists(select 1 from public.evidence_candidates e where e.id=new.evidence_candidate_id and e.workspace_id=new.workspace_id and e.verification_status='verified') then raise exception 'verified_evidence_required'; end if;
  if tg_table_name='workflow_steps' and not exists(select 1 from public.workflow_runs w where w.id=new.workflow_run_id and w.workspace_id=new.workspace_id) then raise exception 'workflow_workspace_mismatch'; end if;
  return new;
end $$;
revoke all on function public.enforce_revenue_workspace_integrity() from public, anon, authenticated;

create trigger opportunities_workspace_integrity before insert or update on public.opportunities for each row execute function public.enforce_revenue_workspace_integrity();
create trigger owner_decisions_workspace_integrity before insert or update on public.owner_decisions for each row execute function public.enforce_revenue_workspace_integrity();
create trigger campaigns_workspace_integrity before insert or update on public.campaigns for each row execute function public.enforce_revenue_workspace_integrity();
create trigger tasks_workspace_integrity before insert or update on public.tasks for each row execute function public.enforce_revenue_workspace_integrity();
create trigger artifacts_workspace_integrity before insert or update on public.artifacts for each row execute function public.enforce_revenue_workspace_integrity();
create trigger approval_requests_workspace_integrity before insert or update on public.approval_requests for each row execute function public.enforce_revenue_workspace_integrity();
create trigger approval_decisions_workspace_integrity before insert on public.approval_decisions for each row execute function public.enforce_revenue_workspace_integrity();
create trigger execution_packages_workspace_integrity before insert or update on public.execution_packages for each row execute function public.enforce_revenue_workspace_integrity();
create trigger evidence_candidates_workspace_integrity before insert or update on public.evidence_candidates for each row execute function public.enforce_revenue_workspace_integrity();
create trigger revenue_records_workspace_integrity before insert on public.revenue_records for each row execute function public.enforce_revenue_workspace_integrity();
create trigger workflow_steps_workspace_integrity before insert or update on public.workflow_steps for each row execute function public.enforce_revenue_workspace_integrity();

create or replace function public.bootstrap_owner_workspace(p_slug text, p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_owner uuid:=auth.uid(); v_workspace uuid;
begin
  if v_owner is null or not exists(select 1 from public.owner_profiles where owner_id=v_owner and role='owner' and status='active') then raise exception 'owner_not_active'; end if;
  insert into public.workspaces(owner_id,slug,name) values(v_owner,p_slug,p_name) on conflict(slug) do update set name=excluded.name where public.workspaces.owner_id=v_owner returning id into v_workspace;
  if v_workspace is null then raise exception 'workspace_slug_unavailable'; end if;
  insert into public.workspace_members(workspace_id,user_id,role,status) values(v_workspace,v_owner,'owner','active') on conflict(workspace_id,user_id) do update set status='active';
  insert into public.brand_profiles(workspace_id,name,slug,business_owner_type) values(v_workspace,'KEVIRIO','kevirio','kevirio_owner') on conflict(workspace_id,slug) do nothing;
  return v_workspace;
end $$;
revoke all on function public.bootstrap_owner_workspace(text,text) from public, anon;
grant execute on function public.bootstrap_owner_workspace(text,text) to authenticated;

create or replace function public.decide_approval(p_approval_request_id uuid, p_decision text, p_reason text, p_decision_snapshot jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_request public.approval_requests; v_id uuid; v_status text;
begin
  select * into v_request from public.approval_requests where id=p_approval_request_id for update;
  if v_request.id is null or not public.is_active_workspace_member(v_request.workspace_id) or v_request.status<>'pending' then raise exception 'approval_not_available'; end if;
  if v_request.expires_at is not null and v_request.expires_at<=now() then update public.approval_requests set status='expired' where id=v_request.id; raise exception 'approval_expired'; end if;
  if p_decision not in ('approve','revise','reject','hold') or coalesce(btrim(p_reason),'')='' then raise exception 'approval_decision_invalid'; end if;
  v_status:=case p_decision when 'approve' then 'approved' when 'revise' then 'revision_requested' when 'reject' then 'rejected' else 'pending' end;
  insert into public.approval_decisions(approval_request_id,workspace_id,decision,decided_by,reason,decision_snapshot) values(v_request.id,v_request.workspace_id,p_decision,auth.uid(),p_reason,p_decision_snapshot) returning id into v_id;
  update public.approval_requests set status=v_status where id=v_request.id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_request.workspace_id,'owner',auth.uid()::text,'approval.decided','approval_request',v_request.id,v_request.id::text,jsonb_build_object('decision',p_decision,'status',v_status));
  return v_id;
end $$;
revoke all on function public.decide_approval(uuid,text,text,jsonb) from public, anon;
grant execute on function public.decide_approval(uuid,text,text,jsonb) to authenticated;

create or replace function public.verify_evidence_and_record_revenue(p_evidence_id uuid, p_brand_id uuid, p_client_id uuid, p_lane text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_evidence public.evidence_candidates; v_record uuid; v_approval uuid;
begin
  select * into v_evidence from public.evidence_candidates where id=p_evidence_id for update;
  if v_evidence.id is null or not public.is_active_workspace_member(v_evidence.workspace_id) then raise exception 'evidence_not_available'; end if;
  if v_evidence.verification_status not in ('unverified','verification_required','verified') then raise exception 'evidence_not_verifiable'; end if;
  if p_lane not in ('service','affiliate','digital_product','media') then raise exception 'lane_invalid'; end if;
  if not exists(select 1 from public.brand_profiles where id=p_brand_id and workspace_id=v_evidence.workspace_id) then raise exception 'brand_workspace_mismatch'; end if;
  if p_client_id is not null and not exists(select 1 from public.clients where id=p_client_id and workspace_id=v_evidence.workspace_id) then raise exception 'client_workspace_mismatch'; end if;
  select ar.id into v_approval from public.approval_requests ar join public.approval_decisions ad on ad.approval_request_id=ar.id where ar.workspace_id=v_evidence.workspace_id and ar.campaign_id=v_evidence.campaign_id and ar.scope='actual_revenue_verification' and ar.status='approved' and ad.decision='approve' order by ad.decided_at desc limit 1;
  if v_approval is null then raise exception 'actual_revenue_approval_required'; end if;
  update public.evidence_candidates set verification_status='verified',verified_by=auth.uid(),verified_at=now() where id=v_evidence.id;
  insert into public.revenue_records(workspace_id,brand_id,client_id,campaign_id,evidence_candidate_id,lane,currency,gross_amount_minor,cost_amount_minor,net_amount_minor,recognized_at,attribution,verification_method,verified_by)
  values(v_evidence.workspace_id,p_brand_id,p_client_id,v_evidence.campaign_id,v_evidence.id,p_lane,v_evidence.currency,v_evidence.amount_minor,v_evidence.cost_amount_minor,v_evidence.amount_minor-v_evidence.cost_amount_minor,v_evidence.occurred_at,jsonb_build_object('approvalRequestId',v_approval),v_evidence.source_type,auth.uid())
  on conflict(evidence_candidate_id) do nothing returning id into v_record;
  if v_record is null then select id into v_record from public.revenue_records where evidence_candidate_id=v_evidence.id; end if;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary) values(v_evidence.workspace_id,'owner',auth.uid()::text,'revenue.recorded','revenue_record',v_record,v_evidence.id::text,jsonb_build_object('currency',v_evidence.currency,'grossAmountMinor',v_evidence.amount_minor));
  return v_record;
end $$;
revoke all on function public.verify_evidence_and_record_revenue(uuid,uuid,uuid,text) from public, anon;
grant execute on function public.verify_evidence_and_record_revenue(uuid,uuid,uuid,text) to authenticated;

commit;
