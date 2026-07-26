export const REVENUE_STATES = Object.freeze({
  opportunity: ["discovered", "ranked", "recommended", "proceeding", "on_hold", "rejected", "expired"],
  campaign: ["draft", "preparing", "review_required", "revision_required", "approved_internal", "execution_ready", "manually_executed", "result_pending", "evidence_pending", "revenue_verified", "closed", "cancelled"],
  approval: ["pending", "approved", "revision_requested", "rejected", "expired", "superseded"],
  evidence: ["unverified", "verification_required", "verified", "rejected", "superseded"],
});
const TRANSITIONS = Object.freeze({
  opportunity: { discovered: ["ranked"], ranked: ["recommended","on_hold","rejected","expired"], recommended: ["proceeding","on_hold","rejected","expired"], on_hold: ["recommended","rejected","expired"] },
  campaign: { draft: ["preparing","cancelled"], preparing: ["review_required","cancelled"], review_required: ["revision_required","approved_internal","cancelled"], revision_required: ["preparing","cancelled"], approved_internal: ["execution_ready","cancelled"], execution_ready: ["manually_executed","cancelled"], manually_executed: ["result_pending"], result_pending: ["evidence_pending"], evidence_pending: ["revenue_verified","cancelled"], revenue_verified: ["closed"] },
  approval: { pending: ["approved","revision_requested","rejected","expired","superseded"] },
  evidence: { unverified: ["verification_required","rejected","superseded"], verification_required: ["verified","rejected","superseded"] },
});

export function transitionRevenueEntity(entityType, currentState, nextState, command = {}) {
  if (!REVENUE_STATES[entityType]?.includes(currentState) || !REVENUE_STATES[entityType]?.includes(nextState)) return { ok:false, reasonCode:"UNKNOWN_STATE" };
  if (!command.idempotencyKey) return { ok:false, reasonCode:"IDEMPOTENCY_KEY_REQUIRED" };
  if (!TRANSITIONS[entityType]?.[currentState]?.includes(nextState)) return { ok:false, reasonCode:"TRANSITION_FORBIDDEN" };
  if (entityType === "campaign" && currentState === "approved_internal" && nextState === "execution_ready" && command.approvalSnapshotHash !== command.payloadSnapshotHash) return { ok:false, reasonCode:"APPROVAL_PAYLOAD_MISMATCH" };
  return { ok:true, entityType, previousState:currentState, nextState, idempotencyKey:command.idempotencyKey, correlationId:command.correlationId || command.idempotencyKey };
}

export function requiresReapproval(approvedArtifactVersion, currentArtifactVersion) {
  return Number(approvedArtifactVersion) !== Number(currentArtifactVersion);
}

export const REVENUE_WORKFLOW_STEPS=["owner_artifact_approval","manual_package_ready","evidence_waiting","actual_revenue_approval","revenue_recorded"];
export function transitionRevenueWorkflow(currentStep,nextStep) {
  const current=REVENUE_WORKFLOW_STEPS.indexOf(currentStep);const next=REVENUE_WORKFLOW_STEPS.indexOf(nextStep);
  return current>=0&&next===current+1?{ok:true,currentStep,nextStep}:{ok:false,reasonCode:"WORKFLOW_TRANSITION_FORBIDDEN"};
}
