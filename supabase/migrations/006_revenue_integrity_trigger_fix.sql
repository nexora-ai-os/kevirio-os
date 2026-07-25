begin;

-- Migration 003 attached one trigger function to tables with different row
-- shapes. Convert NEW to jsonb before reading table-specific fields so that
-- PostgreSQL never resolves a field that is absent from the current relation.
create or replace function public.enforce_revenue_workspace_integrity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := to_jsonb(new);
  v_workspace_id uuid := nullif(v_new->>'workspace_id','')::uuid;
  v_brand_id uuid := nullif(v_new->>'brand_id','')::uuid;
  v_client_id uuid := nullif(v_new->>'client_id','')::uuid;
  v_opportunity_id uuid := nullif(v_new->>'opportunity_id','')::uuid;
  v_campaign_id uuid := nullif(v_new->>'campaign_id','')::uuid;
  v_task_id uuid := nullif(v_new->>'task_id','')::uuid;
  v_artifact_id uuid := nullif(v_new->>'artifact_id','')::uuid;
  v_approval_request_id uuid := nullif(v_new->>'approval_request_id','')::uuid;
  v_evidence_candidate_id uuid := nullif(v_new->>'evidence_candidate_id','')::uuid;
  v_workflow_run_id uuid := nullif(v_new->>'workflow_run_id','')::uuid;
begin
  if v_workspace_id is null or not public.is_active_workspace_member(v_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  if tg_table_name in ('opportunities','campaigns','artifacts','revenue_records')
    and (v_brand_id is null or not exists(
      select 1 from public.brand_profiles b where b.id=v_brand_id and b.workspace_id=v_workspace_id
    )) then raise exception 'brand_workspace_mismatch';
  end if;

  if tg_table_name in ('opportunities','campaigns','artifacts','revenue_records')
    and v_client_id is not null and not exists(
      select 1 from public.clients c where c.id=v_client_id and c.workspace_id=v_workspace_id
    ) then raise exception 'client_workspace_mismatch';
  end if;

  if tg_table_name='owner_decisions' and (v_opportunity_id is null or not exists(
    select 1 from public.opportunities o where o.id=v_opportunity_id and o.workspace_id=v_workspace_id
  )) then raise exception 'opportunity_workspace_mismatch';
  end if;

  if tg_table_name='campaigns' and (v_opportunity_id is null or not exists(
    select 1 from public.opportunities o where o.id=v_opportunity_id and o.workspace_id=v_workspace_id
  )) then raise exception 'opportunity_workspace_mismatch';
  end if;

  if tg_table_name='tasks' and (v_campaign_id is null or not exists(
    select 1 from public.campaigns c where c.id=v_campaign_id and c.workspace_id=v_workspace_id
  )) then raise exception 'campaign_workspace_mismatch';
  end if;

  if tg_table_name='artifacts' and (v_campaign_id is null or not exists(
    select 1 from public.campaigns c where c.id=v_campaign_id and c.workspace_id=v_workspace_id
  )) then raise exception 'campaign_workspace_mismatch';
  end if;
  if tg_table_name='artifacts' and v_task_id is not null and not exists(
    select 1 from public.tasks t
      where t.id=v_task_id and t.campaign_id=v_campaign_id and t.workspace_id=v_workspace_id
  ) then raise exception 'artifact_task_workspace_mismatch';
  end if;

  if tg_table_name='approval_requests' and v_campaign_id is not null and not exists(
    select 1 from public.campaigns c where c.id=v_campaign_id and c.workspace_id=v_workspace_id
  ) then raise exception 'campaign_workspace_mismatch';
  end if;
  if tg_table_name='approval_requests' and v_artifact_id is not null and not exists(
    select 1 from public.artifacts a
      where a.id=v_artifact_id and a.workspace_id=v_workspace_id
        and (v_campaign_id is null or a.campaign_id=v_campaign_id)
  ) then raise exception 'approval_artifact_workspace_mismatch';
  end if;

  if tg_table_name='approval_decisions' and (v_approval_request_id is null or not exists(
    select 1 from public.approval_requests a
      where a.id=v_approval_request_id and a.workspace_id=v_workspace_id
  )) then raise exception 'approval_workspace_mismatch';
  end if;

  if tg_table_name='execution_packages' and not exists(
    select 1 from public.campaigns c
    join public.approval_requests a on a.id=v_approval_request_id
    where c.id=v_campaign_id and c.workspace_id=v_workspace_id
      and a.workspace_id=v_workspace_id and a.campaign_id=c.id
  ) then raise exception 'execution_workspace_mismatch';
  end if;

  if tg_table_name='evidence_candidates' and (v_campaign_id is null or not exists(
    select 1 from public.campaigns c where c.id=v_campaign_id and c.workspace_id=v_workspace_id
  )) then raise exception 'campaign_workspace_mismatch';
  end if;

  if tg_table_name='revenue_records' and (v_evidence_candidate_id is null or not exists(
    select 1 from public.evidence_candidates e
      where e.id=v_evidence_candidate_id and e.workspace_id=v_workspace_id
        and e.campaign_id=v_campaign_id and e.verification_status='verified'
  )) then raise exception 'verified_evidence_required';
  end if;

  if tg_table_name='workflow_steps' and (v_workflow_run_id is null or not exists(
    select 1 from public.workflow_runs w
      where w.id=v_workflow_run_id and w.workspace_id=v_workspace_id
  )) then raise exception 'workflow_workspace_mismatch';
  end if;

  return new;
end $$;

revoke all on function public.enforce_revenue_workspace_integrity() from public, anon, authenticated;

-- Recreate the original integrity attachments explicitly. No protection is
-- removed; the trigger/function contract is made deterministic per row shape.
drop trigger if exists opportunities_workspace_integrity on public.opportunities;
create trigger opportunities_workspace_integrity before insert or update on public.opportunities
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists owner_decisions_workspace_integrity on public.owner_decisions;
create trigger owner_decisions_workspace_integrity before insert or update on public.owner_decisions
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists campaigns_workspace_integrity on public.campaigns;
create trigger campaigns_workspace_integrity before insert or update on public.campaigns
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists tasks_workspace_integrity on public.tasks;
create trigger tasks_workspace_integrity before insert or update on public.tasks
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists artifacts_workspace_integrity on public.artifacts;
create trigger artifacts_workspace_integrity before insert or update on public.artifacts
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists approval_requests_workspace_integrity on public.approval_requests;
create trigger approval_requests_workspace_integrity before insert or update on public.approval_requests
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists approval_decisions_workspace_integrity on public.approval_decisions;
create trigger approval_decisions_workspace_integrity before insert on public.approval_decisions
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists execution_packages_workspace_integrity on public.execution_packages;
create trigger execution_packages_workspace_integrity before insert or update on public.execution_packages
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists evidence_candidates_workspace_integrity on public.evidence_candidates;
create trigger evidence_candidates_workspace_integrity before insert or update on public.evidence_candidates
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists revenue_records_workspace_integrity on public.revenue_records;
create trigger revenue_records_workspace_integrity before insert on public.revenue_records
for each row execute function public.enforce_revenue_workspace_integrity();
drop trigger if exists workflow_steps_workspace_integrity on public.workflow_steps;
create trigger workflow_steps_workspace_integrity before insert or update on public.workflow_steps
for each row execute function public.enforce_revenue_workspace_integrity();

-- Browser repository reads are SELECT-only and remain constrained by RLS.
revoke all privileges on table
  public.opportunities, public.owner_decisions, public.campaigns, public.tasks,
  public.artifacts, public.approval_requests, public.approval_decisions,
  public.execution_packages, public.evidence_candidates, public.revenue_records,
  public.workflow_runs, public.workflow_steps
from authenticated;
grant select on table
  public.opportunities, public.owner_decisions, public.campaigns, public.tasks,
  public.artifacts, public.approval_requests, public.approval_decisions,
  public.execution_packages, public.evidence_candidates, public.revenue_records,
  public.workflow_runs, public.workflow_steps
to authenticated;
revoke all privileges on table
  public.opportunities, public.owner_decisions, public.campaigns, public.tasks,
  public.artifacts, public.approval_requests, public.approval_decisions,
  public.execution_packages, public.evidence_candidates, public.revenue_records,
  public.workflow_runs, public.workflow_steps
from public, anon;

-- Preserve the protected RPC boundary after table privilege normalization.
revoke all on function public.create_revenue_candidate(uuid,uuid,text,jsonb) from public, anon;
revoke all on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz) from public, anon;
revoke all on function public.decide_approval(uuid,text,text,jsonb) from public, anon;
revoke all on function public.verify_evidence_and_record_revenue(uuid,uuid,uuid,text) from public, anon;
grant execute on function public.create_revenue_candidate(uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz) to authenticated;
grant execute on function public.decide_approval(uuid,text,text,jsonb) to authenticated;
grant execute on function public.verify_evidence_and_record_revenue(uuid,uuid,uuid,text) to authenticated;

commit;
