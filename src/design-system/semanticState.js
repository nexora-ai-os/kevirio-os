export const UI_STATE = Object.freeze({
  MOCK: "mock",
  FORECAST: "forecast",
  CANDIDATE: "candidate",
  PENDING: "pending",
  APPROVED: "approved",
  READY: "ready",
  RUNNING: "running",
  PARTIAL: "partial",
  COMPLETED: "completed",
  EVIDENCE_WAITING: "evidence_waiting",
  ACTUAL: "actual",
  FAILED: "failed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  LOCKED: "locked",
  UNKNOWN: "unknown",
});

export const MATURITY = Object.freeze({
  PRODUCTION: "production",
  CONDITIONAL: "conditional",
  MOCK: "mock",
  LOCKED: "locked",
});

export const ENVIRONMENT = Object.freeze({
  PRODUCTION: "production",
  SANDBOX: "sandbox",
  DRY_RUN: "dry_run",
  MOCK: "mock",
  LOCKED: "locked",
});

export const COST_STATE = Object.freeze({
  WITHIN_LIMIT: "within_limit",
  NEARING_LIMIT: "nearing_limit",
  APPROVAL_REQUIRED: "approval_required",
  BLOCKED: "blocked",
  UNAVAILABLE: "unavailable",
});

export const SEMANTIC_STATE = Object.freeze({
  mock: Object.freeze({ label: "MOCK", icon: "FlaskConical", tone: "mock", border: "dashed" }),
  forecast: Object.freeze({ label: "予測", icon: "TrendingUp", tone: "forecast", border: "solid" }),
  candidate: Object.freeze({ label: "候補", icon: "CircleDot", tone: "neutral", border: "solid" }),
  pending: Object.freeze({ label: "対応待ち", icon: "Clock3", tone: "warning", border: "solid" }),
  approved: Object.freeze({ label: "承認済み", icon: "BadgeCheck", tone: "approved", border: "solid" }),
  ready: Object.freeze({ label: "実行準備完了", icon: "CircleArrowRight", tone: "ready", border: "solid" }),
  running: Object.freeze({ label: "処理中", icon: "Activity", tone: "running", border: "solid" }),
  partial: Object.freeze({ label: "一部完了", icon: "CircleDashed", tone: "warning", border: "solid" }),
  completed: Object.freeze({ label: "完了", icon: "CircleCheck", tone: "success", border: "solid" }),
  evidence_waiting: Object.freeze({ label: "証拠待ち", icon: "FileSearch", tone: "warning", border: "solid" }),
  actual: Object.freeze({ label: "実績", icon: "ShieldCheck", tone: "actual", border: "strong" }),
  failed: Object.freeze({ label: "失敗", icon: "CircleX", tone: "danger", border: "solid" }),
  cancelled: Object.freeze({ label: "キャンセル", icon: "CircleMinus", tone: "neutral", border: "solid" }),
  expired: Object.freeze({ label: "期限切れ", icon: "TimerOff", tone: "warning", border: "solid" }),
  locked: Object.freeze({ label: "ロック中", icon: "Lock", tone: "locked", border: "solid" }),
  unknown: Object.freeze({ label: "不明", icon: "CircleHelp", tone: "neutral", border: "dotted" }),
});

export const ENVIRONMENT_META = Object.freeze({
  production: Object.freeze({ label: "PRODUCTION DATA", state: UI_STATE.ACTUAL }),
  sandbox: Object.freeze({ label: "SANDBOX", state: UI_STATE.CANDIDATE }),
  dry_run: Object.freeze({ label: "DRY RUN", state: UI_STATE.LOCKED }),
  mock: Object.freeze({ label: "MOCK", state: UI_STATE.MOCK }),
  locked: Object.freeze({ label: "LOCKED", state: UI_STATE.LOCKED }),
});

export function normalizeUIState(value) {
  return Object.hasOwn(SEMANTIC_STATE, value) ? value : UI_STATE.UNKNOWN;
}

export function getSemanticState(value) {
  return SEMANTIC_STATE[normalizeUIState(value)];
}

export function getEnvironmentMeta(value) {
  return ENVIRONMENT_META[value] || ENVIRONMENT_META.locked;
}
