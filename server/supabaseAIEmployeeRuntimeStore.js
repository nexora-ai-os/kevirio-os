function fail(reasonCode){throw Object.assign(new Error(reasonCode),{reasonCode});}

export function createSupabaseAIEmployeeRuntimeStore(client,context={}){
  if(!client?.rpc||!context.workspaceId||!context.ownerId)return null;
  const workspaceId=context.workspaceId;
  const assertWorkspace=(value)=>{if(value!==workspaceId)fail("WORKSPACE_MISMATCH");};
  const rpc=async(name,args,reasonCode)=>{const {data,error}=await client.rpc(name,args);if(error)fail(reasonCode);return data;};
  return Object.freeze({
    createTask(task){assertWorkspace(task.workspaceId);return rpc("create_ai_employee_task",{p_workspace_id:workspaceId,p_owner_id:context.ownerId,p_ai_employee_id:task.aiEmployeeId,p_workflow_id:task.workflowId,p_task_key:task.taskId,p_correlation_id:task.correlationId,p_capability:task.capability,p_purpose:task.purpose,p_data_classification:task.dataClassification,p_parameters_metadata:task.parameters||{},p_idempotency_key:task.idempotencyKey,p_request_hash:task.requestHash,p_payload_hash:task.payloadHash,p_max_api_calls:task.maxApiCalls,p_max_records:task.maxRecords,p_max_duration_ms:task.maxDurationMs,p_cost_ceiling_jpy:task.costCeilingJpy,p_approval_id:task.approvalId||null,p_expires_at:task.expiresAt||null,p_retention_until:task.retentionUntil||null},"AI_TASK_CREATE_FAILED");},
    transition({taskId,expectedStatus,nextStatus,eventType,idempotencyKey,metrics={},normalizedError=null}){return rpc("transition_ai_employee_task",{p_workspace_id:workspaceId,p_task_id:taskId,p_expected_status:expectedStatus,p_next_status:nextStatus,p_event_type:eventType,p_event_idempotency_key:idempotencyKey,p_metrics:metrics,p_normalized_error:normalizedError},"AI_TASK_TRANSITION_FAILED");},
    reserveGoogleQuota({taskId,service,capability,unitType,estimatedUnits,idempotencyKey}){return rpc("reserve_google_quota",{p_workspace_id:workspaceId,p_task_id:taskId,p_service:service,p_capability:capability,p_unit_type:unitType,p_estimated_units:estimatedUnits,p_idempotency_key:idempotencyKey},"GOOGLE_QUOTA_RESERVATION_FAILED");},
    finalizeGoogleQuota({usageId,actualUnits,status}){return rpc("finalize_google_quota",{p_workspace_id:workspaceId,p_usage_id:usageId,p_actual_units:actualUnits,p_status:status},"GOOGLE_QUOTA_FINALIZE_FAILED");},
    releaseGoogleQuota({usageId}){return rpc("release_google_quota",{p_workspace_id:workspaceId,p_usage_id:usageId},"GOOGLE_QUOTA_RELEASE_FAILED");},
    createHandoff(input){return rpc("create_ai_employee_handoff",{p_workspace_id:workspaceId,p_task_id:input.taskId,p_source_capability:input.sourceCapability,p_target_employee_id:input.targetEmployeeId,p_target_capability:input.targetCapability,p_classification:input.classification,p_field_manifest:input.fieldManifest||[],p_metadata:input.metadata||{},p_parent_handoff_id:input.parentHandoffId||null,p_idempotency_key:input.idempotencyKey},"AI_HANDOFF_CREATE_FAILED");}
  });
}
