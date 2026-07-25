const DENIED_SENSITIVITY = new Set(["restricted","authentication_data","sensitive_personal_data","customer_confidential"]);
const ALLOWED_PURPOSES = new Set(["directServiceDraft","affiliateDraft","snsDraft"]);
const SECRET_PATTERN = /(?:sk-[A-Za-z0-9_-]{16,}|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password)\s*[:=]\s*\S+)/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d ()-]{8,}\d)/g;
const EXFILTRATION_PATTERN = /(?:ignore previous|system prompt|api key|other customer|memory.*(?:output|export)|!\[[^\]]*\]\(https?:\/\/)/i;

export function evaluateProviderEgress(input = {}) {
  if (!ALLOWED_PURPOSES.has(input.purpose)) return { allowed:false, reasonCode:"PURPOSE_NOT_ALLOWED" };
  if (DENIED_SENSITIVITY.has(input.sensitivityLevel)) return { allowed:false, reasonCode:"SENSITIVITY_BLOCKED" };
  const raw=JSON.stringify(input.selectedFields || {});
  if (raw.length > 12000) return { allowed:false, reasonCode:"INPUT_TOO_LARGE" };
  if (SECRET_PATTERN.test(raw)) return { allowed:false, reasonCode:"SECRET_DETECTED" };
  if (EXFILTRATION_PATTERN.test(raw)) return { allowed:false, reasonCode:"UNTRUSTED_INSTRUCTION_DETECTED" };
  const redacted=raw.replace(EMAIL_PATTERN,"[REDACTED_EMAIL]").replace(PHONE_PATTERN,"[REDACTED_PHONE]");
  return { allowed:true, reasonCode:"EGRESS_ALLOWED", sanitizedFields:JSON.parse(redacted), redacted:redacted!==raw };
}
