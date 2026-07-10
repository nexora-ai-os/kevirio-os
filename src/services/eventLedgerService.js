import { ARTIFACT_TYPES } from "../data/aiWorkforceRegistry.js";
import { getEmployeeById } from "./aiWorkforceService.js";
import {
  EVENT_ACTOR_TYPES,
  EVENT_LEDGER_SCHEMA_VERSION,
  EVENT_LEDGER_SOURCE,
  EVENT_NAMES,
  EVENT_PAYLOAD_FIELDS,
  EVENT_REQUIRED_FIELDS,
  EVENT_SECURITY_CLASSIFICATIONS,
  EVENT_STATUSES,
  EVENT_TARGET_BY_NAME,
  EVENT_TARGET_TYPES,
  EVENT_VALUE_TYPES,
  EVENT_VERSION,
  MAX_PAYLOAD_BYTES,
  MAX_PAYLOAD_DEPTH,
} from "../data/eventLedgerSchema.js";

const eventNames = new Set(EVENT_NAMES);
const eventStatuses = new Set(Object.values(EVENT_STATUSES));
const actorTypes = new Set(Object.values(EVENT_ACTOR_TYPES));
const targetTypes = new Set(Object.values(EVENT_TARGET_TYPES));
const requiredTopLevelFields = new Set(EVENT_REQUIRED_FIELDS);
const dangerousPayloadKeys = new Set(["__proto__", "constructor", "prototype"]);
const secretKeyPattern = /(secret|token|api[_-]?key|credential|password)/i;

function createError(code, message, extra = {}) {
  return { code, message, ...extra };
}

function ok(extra = {}) {
  return { ok: true, errors: [], ...extra };
}

function fail(errors, extra = {}) {
  return { ok: false, errors: Array.isArray(errors) ? errors : [errors], ...extra };
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]" && Object.getPrototypeOf(value) === Object.prototype;
}

function isIsoDate(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function getPayloadSize(payload) {
  try {
    return new Blob([JSON.stringify(payload)]).size;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function validatePlainPayload(payload, errors, path = "payload", depth = 0) {
  if (!isPlainObject(payload)) {
    errors.push(createError("PAYLOAD_NOT_PLAIN_OBJECT", "payload must be a plain object.", { field: path }));
    return;
  }
  if (depth > MAX_PAYLOAD_DEPTH) {
    errors.push(createError("PAYLOAD_TOO_DEEP", "payload nesting is too deep.", { field: path }));
    return;
  }

  for (const [key, value] of Object.entries(payload)) {
    const field = `${path}.${key}`;
    if (dangerousPayloadKeys.has(key)) {
      errors.push(createError("PAYLOAD_DANGEROUS_KEY", "payload contains a dangerous key.", { field }));
    }
    if (secretKeyPattern.test(key)) {
      errors.push(createError("PAYLOAD_SECRET_KEY", "payload must not contain secret, token, API key, or credential fields.", { field }));
    }
    if (value instanceof Date || value instanceof Error || typeof value === "function") {
      errors.push(createError("PAYLOAD_UNSUPPORTED_VALUE", "payload contains an unsupported value.", { field }));
    }
    if (Array.isArray(value)) {
      errors.push(createError("PAYLOAD_ARRAY_NOT_ALLOWED", "payload arrays are not allowed.", { field }));
    } else if (isPlainObject(value)) {
      validatePlainPayload(value, errors, field, depth + 1);
    }
  }
}

function validatePayloadForEvent(event, errors) {
  validatePlainPayload(event.payload, errors);
  if (!isPlainObject(event.payload)) return;

  if (getPayloadSize(event.payload) > MAX_PAYLOAD_BYTES) {
    errors.push(createError("PAYLOAD_TOO_LARGE", "payload is larger than the mock ledger limit.", { field: "payload" }));
  }

  const allowedFields = EVENT_PAYLOAD_FIELDS[event.eventName] || [];
  const allowed = new Set(allowedFields);
  for (const field of allowedFields) {
    if (!(field in event.payload)) {
      errors.push(createError("PAYLOAD_REQUIRED_FIELD_MISSING", `${event.eventName} payload is missing ${field}.`, { field: `payload.${field}` }));
    }
  }
  for (const field of Object.keys(event.payload)) {
    if (!allowed.has(field)) {
      errors.push(createError("PAYLOAD_UNKNOWN_FIELD", `${event.eventName} payload contains unknown field ${field}.`, { field: `payload.${field}` }));
    }
  }

  if ("valueType" in event.payload && event.payload.valueType !== EVENT_VALUE_TYPES.MOCK) {
    errors.push(createError("PAYLOAD_VALUE_TYPE_INVALID", "payload.valueType must be MOCK.", { field: "payload.valueType" }));
  }
  if ("mockOnly" in event.payload && event.payload.mockOnly !== true) {
    errors.push(createError("PAYLOAD_MOCK_ONLY_INVALID", "payload.mockOnly must be true.", { field: "payload.mockOnly" }));
  }
  if ("mockDecision" in event.payload && event.payload.mockDecision !== true) {
    errors.push(createError("PAYLOAD_MOCK_DECISION_INVALID", "mock decisions must be explicitly marked mockDecision true.", { field: "payload.mockDecision" }));
  }
  if ("generationMode" in event.payload && event.payload.generationMode !== "MOCK") {
    errors.push(createError("PAYLOAD_GENERATION_MODE_INVALID", "generationMode must be MOCK.", { field: "payload.generationMode" }));
  }
  if ("artifactType" in event.payload && !ARTIFACT_TYPES.includes(event.payload.artifactType)) {
    errors.push(createError("PAYLOAD_ARTIFACT_UNKNOWN", "payload artifactType is not registered.", { field: "payload.artifactType" }));
  }
  if ("employeeId" in event.payload && !getEmployeeById(event.payload.employeeId)) {
    errors.push(createError("PAYLOAD_EMPLOYEE_UNKNOWN", "payload employeeId is not in MVP15 registry.", { field: "payload.employeeId" }));
  }
}

function validateActor(actor, errors) {
  if (!isPlainObject(actor)) {
    errors.push(createError("ACTOR_INVALID", "actor must be a plain object.", { field: "actor" }));
    return;
  }
  if (!actorTypes.has(actor.actorType)) {
    errors.push(createError("ACTOR_TYPE_UNKNOWN", "actorType is unknown.", { field: "actor.actorType" }));
    return;
  }
  if (typeof actor.displayName !== "string" || !actor.displayName.trim()) {
    errors.push(createError("ACTOR_DISPLAY_NAME_INVALID", "actor.displayName is required.", { field: "actor.displayName" }));
  }
  if (actor.actorType === EVENT_ACTOR_TYPES.HUMAN_OWNER && actor.actorId !== null) {
    errors.push(createError("HUMAN_OWNER_ACTOR_ID_INVALID", "HUMAN_OWNER actorId must be null.", { field: "actor.actorId" }));
  }
  if (actor.actorType === EVENT_ACTOR_TYPES.SYSTEM && actor.actorId !== null) {
    errors.push(createError("SYSTEM_ACTOR_ID_INVALID", "SYSTEM actorId must be null.", { field: "actor.actorId" }));
  }
  if (actor.actorType === EVENT_ACTOR_TYPES.AI_EMPLOYEE && !getEmployeeById(actor.actorId)) {
    errors.push(createError("AI_ACTOR_UNKNOWN", "AI_EMPLOYEE actorId is not in MVP15 registry.", { field: "actor.actorId" }));
  }
}

function validateTarget(event, errors) {
  const target = event.target;
  if (!isPlainObject(target)) {
    errors.push(createError("TARGET_INVALID", "target must be a plain object.", { field: "target" }));
    return;
  }
  if (!targetTypes.has(target.targetType)) {
    errors.push(createError("TARGET_TYPE_UNKNOWN", "targetType is unknown.", { field: "target.targetType" }));
    return;
  }
  if (typeof target.targetId !== "string" || !target.targetId.trim()) {
    errors.push(createError("TARGET_ID_INVALID", "targetId is required.", { field: "target.targetId" }));
  }
  const expectedTarget = EVENT_TARGET_BY_NAME[event.eventName];
  if (expectedTarget && target.targetType !== expectedTarget) {
    errors.push(createError("TARGET_EVENT_MISMATCH", `${event.eventName} must target ${expectedTarget}.`, { field: "target.targetType" }));
  }
  if (target.targetType === EVENT_TARGET_TYPES.AI_EMPLOYEE && !getEmployeeById(target.targetId)) {
    errors.push(createError("AI_TARGET_UNKNOWN", "AI_EMPLOYEE targetId is not in MVP15 registry.", { field: "target.targetId" }));
  }
  if (target.targetType === EVENT_TARGET_TYPES.CAMPAIGN && !/^campaign_[A-Za-z0-9_-]+/.test(target.targetId)) {
    errors.push(createError("CAMPAIGN_TARGET_ID_INVALID", "CAMPAIGN targetId must use campaign_ prefix.", { field: "target.targetId" }));
  }
}

function validateEventShape(event, ledger = []) {
  const errors = [];
  if (!isPlainObject(event)) return [createError("EVENT_INVALID", "event must be a plain object.")];

  const eventKeys = Object.keys(event);
  for (const field of EVENT_REQUIRED_FIELDS) {
    if (!(field in event)) errors.push(createError("EVENT_REQUIRED_FIELD_MISSING", `event is missing ${field}.`, { field }));
  }
  for (const field of eventKeys) {
    if (!requiredTopLevelFields.has(field)) {
      errors.push(createError("EVENT_UNKNOWN_FIELD", `event contains unknown top-level field ${field}.`, { field }));
    }
  }

  if (typeof event.eventId !== "string" || !event.eventId.trim()) errors.push(createError("EVENT_ID_INVALID", "eventId is required.", { field: "eventId" }));
  if (!eventNames.has(event.eventName)) errors.push(createError("EVENT_NAME_UNKNOWN", "eventName is not registered.", { field: "eventName" }));
  if (event.eventVersion !== EVENT_VERSION) errors.push(createError("EVENT_VERSION_INVALID", "eventVersion must be 1.0.0.", { field: "eventVersion" }));
  if (typeof event.correlationId !== "string" || !event.correlationId.trim()) errors.push(createError("CORRELATION_ID_INVALID", "correlationId is required.", { field: "correlationId" }));
  if (event.causationId !== null) {
    if (typeof event.causationId !== "string" || !event.causationId.trim()) {
      errors.push(createError("CAUSATION_ID_INVALID", "causationId must be null or a non-empty eventId.", { field: "causationId" }));
    } else if (event.causationId === event.eventId) {
      errors.push(createError("CAUSATION_SELF_REFERENCE", "causationId must not reference the same event.", { field: "causationId" }));
    } else if (Array.isArray(ledger) && ledger.length > 0 && !ledger.some((entry) => entry?.eventId === event.causationId)) {
      errors.push(createError("CAUSATION_REFERENCE_BROKEN", "causationId does not exist in this ledger.", { field: "causationId" }));
    }
  }
  if (typeof event.idempotencyKey !== "string" || !event.idempotencyKey.trim()) errors.push(createError("IDEMPOTENCY_KEY_INVALID", "idempotencyKey is required.", { field: "idempotencyKey" }));
  if (typeof event.producer !== "string" || !event.producer.trim()) errors.push(createError("PRODUCER_INVALID", "producer is required.", { field: "producer" }));
  if (!Array.isArray(event.consumers) || event.consumers.length === 0 || event.consumers.some((consumer) => typeof consumer !== "string" || !consumer.trim())) {
    errors.push(createError("CONSUMERS_INVALID", "consumers must be a non-empty string array.", { field: "consumers" }));
  }
  validateActor(event.actor, errors);
  validateTarget(event, errors);
  validatePayloadForEvent(event, errors);
  if (event.valueType !== EVENT_VALUE_TYPES.MOCK) errors.push(createError("VALUE_TYPE_INVALID", "valueType must be MOCK.", { field: "valueType" }));
  if (event.mockOnly !== true) errors.push(createError("MOCK_ONLY_INVALID", "mockOnly must be true.", { field: "mockOnly" }));
  if (event.auditLogRequired !== true) errors.push(createError("AUDIT_LOG_REQUIRED_INVALID", "auditLogRequired must be true.", { field: "auditLogRequired" }));
  if (typeof event.retryable !== "boolean") errors.push(createError("RETRYABLE_INVALID", "retryable must be boolean.", { field: "retryable" }));
  if (!isIsoDate(event.occurredAt)) errors.push(createError("OCCURRED_AT_INVALID", "occurredAt must be ISO 8601.", { field: "occurredAt" }));
  if (!isIsoDate(event.recordedAt)) errors.push(createError("RECORDED_AT_INVALID", "recordedAt must be ISO 8601.", { field: "recordedAt" }));
  if (!Number.isInteger(event.sequenceNo) || event.sequenceNo < 1) errors.push(createError("SEQUENCE_NO_INVALID", "sequenceNo must be a positive integer.", { field: "sequenceNo" }));
  if (!eventStatuses.has(event.status)) errors.push(createError("STATUS_INVALID", "status is not allowed.", { field: "status" }));
  if (event.sourceOfTruth !== EVENT_LEDGER_SOURCE) errors.push(createError("SOURCE_OF_TRUTH_INVALID", "sourceOfTruth must be KEVIRIO_EVENT_LEDGER.", { field: "sourceOfTruth" }));
  if (!EVENT_SECURITY_CLASSIFICATIONS.includes(event.securityClassification)) errors.push(createError("SECURITY_CLASSIFICATION_INVALID", "securityClassification is not allowed.", { field: "securityClassification" }));
  if (event.schemaVersion !== EVENT_LEDGER_SCHEMA_VERSION) errors.push(createError("SCHEMA_VERSION_INVALID", "schemaVersion must be 1.0.0.", { field: "schemaVersion" }));

  return errors;
}

function createValidationSummary(ledger) {
  return {
    eventCount: Array.isArray(ledger) ? ledger.length : 0,
    correlations: 0,
    duplicateEventIds: 0,
    duplicateIdempotencyKeys: 0,
    brokenCausationReferences: 0,
    invalidSequences: 0,
    unknownEventNames: 0,
    invalidActors: 0,
    invalidTargets: 0,
    invalidPayloads: 0,
  };
}

export function createEventDraft(input = {}) {
  const now = input.recordedAt || new Date().toISOString();
  const eventDraft = {
    eventId: input.eventId,
    eventName: input.eventName,
    eventVersion: EVENT_VERSION,
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    idempotencyKey: input.idempotencyKey,
    producer: input.producer || "KEVIRIO Mock Event Ledger",
    consumers: input.consumers || ["Mock Event Ledger"],
    actor: input.actor,
    target: input.target,
    payload: input.payload || {},
    valueType: EVENT_VALUE_TYPES.MOCK,
    mockOnly: true,
    auditLogRequired: true,
    retryable: Boolean(input.retryable),
    occurredAt: input.occurredAt || now,
    recordedAt: now,
    sequenceNo: input.sequenceNo,
    status: input.status || EVENT_STATUSES.RECORDED,
    sourceOfTruth: EVENT_LEDGER_SOURCE,
    securityClassification: "INTERNAL",
    schemaVersion: EVENT_LEDGER_SCHEMA_VERSION,
  };

  const errors = validateEventShape(eventDraft, input.ledger || []);
  if (errors.length > 0) return fail(errors, { event: eventDraft });
  return ok({ event: eventDraft });
}

export function validateEventDraft(eventDraft, ledger = []) {
  try {
    const errors = validateEventShape(eventDraft, ledger);
    if (errors.length > 0) return fail(errors, { event: eventDraft });
    return ok({ event: eventDraft });
  } catch (error) {
    return fail(createError("EVENT_VALIDATION_EXCEPTION", `Event validation failed closed: ${error instanceof Error ? error.message : "unknown error"}`));
  }
}

export function appendEvent(ledger, eventDraft) {
  if (!Array.isArray(ledger)) return fail(createError("LEDGER_NOT_ARRAY", "ledger must be an array."), { ledger });
  const validation = validateEventDraft(eventDraft, ledger);
  if (!validation.ok) return { ...validation, ledger };
  if (ledger.some((event) => event?.eventId === eventDraft.eventId)) {
    return fail(createError("DUPLICATE_EVENT_ID", "eventId already exists.", { eventId: eventDraft.eventId }), { ledger });
  }
  if (ledger.some((event) => event?.idempotencyKey === eventDraft.idempotencyKey)) {
    return fail(createError("DUPLICATE_EVENT", "idempotencyKey already exists; duplicate append blocked.", { eventId: eventDraft.eventId, correlationId: eventDraft.correlationId }), { ledger });
  }
  if (ledger.some((event) => event?.correlationId === eventDraft.correlationId && event?.sequenceNo === eventDraft.sequenceNo)) {
    return fail(createError("DUPLICATE_SEQUENCE", "sequenceNo already exists for this correlationId.", { eventId: eventDraft.eventId, correlationId: eventDraft.correlationId }), { ledger });
  }
  return ok({ event: eventDraft, ledger: [...ledger, eventDraft] });
}

export function getEventsByCorrelationId(ledger, correlationId) {
  if (!Array.isArray(ledger)) return [];
  return ledger.filter((event) => event.correlationId === correlationId).sort((a, b) => a.sequenceNo - b.sequenceNo);
}

export function getEventsByEventName(ledger, eventName) {
  if (!Array.isArray(ledger) || !eventNames.has(eventName)) return [];
  return ledger.filter((event) => event.eventName === eventName);
}

export function getEventsByActorId(ledger, actorId) {
  if (!Array.isArray(ledger)) return [];
  return ledger.filter((event) => event.actor?.actorId === actorId);
}

export function getEventsByTarget(ledger, targetType, targetId) {
  if (!Array.isArray(ledger) || !targetTypes.has(targetType)) return [];
  return ledger.filter((event) => event.target?.targetType === targetType && event.target?.targetId === targetId);
}

export function getLatestSequenceNo(ledger, correlationId) {
  return getEventsByCorrelationId(ledger, correlationId).reduce((latest, event) => Math.max(latest, event.sequenceNo || 0), 0);
}

export function hasIdempotencyKey(ledger, idempotencyKey) {
  if (!Array.isArray(ledger) || typeof idempotencyKey !== "string") return false;
  return ledger.some((event) => event.idempotencyKey === idempotencyKey);
}

export function validateEventLedger(ledger) {
  const errors = [];
  const summary = createValidationSummary(ledger);

  const add = (error) => {
    errors.push(error);
    if (error.code === "DUPLICATE_EVENT_ID") summary.duplicateEventIds += 1;
    if (error.code === "DUPLICATE_IDEMPOTENCY_KEY") summary.duplicateIdempotencyKeys += 1;
    if (error.code === "CAUSATION_REFERENCE_BROKEN" || error.code === "CAUSATION_SELF_REFERENCE") summary.brokenCausationReferences += 1;
    if (error.code.includes("SEQUENCE")) summary.invalidSequences += 1;
    if (error.code === "EVENT_NAME_UNKNOWN") summary.unknownEventNames += 1;
    if (error.code.includes("ACTOR")) summary.invalidActors += 1;
    if (error.code.includes("TARGET")) summary.invalidTargets += 1;
    if (error.code.includes("PAYLOAD")) summary.invalidPayloads += 1;
  };

  try {
    if (!Array.isArray(ledger)) {
      add(createError("LEDGER_NOT_ARRAY", "ledger must be an array."));
      return { valid: false, errors, summary };
    }

    const eventIds = new Set();
    const idempotencyKeys = new Set();
    const sequenceByCorrelation = new Map();
    const correlations = new Set();

    for (const event of ledger) {
      const shapeErrors = validateEventShape(event, ledger);
      shapeErrors.forEach(add);

      if (eventIds.has(event?.eventId)) add(createError("DUPLICATE_EVENT_ID", "eventId is duplicated.", { eventId: event?.eventId }));
      eventIds.add(event?.eventId);

      if (idempotencyKeys.has(event?.idempotencyKey)) add(createError("DUPLICATE_IDEMPOTENCY_KEY", "idempotencyKey is duplicated.", { eventId: event?.eventId }));
      idempotencyKeys.add(event?.idempotencyKey);

      if (typeof event?.correlationId === "string" && event.correlationId.trim()) {
        correlations.add(event.correlationId);
        const sequences = sequenceByCorrelation.get(event.correlationId) || new Set();
        if (sequences.has(event.sequenceNo)) add(createError("DUPLICATE_SEQUENCE", "sequenceNo is duplicated for correlationId.", { eventId: event.eventId, correlationId: event.correlationId }));
        sequences.add(event.sequenceNo);
        sequenceByCorrelation.set(event.correlationId, sequences);
      }
    }

    summary.correlations = correlations.size;
  } catch (error) {
    add(createError("LEDGER_VALIDATION_EXCEPTION", `Event ledger validation failed closed: ${error instanceof Error ? error.message : "unknown error"}`));
  }

  return { valid: errors.length === 0, errors, summary };
}

export function createCampaignCreatedEvent(campaign) {
  return createEventDraft({
    eventId: `evt_${campaign.campaignId}_created`,
    eventName: "campaign.created",
    correlationId: campaign.correlationId,
    causationId: null,
    idempotencyKey: `campaign.created:${campaign.correlationId}:${campaign.campaignId}:create-v1`,
    sequenceNo: 1,
    actor: { actorType: EVENT_ACTOR_TYPES.HUMAN_OWNER, actorId: null, displayName: "Owner" },
    target: { targetType: EVENT_TARGET_TYPES.CAMPAIGN, targetId: campaign.campaignId },
    payload: {
      campaignId: campaign.campaignId,
      campaignType: campaign.campaignType,
      theme: campaign.theme,
      valueType: EVENT_VALUE_TYPES.MOCK,
      mockOnly: true,
    },
    occurredAt: campaign.createdAt,
    recordedAt: campaign.createdAt,
  });
}

export function createTaskAssignedEvent(input) {
  return createEventDraft({
    eventId: input.eventId,
    eventName: "task.assigned",
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    idempotencyKey: `task.assigned:${input.correlationId}:${input.assignmentId}:assign-v1`,
    sequenceNo: input.sequenceNo,
    actor: { actorType: EVENT_ACTOR_TYPES.AI_EMPLOYEE, actorId: input.actorEmployeeId, displayName: input.actorDisplayName || input.actorEmployeeId },
    target: { targetType: EVENT_TARGET_TYPES.TASK, targetId: input.assignmentId },
    payload: {
      assignmentId: input.assignmentId,
      employeeId: input.employeeId,
      artifactType: input.artifactType,
      campaignId: input.campaignId,
    },
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt || input.occurredAt,
  });
}

export function createContentGeneratedEvent(input) {
  return createEventDraft({
    eventId: input.eventId,
    eventName: "content.generated",
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    idempotencyKey: `content.generated:${input.correlationId}:${input.contentAssetId}:mock-v1`,
    sequenceNo: input.sequenceNo,
    actor: { actorType: EVENT_ACTOR_TYPES.AI_EMPLOYEE, actorId: input.employeeId, displayName: input.displayName || input.employeeId },
    target: { targetType: EVENT_TARGET_TYPES.CONTENT_ASSET, targetId: input.contentAssetId },
    payload: {
      contentAssetId: input.contentAssetId,
      artifactType: input.artifactType,
      employeeId: input.employeeId,
      campaignId: input.campaignId,
      generationMode: "MOCK",
    },
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt || input.occurredAt,
  });
}
