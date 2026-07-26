begin;

-- Manual execution remains an owner-operated boundary. This migration only
-- materializes an immutable package; it never sends, publishes, bills or calls
-- a third-party destination.
create or replace function public.generate_manual_execution_package(p_approval_request_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_request public.approval_requests;
  v_decision public.approval_decisions;
  v_campaign public.campaigns;
  v_artifact public.artifacts;
  v_workspace public.workspaces;
  v_brand public.brand_profiles;
  v_workflow public.workflow_runs;
  v_package uuid;
  v_artifact_version integer;
  v_key text;
  v_destination_type text;
  v_owner_action text;
  v_payload jsonb;
begin
  select * into v_request from public.approval_requests where id=p_approval_request_id for update;
  if v_owner is null or v_request.id is null or not public.is_active_workspace_member(v_request.workspace_id) then
    raise exception 'manual_package_workspace_denied';
  end if;
  if v_request.scope <> 'internal_artifact' or v_request.status <> 'approved' then
    raise exception 'manual_package_approval_required';
  end if;
  select * into v_decision from public.approval_decisions where approval_request_id=v_request.id and decision='approve';
  if v_decision.id is null or v_decision.decision_snapshot <> v_request.preview_snapshot then
    raise exception 'manual_package_snapshot_mismatch';
  end if;
  select * into v_campaign from public.campaigns where id=v_request.campaign_id and workspace_id=v_request.workspace_id;
  select * into v_artifact from public.artifacts where id=v_request.artifact_id and campaign_id=v_request.campaign_id and workspace_id=v_request.workspace_id;
  select * into v_workspace from public.workspaces where id=v_request.workspace_id;
  select * into v_brand from public.brand_profiles where id=v_campaign.brand_id and workspace_id=v_request.workspace_id;
  if v_campaign.id is null or v_artifact.id is null or v_brand.id is null then raise exception 'manual_package_workspace_mismatch'; end if;
  v_artifact_version := nullif(v_request.preview_snapshot->>'artifactVersion','')::integer;
  if v_artifact_version is null or v_artifact.version <> v_artifact_version
    or v_request.preview_snapshot->>'artifactId' <> v_artifact.id::text
    or v_request.preview_snapshot->>'campaignId' <> v_campaign.id::text then
    raise exception 'manual_package_snapshot_mismatch';
  end if;

  v_key := 'manual-package:'||v_request.id::text;
  v_destination_type := case
    when v_campaign.channel in ('email','newsletter') then 'email_draft'
    when v_campaign.channel in ('social','sns') then 'social_draft'
    when v_campaign.lane='service' then 'owner_selected_service_channel'
    else 'owner_selected_manual_channel' end;
  v_owner_action := 'Review the package, copy or download it, execute manually outside KEVIRIO, then register evidence.';
  v_payload := jsonb_build_object(
    'workspace',jsonb_build_object('id',v_workspace.id,'name',v_workspace.name,'slug',v_workspace.slug),
    'brand',jsonb_build_object('id',v_brand.id,'name',v_brand.name,'slug',v_brand.slug),
    'campaign',jsonb_build_object('id',v_campaign.id,'title',coalesce(v_campaign.offer->>'title','Untitled campaign'),'channel',v_campaign.channel),
    'artifactVersion',v_artifact.version,
    'approvalSnapshot',v_request.preview_snapshot,
    'lane',v_campaign.lane,
    'destinationType',v_destination_type,
    'ownerAction',v_owner_action,
    'idempotencyKey',v_key,
    'externalExecutionAllowed',false,
    'artifact',v_artifact.content_json
  );
  insert into public.execution_packages(
    workspace_id,campaign_id,approval_request_id,artifact_version,channel,destination,payload_snapshot,
    status,external_execution_allowed,idempotency_key
  ) values (
    v_request.workspace_id,v_campaign.id,v_request.id,v_artifact.version,v_campaign.channel,v_destination_type,
    v_payload,'ready',false,v_key
  ) on conflict(workspace_id,idempotency_key) do nothing returning id into v_package;
  if v_package is null then
    select id into v_package from public.execution_packages where workspace_id=v_request.workspace_id and idempotency_key=v_key;
  else
    update public.campaigns set status='execution_ready',updated_at=now() where id=v_campaign.id and status in ('review_required','approved_internal');
    update public.artifacts set status='approved',updated_at=now() where id=v_artifact.id and status='review_required';
    select * into v_workflow from public.workflow_runs where workspace_id=v_request.workspace_id and entity_id=v_campaign.id and workflow_type='revenue_mvp' for update;
    if v_workflow.id is not null then
      update public.workflow_steps set status='completed',completed_at=coalesce(completed_at,now()),output_summary=jsonb_build_object('approvalRequestId',v_request.id)
        where workflow_run_id=v_workflow.id and step_key='owner_artifact_approval';
      update public.workflow_steps set step_key='manual_package_ready',status='completed',completed_at=now(),output_summary=jsonb_build_object('executionPackageId',v_package,'externalExecutionAllowed',false)
        where workflow_run_id=v_workflow.id and step_key='manual_execution';
      update public.workflow_steps set step_key='evidence_waiting',status='available',available_at=now()
        where workflow_run_id=v_workflow.id and step_key='actual_revenue_verification';
      update public.workflow_runs set status='running',current_step='manual_package_ready',updated_at=now() where id=v_workflow.id;
    end if;
    insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
      values(v_request.workspace_id,'owner',v_owner::text,'manual_package.generated','execution_package',v_package,v_key,
        jsonb_build_object('approvalRequestId',v_request.id,'artifactVersion',v_artifact.version,'externalExecutionAllowed',false));
  end if;
  return v_package;
end $$;

revoke all on function public.generate_manual_execution_package(uuid) from public, anon;
grant execute on function public.generate_manual_execution_package(uuid) to authenticated;

-- Preserve the existing command signature while making approval + generation atomic.
create or replace function public.decide_approval(p_approval_request_id uuid, p_decision text, p_reason text, p_decision_snapshot jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_request public.approval_requests; v_id uuid; v_status text; v_package uuid;
begin
  select * into v_request from public.approval_requests where id=p_approval_request_id for update;
  if v_request.id is null or not public.is_active_workspace_member(v_request.workspace_id) or v_request.status<>'pending' then raise exception 'approval_not_available'; end if;
  if v_request.expires_at is not null and v_request.expires_at<=now() then update public.approval_requests set status='expired' where id=v_request.id; raise exception 'approval_expired'; end if;
  if p_decision not in ('approve','revise','reject','hold') or coalesce(btrim(p_reason),'')='' then raise exception 'approval_decision_invalid'; end if;
  if p_decision='approve' and p_decision_snapshot <> v_request.preview_snapshot then raise exception 'approval_snapshot_mismatch'; end if;
  v_status:=case p_decision when 'approve' then 'approved' when 'revise' then 'revision_requested' when 'reject' then 'rejected' else 'pending' end;
  insert into public.approval_decisions(approval_request_id,workspace_id,decision,decided_by,reason,decision_snapshot)
    values(v_request.id,v_request.workspace_id,p_decision,auth.uid(),p_reason,p_decision_snapshot) returning id into v_id;
  update public.approval_requests set status=v_status where id=v_request.id;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
    values(v_request.workspace_id,'owner',auth.uid()::text,'approval.decided','approval_request',v_request.id,v_request.id::text,jsonb_build_object('decision',p_decision,'status',v_status));
  if p_decision='approve' and v_request.scope='internal_artifact' then
    v_package := public.generate_manual_execution_package(v_request.id);
  end if;
  return v_id;
end $$;
revoke all on function public.decide_approval(uuid,text,text,jsonb) from public, anon;
grant execute on function public.decide_approval(uuid,text,text,jsonb) to authenticated;

create or replace function public.retrieve_manual_execution_packages(p_workspace_id uuid)
returns setof public.execution_packages language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'manual_package_workspace_denied'; end if;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,correlation_id,after_summary)
    values(p_workspace_id,'owner',auth.uid()::text,'manual_package.retrieved','execution_package','manual-package-retrieval',jsonb_build_object('externalExecutionAllowed',false));
  return query select * from public.execution_packages where workspace_id=p_workspace_id order by created_at desc;
end $$;
revoke all on function public.retrieve_manual_execution_packages(uuid) from public, anon;
grant execute on function public.retrieve_manual_execution_packages(uuid) to authenticated;

create or replace function public.record_manual_package_access(p_package_id uuid, p_action text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_package public.execution_packages; v_workflow uuid;
begin
  select * into v_package from public.execution_packages where id=p_package_id;
  if v_package.id is null or not public.is_active_workspace_member(v_package.workspace_id) then raise exception 'manual_package_workspace_denied'; end if;
  if p_action not in ('viewed','copied','downloaded') then raise exception 'manual_package_action_invalid'; end if;
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
    values(v_package.workspace_id,'owner',auth.uid()::text,'manual_package.'||p_action,'execution_package',v_package.id,v_package.id::text,jsonb_build_object('externalExecutionAllowed',false));
  if p_action in ('copied','downloaded') then
    select id into v_workflow from public.workflow_runs where workspace_id=v_package.workspace_id and entity_id=v_package.campaign_id and workflow_type='revenue_mvp';
    update public.workflow_runs set current_step='evidence_waiting',updated_at=now() where id=v_workflow and current_step='manual_package_ready';
  end if;
  return v_package.id;
end $$;
revoke all on function public.record_manual_package_access(uuid,text) from public, anon;
grant execute on function public.record_manual_package_access(uuid,text) to authenticated;

commit;
