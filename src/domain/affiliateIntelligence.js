const HTTP_URL = /^https?:\/\//i;
const CURRENCY = /^[A-Z]{3}$/;

export const AFFILIATE_STAGES = Object.freeze([
  "registered", "research_required", "compliance_review", "content_plan",
  "owner_approval", "manual_execution", "evidence_pending", "actual_review",
  "learning_review", "completed",
]);

export const AFFILIATE_STAGE_LABELS = Object.freeze({
  registered: "運用準備待ち",
  research_required: "運用設計中",
  compliance_review: "運用設計中",
  content_plan: "運用設計中",
  owner_approval: "Owner承認待ち",
  manual_execution: "手動実行待ち",
  evidence_pending: "Evidence登録待ち",
  actual_review: "Actual Revenue / Cost確認",
  learning_review: "学習レビュー待ち",
  completed: "完了 / Monitoring",
});

export const PREPARATION_STEPS = Object.freeze([
  { key: "basic", label: "案件基本情報", required: ["aspName", "advertiserName", "programName"] },
  { key: "commission", label: "報酬・成果条件", required: ["commissionRate", "conversionConditions"] },
  { key: "compliance", label: "規約・開示", required: ["disclosureRequirements", "prohibitedClaims"] },
  { key: "materials", label: "広告素材", required: [] },
  { key: "target", label: "ターゲット", required: ["targetAudience"] },
  { key: "claims", label: "訴求案", required: ["claimPlan"] },
  { key: "channels", label: "チャネル計画", required: ["plannedChannels"] },
  { key: "evidence", label: "Evidence設計", required: ["evidencePlan"] },
  { key: "owner", label: "Owner確認", required: ["ownerConfirmed"] },
  { key: "complete", label: "運用準備完了", required: [] },
]);

export function classifyUrl(value, { required = false } = {}) {
  const input = String(value || "").trim();
  if (!input) return { valid: !required, value: "", kind: "empty" };
  if (!HTTP_URL.test(input)) return { valid: false, value: input, kind: "unsafe" };
  try {
    const parsed = new URL(input);
    return { valid: parsed.protocol === "https:" || parsed.protocol === "http:", value: parsed.toString(), kind: "web" };
  } catch { return { valid: false, value: input, kind: "malformed" }; }
}

export function normalizeAffiliateProgram(value = {}) {
  return {
    aspName: String(value.aspName || "").trim(),
    advertiserName: String(value.advertiserName || "").trim(),
    programName: String(value.programName || "").trim(),
    programCode: String(value.programCode || "").trim(),
    officialProductUrl: String(value.officialProductUrl || "").trim(),
    advertiserProgramUrl: String(value.advertiserProgramUrl || "").trim(),
    aspManagementUrl: String(value.aspManagementUrl || "").trim(),
    commissionType: String(value.commissionType || "percentage"),
    commissionRate: value.commissionRate === "" || value.commissionRate == null ? null : Number(value.commissionRate),
    currency: String(value.currency || "JPY").trim().toUpperCase(),
    conversionConditions: String(value.conversionConditions || "").trim(),
    rejectionConditions: String(value.rejectionConditions || "").trim(),
    listingRestrictions: String(value.listingRestrictions || "").trim(),
    disclosureRequirements: String(value.disclosureRequirements || "").trim(),
    prohibitedClaims: String(value.prohibitedClaims || "").trim(),
    targetAudience: String(value.targetAudience || "").trim(),
    claimPlan: String(value.claimPlan || "").trim(),
    plannedChannels: String(value.plannedChannels || "").trim(),
    evidencePlan: String(value.evidencePlan || "").trim(),
    ownerConfirmed: value.ownerConfirmed === true,
  };
}

export function validateAffiliateProgram(value, throughStep = PREPARATION_STEPS.length - 1) {
  const normalized = normalizeAffiliateProgram(value);
  const missing = [];
  PREPARATION_STEPS.slice(0, throughStep + 1).forEach((step) => step.required.forEach((field) => {
    if (!normalized[field]) missing.push({ field, step: step.key, label: step.label });
  }));
  const errors = [];
  if (!CURRENCY.test(normalized.currency)) errors.push("通貨は3文字のISOコードで入力してください。");
  if (normalized.commissionRate != null && (!Number.isFinite(normalized.commissionRate) || normalized.commissionRate < 0 || normalized.commissionRate > 100)) errors.push("報酬率は0〜100の範囲で入力してください。");
  ["officialProductUrl", "advertiserProgramUrl", "aspManagementUrl"].forEach((field) => {
    if (!classifyUrl(normalized[field]).valid) errors.push(`${field} はhttp/https URLで入力してください。`);
  });
  return { valid: missing.length === 0 && errors.length === 0, normalized, missing, errors };
}

export function affiliateProgramStage(program, operation, { hasEvidence = false, hasActual = false, hasLearning = false } = {}) {
  if (!program) return "registered";
  if (!operation) return program.status || "research_required";
  if (operation.status === "owner_artifact_approval") return "owner_approval";
  if (operation.status === "manual_package_ready") return "manual_execution";
  if (operation.status === "performance_waiting" && !hasEvidence) return "evidence_pending";
  if (hasEvidence && !hasActual) return "actual_review";
  if (hasActual && !hasLearning) return "learning_review";
  return operation.status === "closed" ? "completed" : "learning_review";
}

export function deriveNextOwnerAction({ offers = [], programs = [], operations = [], evidence = [], revenue = [], learnings = [] } = {}) {
  if (!offers.length) return { stage: "offer_registration", title: "Offer登録待ち", message: "Offerを登録し、運用準備を開始してください。", offerId: null };
  for (const offer of offers) {
    const program = programs.find((item) => item.offer_id === offer.id);
    const operation = operations.find((item) => item.offer_id === offer.id);
    const hasEvidence = operation ? evidence.some((item) => item.campaign_id === operation.campaign_id) : false;
    const hasActual = operation ? revenue.some((item) => item.campaign_id === operation.campaign_id) : false;
    const hasLearning = operation ? learnings.some((item) => item.campaign_id === operation.campaign_id) : false;
    const stage = affiliateProgramStage(program, operation, { hasEvidence, hasActual, hasLearning });
    if (stage !== "completed") return {
      stage, title: AFFILIATE_STAGE_LABELS[stage], offerId: offer.id, programId: program?.id || null,
      message: stage === "registered" ? "市場・条件・素材・実行計画を確認し、運用準備を開始してください。" :
        stage === "research_required" || stage === "compliance_review" || stage === "content_plan" ? "Affiliate案件と実行計画を完成してください。" :
        stage === "owner_approval" ? "計画を確認し、Manual Execution Packageを承認してください。" :
        stage === "manual_execution" ? "承認済みPackageを使い、Ownerが手動で実行してください。" :
        stage === "evidence_pending" ? "手動実行のEvidenceを登録してください。" :
        stage === "actual_review" ? "Evidenceに基づくActual Revenue / Costを確認してください。" : "Actualから得た学習を確認してください。",
    };
  }
  return { stage: "completed", title: "完了 / Monitoring", message: "全案件は監視中です。", offerId: offers[0].id };
}

export function preparationProgress(program) {
  if (!program) return 0;
  return Math.max(0, Math.min(100, Math.round(((Number(program.preparation_step) || 0) / 9) * 100)));
}
