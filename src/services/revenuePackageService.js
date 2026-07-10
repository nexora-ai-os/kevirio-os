import {
  ARTIFACT_CATEGORIES,
  ARTIFACT_CATEGORY_BY_TYPE,
  ARTIFACT_REQUIRED_FIELDS,
  ARTIFACT_STATUSES,
  ARTIFACT_TITLE_BY_TYPE,
  ASSIGNMENT_REQUIRED_FIELDS,
  EVENT_CANDIDATE_REQUIRED_FIELDS,
  EVENT_CANDIDATE_STATUS,
  PACKAGE_REQUIRED_FIELDS,
  PACKAGE_TOP_LEVEL_FIELDS,
  REVENUE_PACKAGE_APPROVAL_TYPES,
  REVENUE_PACKAGE_ARTIFACT_TYPES,
  REVENUE_PACKAGE_EVENT_CANDIDATE_SOURCE,
  REVENUE_PACKAGE_SCHEMA_VERSION,
  REVENUE_PACKAGE_SOURCE,
  REVENUE_PACKAGE_STATUSES,
  REVENUE_PACKAGE_VALUE_TYPES,
  REVENUE_PACKAGE_VERSION,
} from "../data/revenuePackageSchema.js";
import { EVENT_NAMES } from "../data/eventLedgerSchema.js";
import { CAMPAIGN_TYPES, CHANNEL_OPTIONS, LANGUAGE_OPTIONS, getRevenueGoalOptions } from "./revenueCampaignService.js";
import { canExecute, createPhase1Context, EXECUTION_MODES } from "./safetyEngine.js";
import { getArtifactAssignmentTemplate, getEmployeeById, validateWorkforceRegistry } from "./aiWorkforceService.js";

const MAX_INPUT_BYTES = 20000;
const MAX_PACKAGE_BYTES = 120000;
const ACTION_TYPE = "revenue.package.mock.generate";
const dangerousKeys = new Set(["__proto__", "constructor", "prototype"]);
const allowedCampaignFields = new Set([
  "campaignId",
  "correlationId",
  "opportunityId",
  "campaignType",
  "theme",
  "targetAudience",
  "revenueGoal",
  "primaryChannels",
  "language",
  "valueType",
  "status",
  "source",
  "mockOnly",
  "externalExecutionAllowed",
  "ownerApprovalRequired",
  "createdAt",
  "updatedAt",
  "createdBy",
  "validationErrors",
  "revenuePackageInput",
]);
const packageFields = new Set(PACKAGE_TOP_LEVEL_FIELDS);
const eventCandidateFields = new Set([...EVENT_CANDIDATE_REQUIRED_FIELDS, "sequenceHint", "note"]);
const artifactTypes = new Set(REVENUE_PACKAGE_ARTIFACT_TYPES);
const approvalTypes = new Set(REVENUE_PACKAGE_APPROVAL_TYPES);
const eventNames = new Set(EVENT_NAMES);
const validArtifactStatuses = new Set(Object.values(ARTIFACT_STATUSES));

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createError(code, message, extra = {}) {
  return { code, message, ...extra };
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]" && Object.getPrototypeOf(value) === Object.prototype;
}

function isIsoDate(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function sizeOf(value) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function createSummary(packageDraft) {
  return {
    artifactCount: Array.isArray(packageDraft?.artifacts) ? packageDraft.artifacts.length : 0,
    assignmentCount: Array.isArray(packageDraft?.assignments) ? packageDraft.assignments.length : 0,
    eventCandidateCount: Array.isArray(packageDraft?.eventCandidates) ? packageDraft.eventCandidates.length : 0,
    unknownTopLevelFields: 0,
    missingArtifacts: 0,
    duplicateArtifactTypes: 0,
    duplicateArtifactIds: 0,
    invalidAssignments: 0,
    unsupportedAssignments: 0,
    invalidEventCandidates: 0,
  };
}

function validatePlainObject(value, errors, path = "input", depth = 0) {
  if (!isPlainObject(value)) {
    errors.push(createError("NOT_PLAIN_OBJECT", `${path} must be a plain object.`, { field: path }));
    return;
  }
  if (depth > 8) {
    errors.push(createError("OBJECT_TOO_DEEP", `${path} is too deeply nested.`, { field: path }));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    const field = `${path}.${key}`;
    if (dangerousKeys.has(key)) errors.push(createError("DANGEROUS_KEY", "Prototype pollution keys are not allowed.", { field }));
    if (typeof item === "function" || item instanceof Date || item instanceof Error) {
      errors.push(createError("UNSUPPORTED_VALUE", "Unsupported value.", { field }));
    }
    if (isPlainObject(item)) validatePlainObject(item, errors, field, depth + 1);
    if (Array.isArray(item)) {
      item.forEach((entry, index) => {
        if (isPlainObject(entry)) validatePlainObject(entry, errors, `${field}.${index}`, depth + 1);
      });
    }
  }
}

function getRequestedArtifacts(campaign) {
  return campaign?.revenuePackageInput?.requestedArtifacts || REVENUE_PACKAGE_ARTIFACT_TYPES;
}

export function validateRevenuePackageInput(campaign = {}) {
  const errors = [];
  try {
    validatePlainObject(campaign, errors, "campaign");
    if (!isPlainObject(campaign)) return { ok: false, errors };
    if (sizeOf(campaign) > MAX_INPUT_BYTES) errors.push(createError("INPUT_TOO_LARGE", "Campaign input is too large.", { field: "campaign" }));

    Object.keys(campaign).forEach((key) => {
      if (!allowedCampaignFields.has(key)) errors.push(createError("INPUT_UNKNOWN_FIELD", `Unknown campaign field: ${key}`, { field: key }));
    });

    if (typeof campaign.campaignId !== "string" || !campaign.campaignId.trim()) errors.push(createError("CAMPAIGN_ID_MISSING", "campaignId is required.", { field: "campaignId" }));
    if (typeof campaign.correlationId !== "string" || !campaign.correlationId.trim()) errors.push(createError("CORRELATION_ID_MISSING", "correlationId is required.", { field: "correlationId" }));
    if (typeof campaign.opportunityId !== "string" || !campaign.opportunityId.trim()) errors.push(createError("OPPORTUNITY_ID_MISSING", "opportunityId is required.", { field: "opportunityId" }));
    if (!Object.values(CAMPAIGN_TYPES).includes(campaign.campaignType)) errors.push(createError("CAMPAIGN_TYPE_UNKNOWN", "campaignType is unknown.", { field: "campaignType" }));
    if (typeof campaign.theme !== "string" || !campaign.theme.trim()) errors.push(createError("THEME_MISSING", "theme is required.", { field: "theme" }));
    if (typeof campaign.targetAudience !== "string" || !campaign.targetAudience.trim()) errors.push(createError("TARGET_AUDIENCE_MISSING", "targetAudience is required.", { field: "targetAudience" }));
    if (!getRevenueGoalOptions(campaign.campaignType).includes(campaign.revenueGoal)) errors.push(createError("REVENUE_GOAL_UNKNOWN", "revenueGoal is unknown for campaignType.", { field: "revenueGoal" }));
    if (!LANGUAGE_OPTIONS.includes(campaign.language)) errors.push(createError("LANGUAGE_UNKNOWN", "language is unknown.", { field: "language" }));
    if (!Array.isArray(campaign.primaryChannels) || campaign.primaryChannels.length === 0) {
      errors.push(createError("PRIMARY_CHANNELS_INVALID", "primaryChannels must be a non-empty array.", { field: "primaryChannels" }));
    } else {
      const seenChannels = new Set();
      campaign.primaryChannels.forEach((channel) => {
        if (typeof channel !== "string" || !CHANNEL_OPTIONS.includes(channel)) errors.push(createError("PRIMARY_CHANNEL_UNKNOWN", `Unknown channel: ${channel}`, { field: "primaryChannels" }));
        if (seenChannels.has(channel)) errors.push(createError("PRIMARY_CHANNEL_DUPLICATE", `Duplicate channel: ${channel}`, { field: "primaryChannels" }));
        seenChannels.add(channel);
      });
    }
    if (campaign.valueType !== REVENUE_PACKAGE_VALUE_TYPES.MOCK) errors.push(createError("VALUE_TYPE_INVALID", "Campaign valueType must be MOCK.", { field: "valueType" }));
    if (campaign.mockOnly !== true) errors.push(createError("MOCK_ONLY_INVALID", "Campaign mockOnly must be true.", { field: "mockOnly" }));
    if (campaign.externalExecutionAllowed !== false) errors.push(createError("EXTERNAL_EXECUTION_INVALID", "externalExecutionAllowed must be false.", { field: "externalExecutionAllowed" }));

    const requestedArtifacts = getRequestedArtifacts(campaign);
    if (!Array.isArray(requestedArtifacts)) {
      errors.push(createError("REQUESTED_ARTIFACTS_NOT_ARRAY", "requestedArtifacts must be an array.", { field: "revenuePackageInput.requestedArtifacts" }));
    } else {
      const seen = new Set();
      requestedArtifacts.forEach((artifactType) => {
        if (typeof artifactType !== "string" || !artifactType.trim()) errors.push(createError("REQUESTED_ARTIFACT_EMPTY", "requestedArtifacts must not contain empty values.", { field: "revenuePackageInput.requestedArtifacts" }));
        if (!artifactTypes.has(artifactType)) errors.push(createError("REQUESTED_ARTIFACT_UNKNOWN", `Unknown artifactType: ${artifactType}`, { artifactType }));
        if (seen.has(artifactType)) errors.push(createError("REQUESTED_ARTIFACT_DUPLICATE", `Duplicate artifactType: ${artifactType}`, { artifactType }));
        seen.add(artifactType);
      });
      REVENUE_PACKAGE_ARTIFACT_TYPES.forEach((artifactType) => {
        if (!seen.has(artifactType)) errors.push(createError("REQUESTED_ARTIFACT_MISSING", `Required artifactType is missing: ${artifactType}`, { artifactType }));
      });
      if (requestedArtifacts.length !== REVENUE_PACKAGE_ARTIFACT_TYPES.length) {
        errors.push(createError("REQUESTED_ARTIFACT_COUNT_INVALID", "requestedArtifacts must contain exactly 16 artifact types.", { field: "revenuePackageInput.requestedArtifacts" }));
      }
    }
  } catch (caught) {
    errors.push(createError("INPUT_VALIDATION_EXCEPTION", `Revenue package input validation failed closed: ${caught instanceof Error ? caught.message : "unknown error"}`));
  }

  return { ok: errors.length === 0, errors };
}

function postDraft(id, channel, campaign, language = "Japanese") {
  const isEnglish = language === "English";
  return {
    postId: id,
    language,
    channel,
    hook: isEnglish ? `Mock question for ${campaign.theme}` : `${campaign.theme}で次に迷う点`,
    body: isEnglish
      ? `Mock-only post for ${campaign.targetAudience}. It frames the problem, gives a safe next step, and avoids performance claims.`
      : `${campaign.targetAudience}向けに、課題、判断軸、次の行動を短く整理するMock投稿案です。`,
    CTA: isEnglish ? "Review the mock package" : "Mockパッケージを確認する",
    hashtags: isEnglish ? ["#Mock", "#NoExternalAPI", "#RevenuePlanning"] : ["#Mock", "#未公開", "#収益設計"],
    objective: `Goal: ${campaign.revenueGoal}`,
    translationReviewRequired: isEnglish,
    reviewNotes: "要確認。外部投稿・送信はしない。",
    status: ARTIFACT_STATUSES.MOCK_DRAFT_READY,
  };
}

function makeDraft(artifactType, campaign) {
  const channels = campaign.primaryChannels;
  const common = {
    campaignTheme: campaign.theme,
    targetAudience: campaign.targetAudience,
    revenueGoal: campaign.revenueGoal,
    primaryChannels: [...channels],
    language: campaign.language,
    mockNotice: "Mock draft only. 外部投稿・送信・公開・承認確定は行わない。",
    nextReview: "Owner確認前の下書き。実績・外部事実・収益確定として扱わない。",
  };

  const drafts = {
    JP_SNS_POST: {
      ...common,
      posts: [
        postDraft("jp_sns_1", channels[0] || "Threads", campaign),
        postDraft("jp_sns_2", channels[1] || "Instagram", campaign),
        postDraft("jp_sns_3", channels[2] || "Blog", campaign),
      ],
    },
    GLOBAL_SNS_POST: {
      ...common,
      posts: [
        postDraft("global_sns_1", "LinkedIn", campaign, "English"),
        postDraft("global_sns_2", "X", campaign, "English"),
        postDraft("global_sns_3", "Instagram", campaign, "English"),
      ],
    },
    BLOG_ARTICLE: {
      ...common,
      title: `${campaign.theme}のMock収益パッケージ`,
      seoTitle: `${campaign.theme}で次にやること`,
      metaDescription: `${campaign.targetAudience}向けに${campaign.theme}の判断材料を整理するMock記事案。`,
      slug: campaign.theme.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "mock-revenue-package",
      searchIntent: "Ownerが公開前に構成と収益導線を確認する",
      primaryKeyword: campaign.theme,
      secondaryKeywords: [campaign.revenueGoal, ...channels.slice(0, 2)],
      outline: ["課題", "解決方針", "収益導線", "Legal / Brand確認", "次の行動"],
      introduction: `${campaign.targetAudience}が${campaign.theme}を検討するときの判断材料をMockで整理する。`,
      bodySections: [
        { heading: "課題", body: "要確認の仮説として課題を整理する。" },
        { heading: "収益導線", body: `${campaign.revenueGoal}に向けたMock導線を示す。` },
        { heading: "確認事項", body: "Legal、Brand、Owner承認前の確認点を並べる。" },
      ],
      conclusion: "公開前にOwnerが承認要否を判断する。",
      CTA: "Owner確認へ進める",
      affiliateDisclosure: "要確認。外部リンク設置前に開示文言を確認する。",
      legalNotes: ["実績保証なし", "Actual Revenueなし", "外部公開なし"],
      references: [{ label: "Owner提供情報", verificationStatus: "要確認" }],
      referencesStatus: "要確認",
      status: ARTIFACT_STATUSES.REVIEW_REQUIRED,
    },
    SEO_TITLE: {
      ...common,
      primaryTitle: `${campaign.theme}の始め方`,
      alternatives: [`${campaign.theme}で次にやること`, `${campaign.theme}のMock収益設計`, `${campaign.targetAudience}向け${campaign.theme}`],
      primaryKeyword: campaign.theme,
      searchIntent: "公開前の検索意図仮説",
      reviewNotes: "要確認。検索実績として扱わない。",
    },
    META_DESCRIPTION: {
      ...common,
      primaryDescription: `${campaign.theme}を${campaign.targetAudience}向けに整理し、次の行動を決めるためのMock説明文。`,
      alternatives: [`${campaign.revenueGoal}に向けた下書き説明文。`, "外部公開前の確認用メタ説明文。"],
      characterCount: 0,
      targetKeyword: campaign.theme,
      reviewNotes: "文字数は公開前に再確認。",
    },
    YOUTUBE_SHORTS_SCRIPT: {
      ...common,
      hook: `${campaign.theme}で最初に見るべき点`,
      durationEstimate: "30秒",
      scenes: ["課題提示", "Mock解決策", "確認事項", "CTA"],
      narration: [`${campaign.targetAudience}向けのMock台本。`, "外部公開前にOwner確認が必要。"],
      onScreenText: ["Mock Only", "未公開", "未承認"],
      captions: ["これはMock下書きです。"],
      CTA: "確認パッケージを見る",
      reviewNotes: "アップロード不可。公開前承認が必要。",
    },
    TIKTOK_SCRIPT: {
      ...common,
      hook: `${campaign.theme}のよくある迷い`,
      durationEstimate: "25秒",
      sceneFlow: ["Hook", "Before", "After", "Mock CTA"],
      narration: ["Mockの課題提示", "要確認の次アクション"],
      onScreenText: ["下書き", "未公開", "Legal確認前"],
      CTA: "Mock案を確認",
      reviewNotes: "投稿しない。誇大表現なし。",
    },
    INSTAGRAM_IMAGE_IDEA: {
      ...common,
      concept: "課題、判断軸、次の行動をカルーセルで見せる",
      format: "Carousel",
      slideCount: 5,
      slides: ["表紙", "課題", "解決方針", "収益導線", "確認CTA"],
      visualDirection: "落ち着いた配色、Mock表示を明確化",
      copy: `${campaign.theme}の確認用Mock`,
      CTA: "Owner確認へ",
      reviewNotes: "画像生成・投稿なし。",
    },
    CANVA_INSTRUCTION: {
      ...common,
      canvasType: "Instagram carousel mock",
      dimensions: "1080x1350",
      pageCount: 5,
      layout: "表紙、問題、解決、導線、CTA",
      safeArea: "上下左右80px",
      typography: "見出し太字、本文は短文",
      colorDirection: "高コントラスト、ブランド確認前の仮配色",
      imageDirection: "外部画像なし。必要素材は要確認プレースホルダー。",
      pageInstructions: ["Mock表示", "未公開表示", "未承認表示"],
      copyPlacement: "各ページ中央寄せ、CTAは最終ページ下部",
      exportFormat: "PNG draft",
      exportInstructions: "外部Canva連携なし。制作指示のみ。",
      requiredAssets: ["ロゴ要確認", "ブランドカラー要確認"],
      reviewNotes: "制作者が構成を理解できる粒度。",
    },
    AFFILIATE_FUNNEL: {
      ...common,
      audienceProblem: `${campaign.targetAudience}が${campaign.theme}で迷う`,
      awarenessStage: "Problem aware",
      contentEntry: channels[0] || "Blog",
      offerPosition: "比較後のMock CTA",
      conversionPath: ["SNS", "Blog", "CTA", "Owner確認"],
      CTA: "候補リンクを確認",
      disclosure: "アフィリエイト開示は要確認",
      trustElements: ["未検証表記", "誇大表現なし", "Legal確認"],
      measurementPlan: ["Mock click", "Mock lead", "Forecast revenue"],
      reviewNotes: "外部リンク設置なし。",
    },
    CTA: {
      ...common,
      primaryCTA: "Mockパッケージを確認する",
      alternatives: ["詳細を見る", "次の確認へ進む", "Legal/Brand確認を開く"],
      destinationType: "Internal mock package",
      intent: campaign.revenueGoal,
      complianceNote: "外部送信・購入誘導なし。",
      reviewNotes: "公開前にOwner確認。",
    },
    LEGAL_CHECK: {
      ...common,
      status: "REVIEW_REQUIRED",
      completed: false,
      claimsToReview: ["収益保証", "実績表現", "外部リンク表現"],
      disclosureRequired: true,
      disclosureItems: ["Mock Only", "No External API", "No Production"],
      prohibitedExpressions: ["確実に稼げる", "承認済み", "公開済み"],
      riskLevel: "REVIEW_REQUIRED",
      blockedClaims: ["Actual Revenue", "Owner approved", "Production ready"],
      reviewerNotes: "レビュー完了・問題なしとは扱わない。",
    },
    BRAND_QA: {
      ...common,
      status: "REVIEW_REQUIRED",
      completed: false,
      tone: "落ち着いたOwner判断向け",
      consistencyChecks: ["日本語中心", "誇張なし", "短期収益と本命事業を混同しない"],
      visualChecks: ["Mock表記", "未公開表記"],
      terminologyChecks: ["ActualとForecastの分離", "承認前表記"],
      blockedItems: ["公開済み表現", "承認済み表現"],
      reviewerNotes: "レビュー完了ではない。",
    },
    OWNER_APPROVAL_PACKAGE: {
      ...common,
      status: "NOT_REQUESTED",
      approvalRequired: true,
      approvalItems: ["公開可否", "Legal確認", "Brand確認", "外部導線"],
      riskSummary: "未確認リスクあり。Owner承認前。",
      costSummary: "estimatedCost: 0 / externalCost: 0",
      recommendation: "確認後に次の判断へ進む",
      recommendationBasis: "Mock成果物、Legal/Brand確認前提",
      approvalDecision: null,
      requestedAt: null,
      decisionAt: null,
    },
    PUBLISH_PREPARED: {
      ...common,
      status: "PREPARATION_ONLY",
      published: false,
      scheduled: false,
      channels,
      requiredManualActions: ["Owner承認", "Legal確認", "Brand確認"],
      blockedExternalActions: ["publish", "send", "post", "schedule"],
      checklist: ["未公開", "未承認", "外部送信なし"],
      scheduleStatus: "NOT_SCHEDULED",
      ownerApprovalRequired: true,
    },
    PERFORMANCE_ANALYSIS_TEMPLATE: {
      ...common,
      KPI: ["Mock reach", "Mock CTR", "Mock lead intent", "Forecast revenue"],
      baseline: "要確認",
      target: "要確認",
      actual: null,
      measurementSource: "Mock package only",
      attributionMethod: "要確認",
      reviewDate: null,
      reviewStatus: "NOT_STARTED",
    },
  };
  return drafts[artifactType] || common;
}

function createArtifact(artifactType, campaign, now) {
  const assignment = getArtifactAssignmentTemplate(artifactType);
  const requiresLegal = artifactType === "LEGAL_CHECK" || artifactType === "OWNER_APPROVAL_PACKAGE" || assignment?.requiredLegalReview === true;
  const requiresBrand = artifactType === "BRAND_QA" || artifactType === "OWNER_APPROVAL_PACKAGE" || assignment?.requiredBrandReview === true;
  return {
    artifactId: createId("artifact"),
    artifactType,
    title: ARTIFACT_TITLE_BY_TYPE[artifactType],
    category: ARTIFACT_CATEGORY_BY_TYPE[artifactType],
    status: requiresLegal || requiresBrand || artifactType === "OWNER_APPROVAL_PACKAGE" ? ARTIFACT_STATUSES.REVIEW_REQUIRED : ARTIFACT_STATUSES.MOCK_DRAFT_READY,
    valueType: REVENUE_PACKAGE_VALUE_TYPES.MOCK,
    mockOnly: true,
    primaryOwnerEmployeeId: assignment?.primaryOwnerEmployeeId,
    reviewerEmployeeId: assignment?.reviewerEmployeeId,
    backupEmployeeId: assignment?.backupEmployeeId,
    requiredApprovalType: assignment?.requiredApprovalType,
    requiredLegalReview: Boolean(requiresLegal),
    requiredBrandReview: Boolean(requiresBrand),
    input: {
      campaignId: campaign.campaignId,
      correlationId: campaign.correlationId,
      theme: campaign.theme,
      targetAudience: campaign.targetAudience,
      revenueGoal: campaign.revenueGoal,
      primaryChannels: [...campaign.primaryChannels],
      language: campaign.language,
    },
    draft: makeDraft(artifactType, campaign),
    qualityCriteria: ["Mock表記が明確", "外部実行を含まない", "Ownerが次の判断をできる", "担当AIがMVP15内"],
    validationErrors: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createAssignments(artifacts, packageDraft, now) {
  return artifacts.map((artifact) => ({
    assignmentId: createId("assignment"),
    artifactId: artifact.artifactId,
    artifactType: artifact.artifactType,
    campaignId: packageDraft.campaignId,
    packageId: packageDraft.packageId,
    primaryOwnerEmployeeId: artifact.primaryOwnerEmployeeId,
    reviewerEmployeeId: artifact.reviewerEmployeeId,
    backupEmployeeId: artifact.backupEmployeeId,
    status: "PLANNED",
    valueType: REVENUE_PACKAGE_VALUE_TYPES.MOCK,
    mockOnly: true,
    createdAt: now,
    updatedAt: now,
  }));
}

function createEventCandidate(input, packageDraft, now, index) {
  return {
    candidateId: createId("candidate"),
    eventName: input.eventName,
    candidateStatus: EVENT_CANDIDATE_STATUS.PLANNED,
    notOccurred: true,
    appendable: false,
    correlationId: packageDraft.correlationId,
    intendedActor: input.intendedActor,
    intendedTarget: input.intendedTarget,
    intendedPayload: input.intendedPayload,
    valueType: REVENUE_PACKAGE_VALUE_TYPES.MOCK,
    mockOnly: true,
    createdAt: now,
    occurredAt: null,
    recordedAt: null,
    sourceOfTruth: REVENUE_PACKAGE_EVENT_CANDIDATE_SOURCE,
    schemaVersion: REVENUE_PACKAGE_SCHEMA_VERSION,
    sequenceHint: index + 1,
    note: "未発生のEvent Candidate。Event Ledgerへappendされていない。",
  };
}

export function createPackageEventCandidates(packageDraft) {
  const now = packageDraft?.createdAt || new Date().toISOString();
  const firstArtifact = packageDraft?.artifacts?.[0];
  const legalArtifact = packageDraft?.artifacts?.find((artifact) => artifact.artifactType === "LEGAL_CHECK");
  const brandArtifact = packageDraft?.artifacts?.find((artifact) => artifact.artifactType === "BRAND_QA");
  const approvalArtifact = packageDraft?.artifacts?.find((artifact) => artifact.artifactType === "OWNER_APPROVAL_PACKAGE");
  const taskAssignment = packageDraft?.assignments?.[0];
  const inputs = [
    {
      eventName: "workflow.started",
      intendedActor: { actorType: "SYSTEM", actorId: null, displayName: "KEVIRIO Mock Package Generator" },
      intendedTarget: { targetType: "WORKFLOW", targetId: `workflow_${packageDraft.packageId}` },
      intendedPayload: { workflowRunId: `workflow_${packageDraft.packageId}`, campaignId: packageDraft.campaignId, workflowType: "REVENUE_PACKAGE_MOCK" },
    },
    {
      eventName: "task.assigned",
      intendedActor: { actorType: "AI_EMPLOYEE", actorId: "M26", displayName: getEmployeeById("M26")?.displayName || "M26" },
      intendedTarget: { targetType: "TASK", targetId: taskAssignment?.assignmentId },
      intendedPayload: { assignmentId: taskAssignment?.assignmentId, employeeId: taskAssignment?.primaryOwnerEmployeeId, artifactType: taskAssignment?.artifactType, campaignId: packageDraft.campaignId },
    },
    {
      eventName: "content.generated",
      intendedActor: { actorType: "AI_EMPLOYEE", actorId: firstArtifact?.primaryOwnerEmployeeId, displayName: getEmployeeById(firstArtifact?.primaryOwnerEmployeeId)?.displayName || firstArtifact?.primaryOwnerEmployeeId },
      intendedTarget: { targetType: "CONTENT_ASSET", targetId: firstArtifact?.artifactId },
      intendedPayload: { contentAssetId: firstArtifact?.artifactId, artifactType: firstArtifact?.artifactType, employeeId: firstArtifact?.primaryOwnerEmployeeId, campaignId: packageDraft.campaignId, generationMode: "MOCK" },
    },
    {
      eventName: "legal.reviewed",
      intendedActor: { actorType: "AI_EMPLOYEE", actorId: legalArtifact?.reviewerEmployeeId, displayName: getEmployeeById(legalArtifact?.reviewerEmployeeId)?.displayName || legalArtifact?.reviewerEmployeeId },
      intendedTarget: { targetType: "CONTENT_ASSET", targetId: legalArtifact?.artifactId },
      intendedPayload: { contentAssetId: legalArtifact?.artifactId, employeeId: legalArtifact?.reviewerEmployeeId, artifactType: legalArtifact?.artifactType, riskLevel: "REVIEW_REQUIRED" },
    },
    {
      eventName: "quality.reviewed",
      intendedActor: { actorType: "AI_EMPLOYEE", actorId: brandArtifact?.reviewerEmployeeId, displayName: getEmployeeById(brandArtifact?.reviewerEmployeeId)?.displayName || brandArtifact?.reviewerEmployeeId },
      intendedTarget: { targetType: "CONTENT_ASSET", targetId: brandArtifact?.artifactId },
      intendedPayload: { contentAssetId: brandArtifact?.artifactId, employeeId: brandArtifact?.reviewerEmployeeId, artifactType: brandArtifact?.artifactType, qualityLevel: "REVIEW_REQUIRED" },
    },
    {
      eventName: "approval.requested",
      intendedActor: { actorType: "AI_EMPLOYEE", actorId: approvalArtifact?.primaryOwnerEmployeeId, displayName: getEmployeeById(approvalArtifact?.primaryOwnerEmployeeId)?.displayName || approvalArtifact?.primaryOwnerEmployeeId },
      intendedTarget: { targetType: "APPROVAL", targetId: `approval_${packageDraft.packageId}` },
      intendedPayload: { approvalRequestId: `approval_${packageDraft.packageId}`, campaignId: packageDraft.campaignId, packageId: packageDraft.packageId, approvalType: "OWNER_REQUIRED" },
    },
  ];

  return inputs.map((input, index) => createEventCandidate(input, packageDraft, now, index));
}

export function createRevenuePackageDraft(campaign) {
  const now = new Date().toISOString();
  const packageId = createId("package");
  const artifacts = REVENUE_PACKAGE_ARTIFACT_TYPES.map((artifactType) => createArtifact(artifactType, campaign, now));
  const packageDraft = {
    packageId,
    packageVersion: REVENUE_PACKAGE_VERSION,
    campaignId: campaign.campaignId,
    correlationId: campaign.correlationId,
    opportunityId: campaign.opportunityId,
    campaignType: campaign.campaignType,
    theme: campaign.theme,
    targetAudience: campaign.targetAudience,
    revenueGoal: campaign.revenueGoal,
    primaryChannels: [...campaign.primaryChannels],
    language: campaign.language,
    valueType: REVENUE_PACKAGE_VALUE_TYPES.MOCK,
    status: REVENUE_PACKAGE_STATUSES.DRAFT,
    mockOnly: true,
    externalExecutionAllowed: false,
    productionExecutionAllowed: false,
    createdAt: now,
    updatedAt: now,
    createdBy: "Owner",
    packageSummary: {
      nextBestAction: "OwnerがLegal / Brand確認ポイントを見て、公開前承認に進めるか判断する。",
      campaignTheme: campaign.theme,
      artifactCount: artifacts.length,
      actualRevenue: "未接続",
      forecastRevenue: "Forecast",
      mockRevenue: "Mock",
    },
    assignments: [],
    artifacts,
    qualitySummary: {
      status: "REVIEW_REQUIRED",
      criteria: ["16成果物のMockドラフト", "担当AIの分離", "実績誤認なし", "外部実行なし"],
      blockedReasons: [],
    },
    legalSummary: {
      status: "REVIEW_REQUIRED",
      mockOnly: true,
      completed: false,
      riskItems: ["実績保証表現", "公開前Owner承認", "外部送信なし"],
      disclosureItems: ["Development", "Mock Only", "No External API", "No Production"],
      blockedClaims: ["Actual Revenue", "Production ready", "Owner approved"],
    },
    brandSummary: {
      status: "REVIEW_REQUIRED",
      mockOnly: true,
      completed: false,
      brandChecks: ["日本語中心", "簡潔なOwner判断", "本命事業と短期収益の混同なし"],
      toneChecks: ["落ち着いた", "誇張なし"],
      visualChecks: ["Mock表記", "Actual未接続表記"],
    },
    approvalSummary: {
      status: "NOT_REQUESTED",
      ownerApprovalRequired: true,
      approvalDecision: null,
      approvalConfirmed: false,
      message: "Owner承認は未実施。ここでは承認パッケージの下書きのみ作成。",
    },
    publishPreparation: {
      status: "PREPARATION_ONLY",
      published: false,
      scheduled: false,
      externalPublishAllowed: false,
      checklist: ["Legal review required", "Brand QA required", "Owner approval required"],
    },
    performanceTemplate: {
      status: "MOCK_TEMPLATE",
      actualRevenue: "未接続",
      metrics: ["Forecast revenue", "Mock conversions", "Mock leads", "Review completion"],
    },
    eventCandidates: [],
    validationErrors: [],
    sourceOfTruth: REVENUE_PACKAGE_SOURCE,
    schemaVersion: REVENUE_PACKAGE_SCHEMA_VERSION,
  };
  packageDraft.assignments = createAssignments(artifacts, packageDraft, now);
  packageDraft.eventCandidates = createPackageEventCandidates(packageDraft);
  return packageDraft;
}

function employeeSupportsArtifact(employee, artifactType, role) {
  if (!employee) return false;
  if (employee.externalExecutionAllowed !== false || employee.productionExecutionAllowed !== false || employee.mockOnly !== true) return false;
  if (employee.supportedArtifactTypes?.includes(artifactType)) return true;
  if (role === "primary") return false;
  const capabilityText = [
    employee.departmentName,
    employee.roleTitle,
    ...(employee.capabilityTags || []),
    ...(employee.primaryResponsibilities || []),
  ].join(" ").toLowerCase();
  const category = ARTIFACT_CATEGORY_BY_TYPE[artifactType];
  if (category === ARTIFACT_CATEGORIES.LEGAL_BRAND) return /legal|brand|governance|risk|qa|compliance|approval|coordination/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.APPROVAL_PUBLISH) return /approval|publish|briefing|coordination|governance|operations|brand/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.PERFORMANCE) return /analytics|forecast|strategy|briefing|performance|cfo/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.BLOG_SEO) return /seo|research|blog|content|marketing|brand|copy|conversion/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.SNS) return /sns|marketing|copy|brand|creative|global|content|audience|research/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.VIDEO) return /video|short|creative|content|brand|legal|copy|sns|caption|instagram/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.CREATIVE) return /creative|design|brand|sns|marketing/.test(capabilityText);
  if (category === ARTIFACT_CATEGORIES.AFFILIATE) return /affiliate|finance|seo|marketing|revenue|cta/.test(capabilityText);
  return false;
}

function validateArtifactDraft(artifact, errors) {
  const draft = artifact.draft;
  if (!isPlainObject(draft)) errors.push(createError("ARTIFACT_DRAFT_INVALID", "draft must be a plain object.", { artifactType: artifact.artifactType, field: "draft" }));
  if (!isPlainObject(draft)) return;
  const requiredByType = {
    JP_SNS_POST: ["posts"],
    GLOBAL_SNS_POST: ["posts"],
    BLOG_ARTICLE: ["title", "seoTitle", "metaDescription", "slug", "searchIntent", "primaryKeyword", "secondaryKeywords", "outline", "introduction", "bodySections", "conclusion", "CTA", "affiliateDisclosure", "legalNotes", "references", "referencesStatus", "status"],
    CANVA_INSTRUCTION: ["canvasType", "dimensions", "pageCount", "layout", "safeArea", "typography", "colorDirection", "imageDirection", "pageInstructions", "copyPlacement", "exportFormat", "exportInstructions", "requiredAssets", "reviewNotes"],
    LEGAL_CHECK: ["status", "completed", "claimsToReview", "disclosureRequired", "disclosureItems", "prohibitedExpressions", "riskLevel", "blockedClaims", "reviewerNotes"],
    BRAND_QA: ["status", "completed", "tone", "consistencyChecks", "visualChecks", "terminologyChecks", "blockedItems", "reviewerNotes"],
    OWNER_APPROVAL_PACKAGE: ["status", "approvalRequired", "approvalItems", "riskSummary", "costSummary", "recommendation", "recommendationBasis", "approvalDecision", "requestedAt", "decisionAt"],
    PUBLISH_PREPARED: ["status", "published", "scheduled", "channels", "requiredManualActions", "blockedExternalActions", "checklist", "scheduleStatus", "ownerApprovalRequired"],
    PERFORMANCE_ANALYSIS_TEMPLATE: ["KPI", "baseline", "target", "actual", "measurementSource", "attributionMethod", "reviewDate", "reviewStatus"],
  };
  (requiredByType[artifact.artifactType] || []).forEach((field) => {
    if (!(field in draft)) errors.push(createError("ARTIFACT_DRAFT_FIELD_MISSING", `Draft is missing ${field}.`, { artifactType: artifact.artifactType, field: `draft.${field}` }));
  });
  if (artifact.artifactType === "JP_SNS_POST" && (!Array.isArray(draft.posts) || draft.posts.length !== 3)) errors.push(createError("JP_SNS_POST_COUNT_INVALID", "JP_SNS_POST must contain 3 post drafts.", { artifactType: artifact.artifactType }));
  if (artifact.artifactType === "GLOBAL_SNS_POST" && (!Array.isArray(draft.posts) || draft.posts.length !== 3 || draft.posts.some((post) => post.language !== "English"))) {
    errors.push(createError("GLOBAL_SNS_POST_INVALID", "GLOBAL_SNS_POST must contain 3 English post drafts.", { artifactType: artifact.artifactType }));
  }
  if (artifact.artifactType === "LEGAL_CHECK" && (draft.status !== "REVIEW_REQUIRED" || draft.completed !== false)) errors.push(createError("LEGAL_CHECK_INVALID", "LEGAL_CHECK must remain REVIEW_REQUIRED and incomplete.", { artifactType: artifact.artifactType }));
  if (artifact.artifactType === "BRAND_QA" && (draft.status !== "REVIEW_REQUIRED" || draft.completed !== false)) errors.push(createError("BRAND_QA_INVALID", "BRAND_QA must remain REVIEW_REQUIRED and incomplete.", { artifactType: artifact.artifactType }));
  if (artifact.artifactType === "OWNER_APPROVAL_PACKAGE" && (draft.status !== "NOT_REQUESTED" || draft.approvalDecision !== null || draft.requestedAt !== null || draft.decisionAt !== null)) {
    errors.push(createError("OWNER_APPROVAL_DRAFT_INVALID", "Owner approval draft must remain NOT_REQUESTED with null decision fields.", { artifactType: artifact.artifactType }));
  }
  if (artifact.artifactType === "PUBLISH_PREPARED" && (draft.status !== "PREPARATION_ONLY" || draft.published !== false || draft.scheduled !== false)) {
    errors.push(createError("PUBLISH_PREPARED_INVALID", "PUBLISH_PREPARED must remain preparation-only, unpublished, and unscheduled.", { artifactType: artifact.artifactType }));
  }
}

function validateArtifact(artifact, errors) {
  if (!isPlainObject(artifact)) {
    errors.push(createError("ARTIFACT_INVALID", "Artifact must be a plain object."));
    return;
  }
  ARTIFACT_REQUIRED_FIELDS.forEach((field) => {
    if (!(field in artifact)) errors.push(createError("ARTIFACT_FIELD_MISSING", `Artifact is missing ${field}.`, { artifactType: artifact.artifactType, field }));
  });
  if (!artifactTypes.has(artifact.artifactType)) errors.push(createError("ARTIFACT_TYPE_UNKNOWN", "artifactType is unknown.", { artifactType: artifact.artifactType, field: "artifactType" }));
  if (!validArtifactStatuses.has(artifact.status)) errors.push(createError("ARTIFACT_STATUS_UNKNOWN", "Artifact status is not allowed.", { artifactType: artifact.artifactType, field: "status" }));
  if (artifact.valueType !== REVENUE_PACKAGE_VALUE_TYPES.MOCK) errors.push(createError("ARTIFACT_VALUE_TYPE_INVALID", "Artifact valueType must be MOCK.", { artifactType: artifact.artifactType, field: "valueType" }));
  if (artifact.mockOnly !== true) errors.push(createError("ARTIFACT_MOCK_ONLY_INVALID", "Artifact mockOnly must be true.", { artifactType: artifact.artifactType, field: "mockOnly" }));
  if (!approvalTypes.has(artifact.requiredApprovalType)) errors.push(createError("ARTIFACT_APPROVAL_TYPE_UNKNOWN", "requiredApprovalType is unknown.", { artifactType: artifact.artifactType, field: "requiredApprovalType" }));
  if (typeof artifact.requiredLegalReview !== "boolean") errors.push(createError("ARTIFACT_LEGAL_REVIEW_INVALID", "requiredLegalReview must be boolean.", { artifactType: artifact.artifactType, field: "requiredLegalReview" }));
  if (typeof artifact.requiredBrandReview !== "boolean") errors.push(createError("ARTIFACT_BRAND_REVIEW_INVALID", "requiredBrandReview must be boolean.", { artifactType: artifact.artifactType, field: "requiredBrandReview" }));
  const owners = [artifact.primaryOwnerEmployeeId, artifact.reviewerEmployeeId, artifact.backupEmployeeId];
  owners.forEach((employeeId) => {
    if (!getEmployeeById(employeeId)) errors.push(createError("ARTIFACT_EMPLOYEE_UNKNOWN", `Employee is not in MVP15: ${employeeId}`, { artifactType: artifact.artifactType, employeeId }));
  });
  if (new Set(owners).size !== owners.length) errors.push(createError("ARTIFACT_EMPLOYEE_DUPLICATE", "primaryOwner/reviewer/backup must be distinct.", { artifactType: artifact.artifactType }));
  const [primary, reviewer, backup] = owners.map((employeeId) => getEmployeeById(employeeId));
  if (!employeeSupportsArtifact(primary, artifact.artifactType, "primary")) errors.push(createError("ARTIFACT_PRIMARY_UNSUPPORTED", "Primary owner does not support artifactType.", { artifactType: artifact.artifactType, employeeId: artifact.primaryOwnerEmployeeId }));
  if (!employeeSupportsArtifact(reviewer, artifact.artifactType, "reviewer")) errors.push(createError("ARTIFACT_REVIEWER_UNSUPPORTED", "Reviewer does not have suitable artifact capability.", { artifactType: artifact.artifactType, employeeId: artifact.reviewerEmployeeId }));
  if (!employeeSupportsArtifact(backup, artifact.artifactType, "backup")) errors.push(createError("ARTIFACT_BACKUP_UNSUPPORTED", "Backup does not have suitable artifact capability.", { artifactType: artifact.artifactType, employeeId: artifact.backupEmployeeId }));
  if (!isIsoDate(artifact.createdAt) || !isIsoDate(artifact.updatedAt)) errors.push(createError("ARTIFACT_DATE_INVALID", "Artifact dates must be ISO 8601.", { artifactType: artifact.artifactType }));
  validateArtifactDraft(artifact, errors);
}

function validateAssignment(assignment, packageDraft, artifactByType, errors) {
  if (!isPlainObject(assignment)) {
    errors.push(createError("ASSIGNMENT_INVALID", "Assignment must be a plain object."));
    return;
  }
  ASSIGNMENT_REQUIRED_FIELDS.forEach((field) => {
    if (!(field in assignment)) errors.push(createError("ASSIGNMENT_FIELD_MISSING", `Assignment is missing ${field}.`, { assignmentId: assignment.assignmentId, field }));
  });
  const artifact = artifactByType.get(assignment.artifactType);
  if (!artifact) errors.push(createError("ASSIGNMENT_ARTIFACT_MISSING", "Assignment has no matching artifact.", { assignmentId: assignment.assignmentId, artifactType: assignment.artifactType }));
  if (artifact && assignment.artifactId !== artifact.artifactId) errors.push(createError("ASSIGNMENT_ARTIFACT_ID_MISMATCH", "assignment.artifactId must match artifact.artifactId.", { assignmentId: assignment.assignmentId, artifactType: assignment.artifactType }));
  if (assignment.packageId !== packageDraft.packageId) errors.push(createError("ASSIGNMENT_PACKAGE_ID_MISMATCH", "assignment.packageId must match packageId.", { assignmentId: assignment.assignmentId }));
  if (assignment.campaignId !== packageDraft.campaignId) errors.push(createError("ASSIGNMENT_CAMPAIGN_ID_MISMATCH", "assignment.campaignId must match campaignId.", { assignmentId: assignment.assignmentId }));
  if (assignment.status !== "PLANNED") errors.push(createError("ASSIGNMENT_STATUS_INVALID", "Assignment status must be PLANNED.", { assignmentId: assignment.assignmentId }));
  if (assignment.valueType !== REVENUE_PACKAGE_VALUE_TYPES.MOCK) errors.push(createError("ASSIGNMENT_VALUE_TYPE_INVALID", "Assignment valueType must be MOCK.", { assignmentId: assignment.assignmentId }));
  if (assignment.mockOnly !== true) errors.push(createError("ASSIGNMENT_MOCK_ONLY_INVALID", "Assignment mockOnly must be true.", { assignmentId: assignment.assignmentId }));
  const owners = [assignment.primaryOwnerEmployeeId, assignment.reviewerEmployeeId, assignment.backupEmployeeId];
  owners.forEach((employeeId) => {
    if (!getEmployeeById(employeeId)) errors.push(createError("ASSIGNMENT_EMPLOYEE_UNKNOWN", "Assignment employee is not in MVP15.", { assignmentId: assignment.assignmentId, employeeId }));
  });
  if (new Set(owners).size !== owners.length) errors.push(createError("ASSIGNMENT_EMPLOYEE_DUPLICATE", "Assignment primary/reviewer/backup must be distinct.", { assignmentId: assignment.assignmentId }));
  if (artifact) {
    ["primaryOwnerEmployeeId", "reviewerEmployeeId", "backupEmployeeId"].forEach((field) => {
      if (assignment[field] !== artifact[field]) errors.push(createError("ASSIGNMENT_ARTIFACT_OWNER_MISMATCH", `${field} must match artifact.`, { assignmentId: assignment.assignmentId, artifactType: artifact.artifactType, field }));
    });
  }
}

function validateEventCandidate(candidate, packageDraft, errors) {
  if (!isPlainObject(candidate)) {
    errors.push(createError("EVENT_CANDIDATE_INVALID", "Event candidate must be a plain object."));
    return;
  }
  EVENT_CANDIDATE_REQUIRED_FIELDS.forEach((field) => {
    if (!(field in candidate)) errors.push(createError("EVENT_CANDIDATE_FIELD_MISSING", `Event candidate is missing ${field}.`, { field }));
  });
  Object.keys(candidate).forEach((field) => {
    if (!eventCandidateFields.has(field)) errors.push(createError("EVENT_CANDIDATE_UNKNOWN_FIELD", `Unknown event candidate field: ${field}`, { field }));
  });
  if (!eventNames.has(candidate.eventName)) errors.push(createError("EVENT_CANDIDATE_NAME_UNKNOWN", "eventName is unknown.", { field: "eventName" }));
  if (candidate.candidateStatus !== EVENT_CANDIDATE_STATUS.PLANNED) errors.push(createError("EVENT_CANDIDATE_STATUS_INVALID", "candidateStatus must be PLANNED.", { field: "candidateStatus" }));
  if (candidate.notOccurred !== true) errors.push(createError("EVENT_CANDIDATE_OCCURRED", "notOccurred must be true.", { field: "notOccurred" }));
  if (candidate.appendable !== false) errors.push(createError("EVENT_CANDIDATE_APPENDABLE", "appendable must be false.", { field: "appendable" }));
  if (candidate.correlationId !== packageDraft.correlationId) errors.push(createError("EVENT_CANDIDATE_CORRELATION_MISMATCH", "correlationId must match package.", { field: "correlationId" }));
  if (candidate.valueType !== REVENUE_PACKAGE_VALUE_TYPES.MOCK) errors.push(createError("EVENT_CANDIDATE_VALUE_TYPE_INVALID", "valueType must be MOCK.", { field: "valueType" }));
  if (candidate.mockOnly !== true) errors.push(createError("EVENT_CANDIDATE_MOCK_ONLY_INVALID", "mockOnly must be true.", { field: "mockOnly" }));
  if (candidate.occurredAt !== null) errors.push(createError("EVENT_CANDIDATE_OCCURRED_AT_INVALID", "occurredAt must be null for an unoccurred candidate.", { field: "occurredAt" }));
  if (candidate.recordedAt !== null) errors.push(createError("EVENT_CANDIDATE_RECORDED_AT_INVALID", "recordedAt must be null for an unrecorded candidate.", { field: "recordedAt" }));
  if (candidate.sourceOfTruth !== REVENUE_PACKAGE_EVENT_CANDIDATE_SOURCE) errors.push(createError("EVENT_CANDIDATE_SOURCE_INVALID", "sourceOfTruth is invalid.", { field: "sourceOfTruth" }));
  if (candidate.schemaVersion !== REVENUE_PACKAGE_SCHEMA_VERSION) errors.push(createError("EVENT_CANDIDATE_SCHEMA_INVALID", "schemaVersion must be 1.0.0.", { field: "schemaVersion" }));
  if (!isPlainObject(candidate.intendedActor)) errors.push(createError("EVENT_CANDIDATE_ACTOR_INVALID", "intendedActor must be a plain object.", { field: "intendedActor" }));
  if (!isPlainObject(candidate.intendedTarget)) errors.push(createError("EVENT_CANDIDATE_TARGET_INVALID", "intendedTarget must be a plain object.", { field: "intendedTarget" }));
  if (!isPlainObject(candidate.intendedPayload)) errors.push(createError("EVENT_CANDIDATE_PAYLOAD_INVALID", "intendedPayload must be a plain object.", { field: "intendedPayload" }));
}

export function validateRevenuePackage(packageDraft = {}) {
  const errors = [];
  const summary = createSummary(packageDraft);
  const add = (item) => {
    errors.push(item);
    if (item.code === "PACKAGE_UNKNOWN_FIELD") summary.unknownTopLevelFields += 1;
    if (item.code === "ARTIFACT_TYPE_MISSING") summary.missingArtifacts += 1;
    if (item.code === "ARTIFACT_TYPE_DUPLICATE") summary.duplicateArtifactTypes += 1;
    if (item.code === "ARTIFACT_ID_DUPLICATE") summary.duplicateArtifactIds += 1;
    if (item.code.includes("ASSIGNMENT")) summary.invalidAssignments += 1;
    if (item.code.includes("UNSUPPORTED")) summary.unsupportedAssignments += 1;
    if (item.code.includes("EVENT_CANDIDATE")) summary.invalidEventCandidates += 1;
  };

  try {
    validatePlainObject(packageDraft, errors, "package");
    if (!isPlainObject(packageDraft)) return { valid: false, errors, summary };
    if (sizeOf(packageDraft) > MAX_PACKAGE_BYTES) add(createError("PACKAGE_TOO_LARGE", "Package is too large.", { field: "package" }));
    PACKAGE_REQUIRED_FIELDS.forEach((field) => {
      if (!(field in packageDraft)) add(createError("PACKAGE_FIELD_MISSING", `Package is missing ${field}.`, { field }));
      if (field in packageDraft && packageDraft[field] === null && !["validationErrors"].includes(field)) add(createError("PACKAGE_FIELD_NULL", `${field} must not be null.`, { field }));
    });
    Object.keys(packageDraft).forEach((field) => {
      if (!packageFields.has(field)) add(createError("PACKAGE_UNKNOWN_FIELD", `Unknown package field: ${field}`, { field }));
    });

    if (packageDraft.packageVersion !== REVENUE_PACKAGE_VERSION) add(createError("PACKAGE_VERSION_INVALID", "packageVersion must be 1.0.0.", { field: "packageVersion" }));
    if (packageDraft.valueType !== REVENUE_PACKAGE_VALUE_TYPES.MOCK) add(createError("PACKAGE_VALUE_TYPE_INVALID", "valueType must be MOCK.", { field: "valueType" }));
    if (packageDraft.status !== REVENUE_PACKAGE_STATUSES.DRAFT) add(createError("PACKAGE_STATUS_INVALID", "status must be DRAFT.", { field: "status" }));
    if (packageDraft.mockOnly !== true) add(createError("PACKAGE_MOCK_ONLY_INVALID", "mockOnly must be true.", { field: "mockOnly" }));
    if (packageDraft.externalExecutionAllowed !== false) add(createError("PACKAGE_EXTERNAL_EXECUTION_INVALID", "externalExecutionAllowed must be false.", { field: "externalExecutionAllowed" }));
    if (packageDraft.productionExecutionAllowed !== false) add(createError("PACKAGE_PRODUCTION_EXECUTION_INVALID", "productionExecutionAllowed must be false.", { field: "productionExecutionAllowed" }));
    if (packageDraft.sourceOfTruth !== REVENUE_PACKAGE_SOURCE) add(createError("PACKAGE_SOURCE_INVALID", "sourceOfTruth is invalid.", { field: "sourceOfTruth" }));
    if (packageDraft.schemaVersion !== REVENUE_PACKAGE_SCHEMA_VERSION) add(createError("PACKAGE_SCHEMA_INVALID", "schemaVersion must be 1.0.0.", { field: "schemaVersion" }));
    if (!isIsoDate(packageDraft.createdAt) || !isIsoDate(packageDraft.updatedAt)) add(createError("PACKAGE_DATE_INVALID", "Package dates must be ISO 8601."));
    if (packageDraft.approvalSummary?.approvalDecision !== null || packageDraft.approvalSummary?.approvalConfirmed !== false) add(createError("OWNER_APPROVAL_CONFIRMED", "Owner approval must not be confirmed in P0-005.", { field: "approvalSummary" }));
    if (packageDraft.legalSummary?.completed !== false) add(createError("LEGAL_COMPLETED_INVALID", "Legal review must not be completed.", { field: "legalSummary.completed" }));
    if (packageDraft.brandSummary?.completed !== false) add(createError("BRAND_COMPLETED_INVALID", "Brand review must not be completed.", { field: "brandSummary.completed" }));
    if (packageDraft.publishPreparation?.published !== false || packageDraft.publishPreparation?.scheduled !== false) add(createError("PUBLISH_STATE_INVALID", "Publish preparation must remain unpublished and unscheduled.", { field: "publishPreparation" }));

    const workforceValidation = validateWorkforceRegistry();
    if (!workforceValidation.valid) add(createError("WORKFORCE_REGISTRY_INVALID", "MVP15 workforce registry is invalid.", { details: workforceValidation.errors }));

    const artifactByType = new Map();
    const artifactIds = new Set();
    if (!Array.isArray(packageDraft.artifacts)) {
      add(createError("ARTIFACTS_NOT_ARRAY", "artifacts must be an array.", { field: "artifacts" }));
    } else {
      packageDraft.artifacts.forEach((artifact) => {
        validateArtifact(artifact, errors);
        if (artifactByType.has(artifact?.artifactType)) add(createError("ARTIFACT_TYPE_DUPLICATE", "artifactType is duplicated.", { artifactType: artifact?.artifactType }));
        artifactByType.set(artifact?.artifactType, artifact);
        if (artifactIds.has(artifact?.artifactId)) add(createError("ARTIFACT_ID_DUPLICATE", "artifactId is duplicated.", { artifactType: artifact?.artifactType, field: "artifactId" }));
        artifactIds.add(artifact?.artifactId);
      });
      REVENUE_PACKAGE_ARTIFACT_TYPES.forEach((artifactType) => {
        if (!artifactByType.has(artifactType)) add(createError("ARTIFACT_TYPE_MISSING", `Required artifact is missing: ${artifactType}`, { artifactType }));
      });
      if (packageDraft.artifacts.length !== REVENUE_PACKAGE_ARTIFACT_TYPES.length) add(createError("ARTIFACT_COUNT_INVALID", "Package must contain exactly 16 artifacts.", { field: "artifacts" }));
    }

    const assignmentByType = new Map();
    const assignmentIds = new Set();
    if (!Array.isArray(packageDraft.assignments)) {
      add(createError("ASSIGNMENTS_NOT_ARRAY", "assignments must be an array.", { field: "assignments" }));
    } else {
      packageDraft.assignments.forEach((assignment) => {
        validateAssignment(assignment, packageDraft, artifactByType, errors);
        if (assignmentByType.has(assignment?.artifactType)) add(createError("ASSIGNMENT_ARTIFACT_TYPE_DUPLICATE", "Assignment artifactType is duplicated.", { assignmentId: assignment?.assignmentId, artifactType: assignment?.artifactType }));
        assignmentByType.set(assignment?.artifactType, assignment);
        if (assignmentIds.has(assignment?.assignmentId)) add(createError("ASSIGNMENT_ID_DUPLICATE", "assignmentId is duplicated.", { assignmentId: assignment?.assignmentId }));
        assignmentIds.add(assignment?.assignmentId);
      });
      REVENUE_PACKAGE_ARTIFACT_TYPES.forEach((artifactType) => {
        if (!assignmentByType.has(artifactType)) add(createError("ASSIGNMENT_MISSING_FOR_ARTIFACT", "Assignment is missing for artifactType.", { artifactType }));
      });
      if (packageDraft.assignments.length !== REVENUE_PACKAGE_ARTIFACT_TYPES.length) add(createError("ASSIGNMENT_COUNT_INVALID", "Package must contain exactly 16 assignments.", { field: "assignments" }));
    }

    const candidateIds = new Set();
    if (!Array.isArray(packageDraft.eventCandidates) || packageDraft.eventCandidates.length !== 6) {
      add(createError("EVENT_CANDIDATES_INVALID", "eventCandidates must contain exactly 6 planned candidates.", { field: "eventCandidates" }));
    } else {
      packageDraft.eventCandidates.forEach((candidate) => {
        validateEventCandidate(candidate, packageDraft, errors);
        if (candidateIds.has(candidate?.candidateId)) add(createError("EVENT_CANDIDATE_DUPLICATE", "candidateId is duplicated.", { field: "candidateId" }));
        candidateIds.add(candidate?.candidateId);
      });
    }
  } catch (caught) {
    add(createError("PACKAGE_VALIDATION_EXCEPTION", `Revenue package validation failed closed: ${caught instanceof Error ? caught.message : "unknown error"}`));
  }

  summary.unknownTopLevelFields = errors.filter((item) => item.code === "PACKAGE_UNKNOWN_FIELD").length;
  summary.missingArtifacts = errors.filter((item) => item.code === "ARTIFACT_TYPE_MISSING").length;
  summary.duplicateArtifactTypes = errors.filter((item) => item.code === "ARTIFACT_TYPE_DUPLICATE").length;
  summary.duplicateArtifactIds = errors.filter((item) => item.code === "ARTIFACT_ID_DUPLICATE").length;
  summary.invalidAssignments = errors.filter((item) => item.code.includes("ASSIGNMENT")).length;
  summary.unsupportedAssignments = errors.filter((item) => item.code.includes("UNSUPPORTED")).length;
  summary.invalidEventCandidates = errors.filter((item) => item.code.includes("EVENT_CANDIDATE")).length;

  return { valid: errors.length === 0, errors, summary };
}

export function generateRevenuePackage(campaign, context = {}) {
  try {
    const inputValidation = validateRevenuePackageInput(campaign);
    if (!inputValidation.ok) return { ok: false, packageDraft: null, errors: inputValidation.errors, guard: null };

    const guard = canExecute(createPhase1Context({
      executionMode: EXECUTION_MODES.DEVELOPMENT,
      actionType: ACTION_TYPE,
      workflowType: "internal-mock",
      isExternalRequest: false,
      ownerApproved: false,
      approvalValid: false,
      emergencyStop: { active: Boolean(context?.budget?.emergencyStop) },
      estimatedTaskCost: 0,
      estimatedWorkflowCost: 0,
      dailyUsage: Number(context?.budget?.dailyUsed || 0),
      monthlyUsage: Number(context?.budget?.monthlyUsed || 0),
      budgetLimits: context?.budget || undefined,
      provider: { id: "local-mock", status: "mock-only" },
      mockOnly: true,
    }));
    if (!guard.allowed) return { ok: false, packageDraft: null, errors: [createError("SAFETY_GUARD_BLOCKED", guard.reason || "Safety guard blocked package generation.")], guard };

    const packageDraft = createRevenuePackageDraft(campaign);
    const packageValidation = validateRevenuePackage(packageDraft);
    return {
      ok: packageValidation.valid,
      packageDraft: packageValidation.valid ? packageDraft : null,
      errors: packageValidation.errors,
      guard,
    };
  } catch (caught) {
    return {
      ok: false,
      packageDraft: null,
      errors: [createError("PACKAGE_GENERATION_EXCEPTION", `Revenue package generation failed closed: ${caught instanceof Error ? caught.message : "unknown error"}`)],
      guard: null,
    };
  }
}

export function getArtifactsByCategory(packageDraft, category) {
  if (!Array.isArray(packageDraft?.artifacts)) return [];
  return packageDraft.artifacts.filter((artifact) => artifact.category === category);
}

export function getArtifactByType(packageDraft, artifactType) {
  if (!Array.isArray(packageDraft?.artifacts)) return null;
  return packageDraft.artifacts.find((artifact) => artifact.artifactType === artifactType) || null;
}

export function getPackageAssignmentSummary(packageDraft) {
  const employeeIds = new Set();
  if (Array.isArray(packageDraft?.assignments)) {
    packageDraft.assignments.forEach((assignment) => {
      employeeIds.add(assignment.primaryOwnerEmployeeId);
      employeeIds.add(assignment.reviewerEmployeeId);
      employeeIds.add(assignment.backupEmployeeId);
    });
  }
  return {
    assignmentCount: packageDraft?.assignments?.length || 0,
    aiEmployeeCount: [...employeeIds].filter(Boolean).length,
    employees: [...employeeIds].filter(Boolean).map((employeeId) => getEmployeeById(employeeId)).filter(Boolean),
  };
}

export function getPackageStatusSummary(packageDraft) {
  const artifacts = Array.isArray(packageDraft?.artifacts) ? packageDraft.artifacts : [];
  const byStatus = artifacts.reduce((acc, artifact) => {
    acc[artifact.status] = (acc[artifact.status] || 0) + 1;
    return acc;
  }, {});
  const byCategory = Object.values(ARTIFACT_CATEGORIES).map((category) => ({
    category,
    count: artifacts.filter((artifact) => artifact.category === category).length,
  }));
  return {
    artifactCount: artifacts.length,
    byStatus,
    byCategory,
    legalStatus: packageDraft?.legalSummary?.status || "UNKNOWN",
    brandStatus: packageDraft?.brandSummary?.status || "UNKNOWN",
    approvalStatus: packageDraft?.approvalSummary?.status || "UNKNOWN",
    eventCandidateCount: packageDraft?.eventCandidates?.length || 0,
  };
}
