export const EVENT_LEDGER_SCHEMA_VERSION = "1.0.0";
export const EVENT_VERSION = "1.0.0";
export const EVENT_LEDGER_SOURCE = "KEVIRIO_EVENT_LEDGER";

export const EVENT_VALUE_TYPES = Object.freeze({
  MOCK: "MOCK",
});

export const EVENT_ACTOR_TYPES = Object.freeze({
  HUMAN_OWNER: "HUMAN_OWNER",
  AI_EMPLOYEE: "AI_EMPLOYEE",
  SYSTEM: "SYSTEM",
});

export const EVENT_TARGET_TYPES = Object.freeze({
  OPPORTUNITY: "OPPORTUNITY",
  CAMPAIGN: "CAMPAIGN",
  WORKFLOW: "WORKFLOW",
  TASK: "TASK",
  CONTENT_ASSET: "CONTENT_ASSET",
  APPROVAL: "APPROVAL",
  REVENUE_RECORD: "REVENUE_RECORD",
  AI_EMPLOYEE: "AI_EMPLOYEE",
  SYSTEM: "SYSTEM",
});

export const EVENT_STATUSES = Object.freeze({
  RECORDED: "RECORDED",
  REJECTED: "REJECTED",
  DUPLICATE_BLOCKED: "DUPLICATE_BLOCKED",
});

export const EVENT_NAMES = Object.freeze([
  "opportunity.created",
  "campaign.created",
  "campaign.approved",
  "workflow.started",
  "workflow.completed",
  "workflow.failed",
  "task.assigned",
  "task.completed",
  "content.generated",
  "legal.reviewed",
  "quality.reviewed",
  "approval.requested",
  "owner.approved",
  "owner.rejected",
  "publish.prepared",
  "revenue.recorded",
  "employee.evaluated",
  "emergency_stop.activated",
  "emergency_stop.released",
  "budget.threshold_reached",
  "budget.exceeded",
]);

export const EVENT_TARGET_BY_NAME = Object.freeze({
  "opportunity.created": EVENT_TARGET_TYPES.OPPORTUNITY,
  "campaign.created": EVENT_TARGET_TYPES.CAMPAIGN,
  "campaign.approved": EVENT_TARGET_TYPES.CAMPAIGN,
  "workflow.started": EVENT_TARGET_TYPES.WORKFLOW,
  "workflow.completed": EVENT_TARGET_TYPES.WORKFLOW,
  "workflow.failed": EVENT_TARGET_TYPES.WORKFLOW,
  "task.assigned": EVENT_TARGET_TYPES.TASK,
  "task.completed": EVENT_TARGET_TYPES.TASK,
  "content.generated": EVENT_TARGET_TYPES.CONTENT_ASSET,
  "legal.reviewed": EVENT_TARGET_TYPES.CONTENT_ASSET,
  "quality.reviewed": EVENT_TARGET_TYPES.CONTENT_ASSET,
  "approval.requested": EVENT_TARGET_TYPES.APPROVAL,
  "owner.approved": EVENT_TARGET_TYPES.APPROVAL,
  "owner.rejected": EVENT_TARGET_TYPES.APPROVAL,
  "publish.prepared": EVENT_TARGET_TYPES.CONTENT_ASSET,
  "revenue.recorded": EVENT_TARGET_TYPES.REVENUE_RECORD,
  "employee.evaluated": EVENT_TARGET_TYPES.AI_EMPLOYEE,
  "emergency_stop.activated": EVENT_TARGET_TYPES.SYSTEM,
  "emergency_stop.released": EVENT_TARGET_TYPES.SYSTEM,
  "budget.threshold_reached": EVENT_TARGET_TYPES.SYSTEM,
  "budget.exceeded": EVENT_TARGET_TYPES.SYSTEM,
});

export const EVENT_REQUIRED_FIELDS = Object.freeze([
  "eventId",
  "eventName",
  "eventVersion",
  "correlationId",
  "causationId",
  "idempotencyKey",
  "producer",
  "consumers",
  "actor",
  "target",
  "payload",
  "valueType",
  "mockOnly",
  "auditLogRequired",
  "retryable",
  "occurredAt",
  "recordedAt",
  "sequenceNo",
  "status",
  "sourceOfTruth",
  "securityClassification",
  "schemaVersion",
]);

export const EVENT_PAYLOAD_FIELDS = Object.freeze({
  "opportunity.created": ["opportunityId", "campaignType", "theme", "valueType", "mockOnly"],
  "campaign.created": ["campaignId", "campaignType", "theme", "valueType", "mockOnly"],
  "campaign.approved": ["campaignId", "approvalRequestId", "mockDecision"],
  "workflow.started": ["workflowRunId", "campaignId", "workflowType"],
  "workflow.completed": ["workflowRunId", "campaignId", "result"],
  "workflow.failed": ["workflowRunId", "campaignId", "reason"],
  "task.assigned": ["assignmentId", "employeeId", "artifactType", "campaignId"],
  "task.completed": ["assignmentId", "employeeId", "artifactType", "campaignId"],
  "content.generated": ["contentAssetId", "artifactType", "employeeId", "campaignId", "generationMode"],
  "legal.reviewed": ["contentAssetId", "employeeId", "artifactType", "riskLevel"],
  "quality.reviewed": ["contentAssetId", "employeeId", "artifactType", "qualityLevel"],
  "approval.requested": ["approvalRequestId", "campaignId", "packageId", "approvalType", "expiresAt"],
  "owner.approved": ["approvalRequestId", "decisionId", "ownerActorId", "mockDecision"],
  "owner.rejected": ["approvalRequestId", "decisionId", "ownerActorId", "mockDecision"],
  "publish.prepared": ["contentAssetId", "campaignId", "artifactType", "publishMode"],
  "revenue.recorded": ["revenueRecordId", "campaignId", "revenueType", "amount", "currency", "valueType"],
  "employee.evaluated": ["employeeId", "evaluationId", "score", "valueType"],
  "emergency_stop.activated": ["reason", "activatedBy"],
  "emergency_stop.released": ["reason", "releasedBy"],
  "budget.threshold_reached": ["campaignId", "threshold", "currency", "valueType"],
  "budget.exceeded": ["campaignId", "limit", "currency", "valueType"],
});

export const EVENT_SECURITY_CLASSIFICATIONS = Object.freeze(["INTERNAL"]);
export const MAX_PAYLOAD_BYTES = 4096;
export const MAX_PAYLOAD_DEPTH = 4;
