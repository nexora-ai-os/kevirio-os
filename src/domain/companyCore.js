export const COMPANY_CORE_VERSION = "3.0.0";

export const COMPANY_CORE_DOMAINS = Object.freeze([
  "workspace", "organization", "business", "team", "knowledge", "asset",
  "decision", "permission", "capability", "provider",
]);

export const ACTION_CLASSES = Object.freeze([
  "read", "propose", "approve", "mutate-internal", "execute-external",
]);

export const V3_TRUTH_CLASSES = Object.freeze(["Actual", "Forecast", "Mock", "Unknown"]);
export const CORE_ACTORS = Object.freeze(["owner", "ai_employee", "system", "member", "reviewer"]);
export const RETENTION_CLASSES = Object.freeze(["operational", "audit_7_years", "policy_defined"]);

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTION_SET = new Set(ACTION_CLASSES);

export function validateDomainEnvelope(value = {}) {
  const errors = [];
  if (!ID.test(value.id || "")) errors.push("id_invalid");
  if (!ID.test(value.workspaceId || "")) errors.push("workspaceId_invalid");
  if (!COMPANY_CORE_DOMAINS.includes(value.aggregate)) errors.push("aggregate_invalid");
  if (!Number.isInteger(value.version) || value.version < 1) errors.push("version_invalid");
  if (!value.lifecycleState) errors.push("lifecycleState_required");
  if (!V3_TRUTH_CLASSES.includes(value.truthClass)) errors.push("truthClass_invalid");
  if (!value.source || typeof value.source !== "object") errors.push("source_required");
  if (!CORE_ACTORS.includes(value.actorType)) errors.push("actorType_invalid");
  if (!RETENTION_CLASSES.includes(value.retentionClass)) errors.push("retentionClass_invalid");
  for (const field of ["createdAt", "updatedAt"]) {
    if (!value[field] || Number.isNaN(Date.parse(value[field]))) errors.push(`${field}_invalid`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function evaluateCorePermission(input = {}) {
  const deny = (reasonCode, extras = {}) => Object.freeze({ allowed: false, reasonCode, externalExecution: false, ...extras });
  if (!input.workspaceId || input.workspaceId !== input.sessionWorkspaceId) return deny("WORKSPACE_MISMATCH");
  if (!CORE_ACTORS.includes(input.actorType) || !ACTION_SET.has(input.action)) return deny("PERMISSION_CONTRACT_INVALID");
  if (input.membershipStatus !== "active") return deny("ACTIVE_MEMBERSHIP_REQUIRED");
  if (input.action === "execute-external") return deny("EXTERNAL_EXECUTION_LOCKED", { approvalRequired: true });
  if (input.action === "approve" && input.actorType !== "owner") return deny("OWNER_APPROVAL_REQUIRED", { approvalRequired: true });
  if (input.action === "mutate-internal" && !["owner", "system"].includes(input.actorType)) return deny("INTERNAL_MUTATION_NOT_GRANTED");
  if (input.action === "propose" && !["owner", "ai_employee", "system"].includes(input.actorType)) return deny("PROPOSAL_NOT_GRANTED");
  return Object.freeze({ allowed: true, reasonCode: "PERMISSION_GRANTED", externalExecution: false });
}

export function buildCompanyCoreSnapshot(parts = {}) {
  const domains = Object.fromEntries(COMPANY_CORE_DOMAINS.map((domain) => {
    const rows = Array.isArray(parts[domain]) ? parts[domain] : null;
    return [domain, Object.freeze({
      truthClass: rows ? "Actual" : "Unknown",
      status: rows ? "available" : "unknown",
      records: Object.freeze(rows ? [...rows] : []),
      source: parts.sources?.[domain] || null,
    })];
  }));
  return Object.freeze({ version: COMPANY_CORE_VERSION, workspaceId: parts.workspaceId || null, domains: Object.freeze(domains), unavailableDomains: Object.freeze([...(parts.unavailableDomains || [])]), migrationUnavailable: parts.migrationUnavailable === true, externalExecution: false });
}


export const BUSINESS_TYPES = Object.freeze(["affiliate", "agency", "consulting", "digital_product", "subscription", "saas", "licensing", "marketplace", "internal", "custom"]);
export const COMPANY_LIFECYCLE = Object.freeze(["draft", "active", "paused", "archived"]);

const cleanV3 = (value) => typeof value === "string" ? value.trim() : value;
const unknownV3 = (value) => value == null || value === "" ? "Unknown" : value;
function baseV3Model(row, aggregate) {
  const model = { id: row.id, workspaceId: row.workspace_id, aggregate, status: row.status, lifecycleState: row.lifecycle_state, truthClass: "Actual", source: { table: `${aggregate}s`, recordId: row.id }, actorType: "owner", retentionClass: "operational", version: 1, createdAt: row.created_at, updatedAt: row.updated_at, externalExecution: false };
  const validation = validateDomainEnvelope(model);
  if (!validation.valid) throw Object.assign(new Error("company_core_row_invalid"), { aggregate, errors: validation.errors });
  return model;
}
export function mapOrganizationRow(row = {}) { return Object.freeze({ ...baseV3Model(row, "organization"), name: cleanV3(row.name), ownerId: row.owner_id, policies: Object.freeze(row.policies || {}), defaultLocale: unknownV3(row.default_locale), defaultTimezone: unknownV3(row.default_timezone), defaultCurrency: unknownV3(row.default_currency) }); }
export function mapBusinessRow(row = {}) { if (!BUSINESS_TYPES.includes(row.business_type)) throw new Error("business_type_invalid"); return Object.freeze({ ...baseV3Model(row, "business"), organizationId: row.organization_id, name: cleanV3(row.name), businessType: row.business_type, operatingStatus: row.operating_status, revenueModel: Object.freeze(row.revenue_model || {}), ownerId: row.owner_id, strategy: unknownV3(row.strategy_reference), profitabilityStatus: unknownV3(row.profitability_status), maturity: unknownV3(row.maturity) }); }
export function mapTeamRow(row = {}) { return Object.freeze({ ...baseV3Model(row, "team"), entityType: "team", organizationId: row.organization_id, businessId: row.business_id || null, name: cleanV3(row.name), roleScope: Object.freeze([...(row.role_scope || [])]), permissions: Object.freeze([...(row.permissions || [])]), membershipStatus: unknownV3(row.membership_status) }); }
