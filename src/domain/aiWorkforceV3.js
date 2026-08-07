import { evaluateCorePermission } from "./companyCore.js";

export const V3_AI_EMPLOYEE_ROLES = Object.freeze([
  "ceo", "coo", "finance", "seo", "research", "market_intelligence", "affiliate",
  "sales", "legal", "support", "designer", "analytics", "learning", "automation", "knowledge",
]);

export const OWNER_RESERVED_DECISIONS = Object.freeze([
  "strategic_commitment", "financial_commitment", "legal_risk_acceptance", "external_execution", "employee_activation",
]);

export function validateEmployeeContract(value = {}) {
  const errors=[];
  if (!V3_AI_EMPLOYEE_ROLES.includes(value.role)) errors.push("role_invalid");
  if (!value.workspaceId || !value.mission || !value.capabilityVersion) errors.push("identity_contract_required");
  if (!Array.isArray(value.permissions) || value.permissions.some((permission)=>permission === "approve" || permission === "execute-external")) errors.push("reserved_permission_forbidden");
  if (!Number.isInteger(value.maxRetries) || value.maxRetries < 0 || value.maxRetries > 1) errors.push("retry_limit_invalid");
  if (!Number.isInteger(value.maxMeetingRounds) || value.maxMeetingRounds < 0 || value.maxMeetingRounds > 1) errors.push("meeting_limit_invalid");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function authorizeEmployeeTask(employee = {}, task = {}) {
  if (!validateEmployeeContract(employee).valid) return Object.freeze({allowed:false,reasonCode:"EMPLOYEE_CONTRACT_INVALID",externalExecution:false});
  if (employee.workspaceId !== task.workspaceId) return Object.freeze({allowed:false,reasonCode:"WORKSPACE_MISMATCH",externalExecution:false});
  if (!employee.permissions.includes(task.action)) return Object.freeze({allowed:false,reasonCode:"CAPABILITY_NOT_GRANTED",externalExecution:false});
  return evaluateCorePermission({workspaceId:task.workspaceId,sessionWorkspaceId:task.workspaceId,membershipStatus:"active",actorType:"ai_employee",action:task.action});
}

export function runMeetingRound({participants=[],agenda=[],round=1}={}) {
  const validParticipants=participants.filter((employee)=>validateEmployeeContract(employee).valid);
  if (round !== 1 || validParticipants.length !== participants.length || !agenda.length) return Object.freeze({ok:false,reasonCode:"MEETING_CONTRACT_INVALID",decisions:[],externalExecution:false});
  return Object.freeze({ok:true,round:1,contributions:Object.freeze(validParticipants.map((employee)=>Object.freeze({role:employee.role,status:"requested",truthClass:"Unknown"}))),decisions:Object.freeze([]),ownerDecisionRequired:true,externalExecution:false});
}
