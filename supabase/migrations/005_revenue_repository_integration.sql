begin;

alter table public.opportunities add column if not exists idempotency_key text;
alter table public.evidence_candidates add column if not exists brand_id uuid references public.brand_profiles(id);
alter table public.evidence_candidates add column if not exists client_id uuid references public.clients(id);
alter table public.evidence_candidates add column if not exists lane text check (lane in ('service','affiliate','digital_product','media'));
alter table public.evidence_candidates add column if not exists sensitivity_level text not null default 'financial_data'
  check (sensitivity_level in ('internal','confidential','restricted','personal_data','sensitive_personal_data','customer_confidential','financial_data'));
create unique index if not exists opportunities_workspace_idempotency_idx
  on public.opportunities(workspace_id,idempotency_key) where idempotency_key is not null;

create or replace function public.create_revenue_candidate(
  p_workspace_id uuid, p_brand_id uuid, p_idempotency_key text, p_candidate jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid(); v_opportunity uuid; v_campaign uuid; v_task uuid;
  v_artifact uuid; v_approval uuid; v_workflow uuid; v_lane text;
begin
  if v_owner is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'workspace_access_denied'; end if;
  if not exists(select 1 from public.brand_profiles where id=p_brand_id and workspace_id=p_workspace_id and slug='kevirio') then raise exception 'brand_workspace_mismatch'; end if;
  if coalesce(btrim(p_idempotency_key),'')='' then raise exception 'idempotency_key_required'; end if;
  v_lane := p_candidate->>'lane';
  if v_lane not in ('service','affiliate','digital_product','media') then raise exception 'lane_invalid'; end if;
  select id into v_opportunity from public.opportunities where workspace_id=p_workspace_id and idempotency_key=p_idempotency_key;
  if v_opportunity is not null then
    select id into v_campaign from public.campaigns where opportunity_id=v_opportunity order by created_at limit 1;
    return jsonb_build_object('status','already_exists','opportunityId',v_opportunity,'campaignId',v_campaign);
  end if;
  insert into public.opportunities(
    workspace_id,brand_id,source_signal_id,title,summary,lane,status,score_snapshot,
    confidence_snapshot,risk_snapshot,provenance,freshness_at,expires_at,created_by,idempotency_key
  ) values (
    p_workspace_id,p_brand_id,p_candidate->>'sourceSignalId',p_candidate->>'title',
    p_candidate->>'summary',v_lane,'proceeding',coalesce(p_candidate->'scoreSnapshot','{}'),
    coalesce(p_candidate->'confidenceSnapshot','{}'),coalesce(p_candidate->'riskSnapshot','{}'),
    coalesce(p_candidate->'provenance','{}'),(p_candidate->>'freshnessAt')::timestamptz,
    (p_candidate->>'expiresAt')::timestamptz,v_owner,p_idempotency_key
  ) returning id into v_opportunity;
  insert into public.owner_decisions(workspace_id,opportunity_id,opportunity_version,decision,reason,decided_by)
    values(p_workspace_id,v_opportunity,1,'proceed','Owner initiated the production candidate',v_owner);
  insert into public.campaigns(
    workspace_id,brand_id,opportunity_id,business_mode,lane,status,offer,channel,
    forecast_currency,forecast_revenue_minor,forecast_cost_minor,external_execution_allowed
  ) values (
    p_workspace_id,p_brand_id,v_opportunity,'own_business',v_lane,'review_required',
    coalesce(p_candidate->'offer','{}'),coalesce(p_candidate->>'channel','manual'),
    coalesce(p_candidate->>'forecastCurrency','JPY'),
    greatest(0,coalesce((p_candidate->>'forecastRevenueMinor')::bigint,0)),
    greatest(0,coalesce((p_candidate->>'forecastCostMinor')::bigint,0)),false
  ) returning id into v_campaign;
  insert into public.tasks(campaign_id,workspace_id,type,status,assignee_type,input_ref,output_ref)
    values(v_campaign,p_workspace_id,'prepare_manual_revenue_package','completed','ai',
      jsonb_build_object('opportunityId',v_opportunity),jsonb_build_object('externalExecutionAllowed',false))
    returning id into v_task;
  insert into public.artifacts(
    workspace_id,brand_id,campaign_id,task_id,type,status,content_json,sensitivity_level,
    external_output_allowed,provider_output_allowed,provenance
  ) values (
    p_workspace_id,p_brand_id,v_campaign,v_task,'manual_revenue_package','review_required',
    coalesce(p_candidate->'artifact',jsonb_build_object('title',p_candidate->>'title')),
    'internal',false,false,jsonb_build_object('source','market_intelligence','dataMode',coalesce(p_candidate->>'dataMode','mock'))
  ) returning id into v_artifact;
  insert into public.approval_requests(
    workspace_id,campaign_id,artifact_id,scope,requested_by,risk_snapshot,preview_snapshot,idempotency_key
  ) values (
    p_workspace_id,v_campaign,v_artifact,'internal_artifact',v_owner,
    coalesce(p_candidate->'riskSnapshot','{}'),jsonb_build_object(
      'artifactId',v_artifact,'artifactVersion',1,'campaignId',v_campaign,'externalExecutionAllowed',false
    ),p_idempotency_key||':artifact-approval'
  ) returning id into v_approval;
  insert into public.workflow_runs(
    workspace_id,workflow_type,entity_type,entity_id,status,current_step,correlation_id,input_snapshot,started_at
  ) values (
    p_workspace_id,'revenue_mvp','campaign',v_campaign,'paused_for_approval','owner_artifact_approval',
    p_idempotency_key,jsonb_build_object('opportunityId',v_opportunity,'approvalRequestId',v_approval),now()
  ) returning id into v_workflow;
  insert into public.workflow_steps(workflow_run_id,workspace_id,step_key,sequence,status,idempotency_key,output_summary,completed_at)
  values
    (v_workflow,p_workspace_id,'opportunity_selected',10,'completed',p_idempotency_key||':step:opportunity',jsonb_build_object('opportunityId',v_opportunity),now()),
    (v_workflow,p_workspace_id,'campaign_prepared',20,'completed',p_idempotency_key||':step:campaign',jsonb_build_object('campaignId',v_campaign),now()),
    (v_workflow,p_workspace_id,'owner_artifact_approval',30,'paused',p_idempotency_key||':step:approval',jsonb_build_object('approvalRequestId',v_approval),null),
    (v_workflow,p_workspace_id,'manual_execution',40,'pending',p_idempotency_key||':step:manual', '{}'::jsonb,null),
    (v_workflow,p_workspace_id,'actual_revenue_verification',50,'pending',p_idempotency_key||':step:revenue','{}'::jsonb,null);
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
    values(p_workspace_id,'owner',v_owner::text,'revenue_candidate.created','campaign',v_campaign,p_idempotency_key,
      jsonb_build_object('externalExecutionAllowed',false,'approvalRequestId',v_approval));
  return jsonb_build_object('status','created','opportunityId',v_opportunity,'campaignId',v_campaign,
    'artifactId',v_artifact,'approvalRequestId',v_approval,'workflowRunId',v_workflow);
end $$;

revoke all on function public.create_revenue_candidate(uuid,uuid,text,jsonb) from public, anon;
grant execute on function public.create_revenue_candidate(uuid,uuid,text,jsonb) to authenticated;

create or replace function public.register_revenue_evidence(
  p_workspace_id uuid, p_campaign_id uuid, p_source_type text, p_source_reference text,
  p_amount_minor bigint, p_cost_amount_minor bigint, p_currency text, p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid:=auth.uid(); v_campaign public.campaigns; v_evidence uuid; v_approval uuid;
begin
  select * into v_campaign from public.campaigns where id=p_campaign_id and workspace_id=p_workspace_id;
  if v_owner is null or v_campaign.id is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'campaign_access_denied'; end if;
  if p_source_type not in ('invoice_paid','bank_reference','marketplace_order','signed_contract','affiliate_commission','platform_sales_export') then raise exception 'source_type_invalid'; end if;
  if p_amount_minor < 0 or p_cost_amount_minor < 0 or p_currency !~ '^[A-Z]{3}$' then raise exception 'evidence_amount_invalid'; end if;
  insert into public.evidence_candidates(
    workspace_id,brand_id,client_id,campaign_id,source_type,source_reference,amount_minor,cost_amount_minor,
    currency,occurred_at,verification_status,submitted_by,lane,sensitivity_level
  ) values (
    p_workspace_id,v_campaign.brand_id,v_campaign.client_id,p_campaign_id,p_source_type,p_source_reference,
    p_amount_minor,p_cost_amount_minor,p_currency,p_occurred_at,'verification_required',v_owner,v_campaign.lane,'financial_data'
  ) on conflict(workspace_id,source_type,source_reference) do nothing returning id into v_evidence;
  if v_evidence is null then
    select id into v_evidence from public.evidence_candidates
      where workspace_id=p_workspace_id and source_type=p_source_type and source_reference=p_source_reference;
  end if;
  insert into public.approval_requests(
    workspace_id,campaign_id,scope,requested_by,risk_snapshot,preview_snapshot,idempotency_key
  ) values (
    p_workspace_id,p_campaign_id,'actual_revenue_verification',v_owner,
    jsonb_build_object('actualEvidenceRequiresOwnerVerification',true),
    jsonb_build_object('evidenceCandidateId',v_evidence,'amountMinor',p_amount_minor,'costAmountMinor',p_cost_amount_minor,
      'currency',p_currency,'occurredAt',p_occurred_at,'sourceType',p_source_type,'sourceReference',p_source_reference),
    'evidence:'||v_evidence::text
  ) on conflict(workspace_id,idempotency_key) do nothing returning id into v_approval;
  if v_approval is null then
    select id into v_approval from public.approval_requests
      where workspace_id=p_workspace_id and idempotency_key='evidence:'||v_evidence::text;
  end if;
  return jsonb_build_object('status','verification_required','evidenceCandidateId',v_evidence,'approvalRequestId',v_approval);
end $$;

revoke all on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz) from public, anon;
grant execute on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz) to authenticated;

commit;
