begin;

create or replace function public.build_sales_ready_package_payload(p_approval_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_a public.approval_requests; v_c public.campaigns; v_o public.opportunities; v_r public.artifacts; v_title text; v_audience text; v_problem text;
begin
  select * into v_a from public.approval_requests where id=p_approval_request_id;
  select * into v_c from public.campaigns where id=v_a.campaign_id and workspace_id=v_a.workspace_id;
  select * into v_o from public.opportunities where id=v_c.opportunity_id and workspace_id=v_a.workspace_id;
  select * into v_r from public.artifacts where id=v_a.artifact_id and workspace_id=v_a.workspace_id;
  if v_a.id is null or v_a.scope<>'internal_artifact' or v_a.status<>'approved' or v_c.id is null or v_o.id is null or v_r.id is null then raise exception 'sales_package_source_invalid'; end if;
  if v_a.preview_snapshot->>'artifactId'<>v_r.id::text or (v_a.preview_snapshot->>'artifactVersion')::integer<>v_r.version then raise exception 'sales_package_snapshot_mismatch'; end if;
  v_title:=case when right(coalesce(nullif(btrim(v_o.title),''),'小規模事業者向けSNS・記事制作支援'),2)='提案' then v_o.title else coalesce(nullif(btrim(v_o.title),''),'小規模事業者向けSNS・記事制作支援')||' 提案' end;
  v_audience:=coalesce(nullif(btrim(v_c.offer->>'audience'),''),'SNSや記事制作を継続したい小規模事業者');
  v_problem:=coalesce(nullif(btrim(v_r.content_json->>'customerProblem'),''),nullif(btrim(v_o.summary),''),'発信に必要な時間と制作体制が不足している');
  return jsonb_build_object(
    'serviceName','KEVIRIO SNS・記事制作スターターパッケージ','campaignTitle',v_title,'targetCustomer',v_audience,'customerProblem',v_problem,
    'serviceSummary','事業内容を整理し、SNS投稿案と記事原稿を手動納品できる状態まで制作します。',
    'deliverables',jsonb_build_array('SNS投稿案 5本','解説記事 1本','投稿・公開チェックリスト'),
    'scopeIncluded',jsonb_build_array('構成設計','日本語原稿制作','ブランドトーン確認','指定回数内の修正'),
    'scopeExcluded',jsonb_build_array('SNSへの自動投稿','広告運用','成果保証','画像・動画の本制作','無制限修正'),
    'forecastPriceMinor',v_c.forecast_revenue_minor,'forecastCostMinor',v_c.forecast_cost_minor,'forecastNetMinor',v_c.forecast_revenue_minor-v_c.forecast_cost_minor,
    'currency',v_c.forecast_currency,'deliveryDays',7,'revisionLimit',2,
    'salesShortMessage',v_audience||'向けに、SNS投稿案5本と解説記事1本を7日で制作します。まずは内容確認からお気軽にご相談ください。',
    'salesLongProposal',v_audience||'の発信課題を整理し、継続的な情報発信を始めるためのSNS投稿案5本と解説記事1本を制作します。構成設計から日本語原稿、ブランドトーン確認までを含み、納品後の修正は2回まで対応します。予測価格は'||v_c.forecast_revenue_minor::text||'円です。成果保証、自動投稿、広告運用は含みません。',
    'executionChecklist',jsonb_build_array('Owner Previewで内容を確認','提案文をCopyまたはMarkdownで保存','KEVIRIO外で顧客へ手動提案','結果を示すEvidenceを登録'),
    'evidenceInstructions',jsonb_build_array('入金・契約・注文を確認できる参照番号を用意','実際の売上総額と原価を最小通貨単位で入力','発生日を入力','Owner承認後にActual Revenueを確定'),
    'disclosure','本Packageの金額はMock / Forecastです。実績売上ではありません。KEVIRIOは外部送信・契約・課金を実行しません。',
    'lane',v_c.lane,'destinationType',case when v_c.lane='service' then 'owner_selected_service_channel' else 'owner_selected_manual_channel' end,
    'artifactVersion',v_r.version,'approvalSnapshot',v_a.preview_snapshot,'externalExecutionAllowed',false
  );
end $$;
revoke all on function public.build_sales_ready_package_payload(uuid) from public, anon, authenticated;

-- These two one-time backfills run in the migration administrator context,
-- where auth.uid() is intentionally null. Validate every cross-workspace edge
-- explicitly before suspending only the matching row-integrity trigger.
do $$
begin
  if exists(
    select 1 from public.campaigns c
    left join public.opportunities o on o.id=c.opportunity_id and o.workspace_id=c.workspace_id
    left join public.brand_profiles b on b.id=c.brand_id and b.workspace_id=c.workspace_id
    left join public.clients cl on cl.id=c.client_id and cl.workspace_id=c.workspace_id
    where coalesce(btrim(c.offer->>'title'),'')=''
      and (o.id is null or b.id is null or (c.client_id is not null and cl.id is null))
  ) then raise exception 'migration_008_campaign_workspace_mismatch'; end if;
end $$;

alter table public.campaigns disable trigger campaigns_workspace_integrity;
update public.campaigns c set offer=c.offer||jsonb_build_object('title',case when right(o.title,2)='提案' then o.title else o.title||' 提案' end),updated_at=now()
from public.opportunities o where o.id=c.opportunity_id and coalesce(btrim(c.offer->>'title'),'')='';
alter table public.campaigns enable trigger campaigns_workspace_integrity;

do $$
begin
  if exists(
    select 1 from public.execution_packages ep
    left join public.campaigns c on c.id=ep.campaign_id and c.workspace_id=ep.workspace_id
    left join public.approval_requests ar on ar.id=ep.approval_request_id and ar.workspace_id=ep.workspace_id and ar.campaign_id=ep.campaign_id
    left join public.artifacts a on a.id=ar.artifact_id and a.workspace_id=ep.workspace_id and a.campaign_id=ep.campaign_id
    left join public.opportunities o on o.id=c.opportunity_id and o.workspace_id=ep.workspace_id
    where ep.status<>'superseded' and not (ep.payload_snapshot ? 'serviceName')
      and (c.id is null or ar.id is null or ar.scope<>'internal_artifact' or ar.status<>'approved'
        or a.id is null or o.id is null or ar.preview_snapshot->>'artifactId'<>a.id::text
        or nullif(ar.preview_snapshot->>'artifactVersion','')::integer<>a.version)
  ) then raise exception 'migration_008_package_workspace_mismatch'; end if;
end $$;

alter table public.execution_packages disable trigger execution_packages_workspace_integrity;
update public.execution_packages ep set payload_snapshot=public.build_sales_ready_package_payload(ep.approval_request_id)
where ep.status<>'superseded' and not (ep.payload_snapshot ? 'serviceName');
alter table public.execution_packages enable trigger execution_packages_workspace_integrity;

create unique index if not exists evidence_candidates_workspace_reference_idx on public.evidence_candidates(workspace_id,source_reference);

create or replace function public.retrieve_manual_execution_packages(p_workspace_id uuid)
returns setof public.execution_packages language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'manual_package_workspace_denied'; end if;
  update public.execution_packages ep set payload_snapshot=public.build_sales_ready_package_payload(ep.approval_request_id)
    where ep.workspace_id=p_workspace_id and ep.status<>'superseded' and not (ep.payload_snapshot ? 'serviceName');
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,correlation_id,after_summary)
    values(p_workspace_id,'owner',auth.uid()::text,'manual_package.retrieved','execution_package','manual-package-retrieval',jsonb_build_object('externalExecutionAllowed',false));
  return query select * from public.execution_packages where workspace_id=p_workspace_id order by created_at desc;
end $$;
revoke all on function public.retrieve_manual_execution_packages(uuid) from public, anon;
grant execute on function public.retrieve_manual_execution_packages(uuid) to authenticated;

create or replace function public.register_revenue_evidence(
  p_workspace_id uuid,p_campaign_id uuid,p_source_type text,p_source_reference text,p_amount_minor bigint,p_cost_amount_minor bigint,
  p_currency text,p_occurred_at timestamptz,p_note text,p_sensitivity_level text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_owner uuid:=auth.uid(); v_campaign public.campaigns; v_evidence uuid; v_approval uuid; v_workflow uuid;
begin
  select * into v_campaign from public.campaigns where id=p_campaign_id and workspace_id=p_workspace_id;
  if v_owner is null or v_campaign.id is null or not public.is_active_workspace_member(p_workspace_id) then raise exception 'campaign_access_denied'; end if;
  if not exists(select 1 from public.execution_packages where workspace_id=p_workspace_id and campaign_id=p_campaign_id and status in ('ready','exported') and external_execution_allowed=false) then raise exception 'manual_package_required'; end if;
  if p_source_type not in ('invoice_paid','bank_reference','marketplace_order','signed_contract','affiliate_commission','platform_sales_export') then raise exception 'source_type_invalid'; end if;
  if coalesce(btrim(p_source_reference),'')='' or p_amount_minor<0 or p_cost_amount_minor<0 or p_currency !~ '^[A-Z]{3}$' or p_occurred_at is null then raise exception 'evidence_input_invalid'; end if;
  if p_sensitivity_level<>'financial_data' then raise exception 'evidence_sensitivity_invalid'; end if;
  if exists(select 1 from public.evidence_candidates where workspace_id=p_workspace_id and source_reference=p_source_reference) then raise exception 'duplicate_evidence_reference'; end if;
  insert into public.evidence_candidates(workspace_id,brand_id,client_id,campaign_id,source_type,source_reference,amount_minor,cost_amount_minor,currency,occurred_at,evidence_payload,verification_status,submitted_by,lane,sensitivity_level)
    values(p_workspace_id,v_campaign.brand_id,v_campaign.client_id,p_campaign_id,p_source_type,btrim(p_source_reference),p_amount_minor,p_cost_amount_minor,p_currency,p_occurred_at,jsonb_build_object('ownerNote',nullif(btrim(p_note),''),'valueType','actual'),'verification_required',v_owner,v_campaign.lane,'financial_data') returning id into v_evidence;
  insert into public.approval_requests(workspace_id,campaign_id,scope,requested_by,risk_snapshot,preview_snapshot,idempotency_key)
    values(p_workspace_id,p_campaign_id,'actual_revenue_verification',v_owner,jsonb_build_object('actualEvidenceRequiresOwnerVerification',true),
      jsonb_build_object('evidenceCandidateId',v_evidence,'campaignId',p_campaign_id,'amountMinor',p_amount_minor,'costAmountMinor',p_cost_amount_minor,'currency',p_currency,'occurredAt',p_occurred_at,'sourceType',p_source_type,'sourceReference',btrim(p_source_reference)),
      'evidence:'||v_evidence::text) returning id into v_approval;
  select id into v_workflow from public.workflow_runs where workspace_id=p_workspace_id and entity_id=p_campaign_id and workflow_type='revenue_mvp';
  update public.workflow_runs set current_step='actual_revenue_approval',status='paused_for_approval',updated_at=now() where id=v_workflow and current_step='evidence_waiting';
  update public.workflow_steps set step_key='actual_revenue_approval',status='paused',output_summary=jsonb_build_object('evidenceCandidateId',v_evidence,'approvalRequestId',v_approval)
    where workflow_run_id=v_workflow and step_key='evidence_waiting';
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
    values(p_workspace_id,'owner',v_owner::text,'evidence.registered','evidence_candidate',v_evidence,v_evidence::text,jsonb_build_object('campaignId',p_campaign_id,'verificationStatus','verification_required'));
  return jsonb_build_object('status','verification_required','evidenceCandidateId',v_evidence,'approvalRequestId',v_approval);
end $$;
revoke all on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz,text,text) from public, anon;
grant execute on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz,text,text) to authenticated;
revoke all on function public.register_revenue_evidence(uuid,uuid,text,text,bigint,bigint,text,timestamptz) from authenticated;

create or replace function public.verify_evidence_and_record_revenue(p_evidence_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_e public.evidence_candidates; v_c public.campaigns; v_a public.approval_requests; v_d public.approval_decisions; v_record uuid; v_workflow uuid;
begin
  select * into v_e from public.evidence_candidates where id=p_evidence_id for update;
  if v_e.id is null or not public.is_active_workspace_member(v_e.workspace_id) then raise exception 'evidence_not_available'; end if;
  if exists(select 1 from public.revenue_records where evidence_candidate_id=v_e.id) then raise exception 'duplicate_revenue_record'; end if;
  if v_e.verification_status<>'verification_required' then raise exception 'evidence_not_verifiable'; end if;
  select * into v_c from public.campaigns where id=v_e.campaign_id and workspace_id=v_e.workspace_id;
  select * into v_a from public.approval_requests where workspace_id=v_e.workspace_id and campaign_id=v_e.campaign_id and scope='actual_revenue_verification' and status='approved' and preview_snapshot->>'evidenceCandidateId'=v_e.id::text order by created_at desc limit 1;
  select * into v_d from public.approval_decisions where approval_request_id=v_a.id and decision='approve';
  if v_a.id is null or v_d.id is null or v_d.decision_snapshot<>v_a.preview_snapshot
    or v_a.preview_snapshot->>'campaignId'<>v_e.campaign_id::text or (v_a.preview_snapshot->>'amountMinor')::bigint<>v_e.amount_minor
    or (v_a.preview_snapshot->>'costAmountMinor')::bigint<>v_e.cost_amount_minor or v_a.preview_snapshot->>'currency'<>v_e.currency then raise exception 'actual_revenue_snapshot_mismatch'; end if;
  update public.evidence_candidates set verification_status='verified',verified_by=auth.uid(),verified_at=now() where id=v_e.id;
  insert into public.revenue_records(workspace_id,brand_id,client_id,campaign_id,evidence_candidate_id,lane,currency,gross_amount_minor,cost_amount_minor,net_amount_minor,recognized_at,attribution,verification_method,verified_by)
    values(v_e.workspace_id,v_c.brand_id,v_c.client_id,v_e.campaign_id,v_e.id,v_c.lane,v_e.currency,v_e.amount_minor,v_e.cost_amount_minor,v_e.amount_minor-v_e.cost_amount_minor,v_e.occurred_at,jsonb_build_object('approvalRequestId',v_a.id),v_e.source_type,auth.uid()) returning id into v_record;
  update public.campaigns set status='revenue_verified',updated_at=now() where id=v_c.id;
  select id into v_workflow from public.workflow_runs where workspace_id=v_e.workspace_id and entity_id=v_e.campaign_id and workflow_type='revenue_mvp';
  update public.workflow_steps set step_key='revenue_recorded',status='completed',completed_at=now(),output_summary=jsonb_build_object('revenueRecordId',v_record) where workflow_run_id=v_workflow and step_key='actual_revenue_approval';
  update public.workflow_runs set current_step='revenue_recorded',status='completed',updated_at=now(),completed_at=now() where id=v_workflow and current_step='actual_revenue_approval';
  insert into public.audit_logs(workspace_id,actor_type,actor_id,action,entity_type,entity_id,correlation_id,after_summary)
    values(v_e.workspace_id,'owner',auth.uid()::text,'revenue.recorded','revenue_record',v_record,v_e.id::text,jsonb_build_object('currency',v_e.currency,'grossAmountMinor',v_e.amount_minor,'costAmountMinor',v_e.cost_amount_minor,'netAmountMinor',v_e.amount_minor-v_e.cost_amount_minor));
  return v_record;
end $$;
revoke all on function public.verify_evidence_and_record_revenue(uuid) from public, anon;
grant execute on function public.verify_evidence_and_record_revenue(uuid) to authenticated;
revoke all on function public.verify_evidence_and_record_revenue(uuid,uuid,uuid,text) from authenticated;

commit;
