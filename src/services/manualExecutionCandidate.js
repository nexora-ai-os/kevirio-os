export const EXTERNAL_EXECUTION_STATUS = "LOCKED_NOT_CONFIGURED";

export function buildManualDirectServiceExecutionCandidate(input = {}) {
  if (!input.workspaceId || !input.campaignId || !input.approvalRequestId || !input.payloadSnapshot) return { ok:false, reasonCode:"EXECUTION_INPUT_INVALID" };
  if (input.approvalStatus !== "approved" || input.approvalScope !== "internal_artifact") return { ok:false, reasonCode:"APPROVAL_REQUIRED" };
  if (input.approvalSnapshotHash !== input.payloadSnapshotHash) return { ok:false, reasonCode:"APPROVAL_PAYLOAD_MISMATCH" };
  return { ok:true, candidate:{ workspaceId:input.workspaceId, campaignId:input.campaignId, approvalRequestId:input.approvalRequestId, channel:"direct_service_manual_export", destination:input.destination || "owner_selected_platform", payloadSnapshot:input.payloadSnapshot, idempotencyKey:input.idempotencyKey, status:"ready", externalExecutionAllowed:false, adapterStatus:EXTERNAL_EXECUTION_STATUS, dryRun:true, emergencyStopActive:true } };
}
