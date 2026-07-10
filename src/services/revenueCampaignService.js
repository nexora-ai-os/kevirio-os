import { canExecute, createPhase1Context, EXECUTION_MODES } from "./safetyEngine";

export const REVENUE_CAMPAIGN_STORAGE_KEY = "kevirio.revenueCampaigns.v1";

export const CAMPAIGN_TYPES = Object.freeze({
  CORE_MEDIA: "CORE_MEDIA",
  SHORT_TERM_SERVICE: "SHORT_TERM_SERVICE",
});

export const CORE_MEDIA_GOALS = [
  "AFFILIATE_REVENUE",
  "AD_REVENUE",
  "PRODUCT_REVENUE",
  "SERVICE_LEAD",
  "BRAND_GROWTH",
];

export const SHORT_TERM_SERVICE_GOALS = [
  "SERVICE_REVENUE",
  "LEAD_GENERATION",
  "ORDER_ACQUISITION",
  "REPEAT_ORDER",
  "PORTFOLIO_BUILDING",
];

export const CHANNEL_OPTIONS = [
  "Threads",
  "Instagram",
  "Blog",
  "YouTube Shorts",
  "TikTok",
  "Pinterest",
  "X",
  "LinkedIn",
  "CrowdWorks",
  "Lancers",
  "Coconala",
  "Direct Proposal",
  "Existing Network",
];

export const LANGUAGE_OPTIONS = ["Japanese", "English", "Japanese + English"];

export const REQUESTED_ARTIFACTS = [
  "JP_SNS_POST",
  "GLOBAL_SNS_POST",
  "BLOG_ARTICLE",
  "SEO_TITLE",
  "META_DESCRIPTION",
  "YOUTUBE_SHORTS_SCRIPT",
  "TIKTOK_SCRIPT",
  "INSTAGRAM_IMAGE_IDEA",
  "CANVA_INSTRUCTION",
  "AFFILIATE_FUNNEL",
  "CTA",
  "LEGAL_CHECK",
  "BRAND_QA",
  "OWNER_APPROVAL_PACKAGE",
  "PUBLISH_PREPARED",
  "PERFORMANCE_ANALYSIS_TEMPLATE",
];

const DEFAULT_INPUT = Object.freeze({
  campaignType: CAMPAIGN_TYPES.CORE_MEDIA,
  theme: "AI副業・AI業務効率化",
  targetAudience: "AI初心者・個人・小規模事業者",
  revenueGoal: "AFFILIATE_REVENUE",
  primaryChannels: ["Threads", "Instagram", "Blog"],
  language: "Japanese + English",
});

function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
}

function hasUnsafeMarkup(value) {
  return /<[^>]+>|javascript:/i.test(value);
}

function normalizeTextField(value, maxLength, label) {
  if (typeof value !== "string") {
    return { ok: false, value: "", error: `${label}は文字列で入力してください。` };
  }

  const text = value.trim();
  if (!text) return { ok: false, value: "", error: `${label}を入力してください。` };
  if (text.length > maxLength) return { ok: false, value: text, error: `${label}は${maxLength}文字以内にしてください。` };
  if (hasUnsafeMarkup(text)) return { ok: false, value: text, error: "HTMLやスクリプト文字列は使用できません。" };
  return { ok: true, value: text, error: "" };
}

function normalizeSelectValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrimaryChannels(channels) {
  if (!Array.isArray(channels)) {
    return { ok: false, value: [], error: "主チャネルは配列で指定してください。" };
  }

  if (channels.length === 0) {
    return { ok: false, value: [], error: "主チャネルを1件以上選択してください。" };
  }

  const normalized = [];
  for (const channel of channels) {
    if (typeof channel !== "string" || !channel.trim()) {
      return { ok: false, value: [], error: "主チャネルには空でない文字列だけを指定してください。" };
    }

    const value = channel.trim();
    if (!CHANNEL_OPTIONS.includes(value)) {
      return { ok: false, value: [], error: `未知の主チャネルは使用できません: ${value}` };
    }

    if (!normalized.includes(value)) normalized.push(value);
  }

  return { ok: true, value: normalized, error: "" };
}

export function getDefaultRevenueCampaignInput() {
  return {
    ...DEFAULT_INPUT,
    primaryChannels: [...DEFAULT_INPUT.primaryChannels],
  };
}

export function getRevenueGoalOptions(campaignType) {
  return campaignType === CAMPAIGN_TYPES.SHORT_TERM_SERVICE ? SHORT_TERM_SERVICE_GOALS : CORE_MEDIA_GOALS;
}

export function validateRevenueCampaignInput(input = {}) {
  const errors = {};
  const campaignType = input.campaignType;
  const themeResult = normalizeTextField(input.theme, 120, "テーマ");
  const audienceResult = normalizeTextField(input.targetAudience, 240, "対象者");
  const revenueGoal = normalizeSelectValue(input.revenueGoal);
  const channelsResult = normalizePrimaryChannels(input.primaryChannels);
  const language = normalizeSelectValue(input.language);
  const theme = themeResult.value;
  const targetAudience = audienceResult.value;
  const primaryChannels = channelsResult.value;
  const goalOptions = getRevenueGoalOptions(campaignType);

  if (!Object.values(CAMPAIGN_TYPES).includes(campaignType)) errors.campaignType = "Campaign typeを選択してください。";
  if (!themeResult.ok) errors.theme = themeResult.error;
  if (!audienceResult.ok) errors.targetAudience = audienceResult.error;
  if (!goalOptions.includes(revenueGoal)) errors.revenueGoal = "収益目的を選択してください。";
  if (!channelsResult.ok) errors.primaryChannels = channelsResult.error;
  if (!LANGUAGE_OPTIONS.includes(language)) errors.language = "言語を選択してください。";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    normalized: {
      campaignType,
      theme,
      targetAudience,
      revenueGoal,
      primaryChannels,
      language,
    },
  };
}

export function buildRevenuePackageInput(campaign) {
  return {
    campaignId: campaign.campaignId,
    correlationId: campaign.correlationId,
    campaignType: campaign.campaignType,
    theme: campaign.theme,
    targetAudience: campaign.targetAudience,
    revenueGoal: campaign.revenueGoal,
    primaryChannels: campaign.primaryChannels,
    language: campaign.language,
    requestedArtifacts: [...REQUESTED_ARTIFACTS],
    legalReviewRequired: true,
    brandQaRequired: true,
    ownerApprovalRequired: false,
    valueType: "MOCK",
    mockOnly: true,
  };
}

export function buildMockRevenueCampaign(input = {}, budget = {}) {
  const validation = validateRevenueCampaignInput(input);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, campaign: null, guard: null };
  }

  const guard = canExecute(createPhase1Context({
    executionMode: EXECUTION_MODES.DEVELOPMENT,
    actionType: "mock-campaign-create",
    workflowType: "internal-mock",
    isExternalRequest: false,
    ownerApproved: false,
    approvalValid: false,
    emergencyStop: { active: Boolean(budget?.emergencyStop) },
    estimatedTaskCost: 0,
    estimatedWorkflowCost: 0,
    dailyUsage: Number(budget?.dailyUsed || 0),
    monthlyUsage: Number(budget?.monthlyUsed || 0),
    budgetLimits: budget || undefined,
    provider: { id: "local-mock", status: "mock-only" },
    mockOnly: true,
  }));

  if (!guard.allowed) {
    return { ok: false, errors: { guard: guard.reason }, campaign: null, guard };
  }

  const now = new Date().toISOString();
  const campaign = {
    campaignId: createId("campaign"),
    correlationId: createId("corr"),
    opportunityId: createId("opp"),
    ...validation.normalized,
    valueType: "MOCK",
    status: "DRAFT",
    source: "OWNER_INPUT",
    mockOnly: true,
    externalExecutionAllowed: false,
    ownerApprovalRequired: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "Owner",
    validationErrors: {},
  };

  return {
    ok: true,
    errors: {},
    guard,
    campaign: {
      ...campaign,
      revenuePackageInput: buildRevenuePackageInput(campaign),
    },
  };
}
