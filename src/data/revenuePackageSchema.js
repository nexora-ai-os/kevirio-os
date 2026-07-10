import { ARTIFACT_TYPES, REQUIRED_APPROVAL_TYPES } from "./aiWorkforceRegistry.js";

export const REVENUE_PACKAGE_SCHEMA_VERSION = "1.0.0";
export const REVENUE_PACKAGE_VERSION = "1.0.0";
export const REVENUE_PACKAGE_SOURCE = "KEVIRIO_REVENUE_PACKAGE";
export const REVENUE_PACKAGE_EVENT_CANDIDATE_SOURCE = "KEVIRIO_REVENUE_PACKAGE_EVENT_CANDIDATE";

export const REVENUE_PACKAGE_STATUSES = Object.freeze({
  DRAFT: "DRAFT",
});

export const REVENUE_PACKAGE_VALUE_TYPES = Object.freeze({
  MOCK: "MOCK",
});

export const ARTIFACT_STATUSES = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  MOCK_DRAFT_READY: "MOCK_DRAFT_READY",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const EVENT_CANDIDATE_STATUS = Object.freeze({
  PLANNED: "PLANNED",
});

export const REVENUE_PACKAGE_ARTIFACT_TYPES = Object.freeze([...ARTIFACT_TYPES]);
export const REVENUE_PACKAGE_APPROVAL_TYPES = Object.freeze([...REQUIRED_APPROVAL_TYPES]);

export const ARTIFACT_CATEGORIES = Object.freeze({
  SNS: "SNS",
  BLOG_SEO: "Blog / SEO",
  VIDEO: "Video",
  CREATIVE: "Creative",
  AFFILIATE: "Affiliate",
  LEGAL_BRAND: "Legal / Brand",
  APPROVAL_PUBLISH: "Approval / Publish",
  PERFORMANCE: "Performance",
});

export const ARTIFACT_CATEGORY_BY_TYPE = Object.freeze({
  JP_SNS_POST: ARTIFACT_CATEGORIES.SNS,
  GLOBAL_SNS_POST: ARTIFACT_CATEGORIES.SNS,
  BLOG_ARTICLE: ARTIFACT_CATEGORIES.BLOG_SEO,
  SEO_TITLE: ARTIFACT_CATEGORIES.BLOG_SEO,
  META_DESCRIPTION: ARTIFACT_CATEGORIES.BLOG_SEO,
  YOUTUBE_SHORTS_SCRIPT: ARTIFACT_CATEGORIES.VIDEO,
  TIKTOK_SCRIPT: ARTIFACT_CATEGORIES.VIDEO,
  INSTAGRAM_IMAGE_IDEA: ARTIFACT_CATEGORIES.CREATIVE,
  CANVA_INSTRUCTION: ARTIFACT_CATEGORIES.CREATIVE,
  AFFILIATE_FUNNEL: ARTIFACT_CATEGORIES.AFFILIATE,
  CTA: ARTIFACT_CATEGORIES.AFFILIATE,
  LEGAL_CHECK: ARTIFACT_CATEGORIES.LEGAL_BRAND,
  BRAND_QA: ARTIFACT_CATEGORIES.LEGAL_BRAND,
  OWNER_APPROVAL_PACKAGE: ARTIFACT_CATEGORIES.APPROVAL_PUBLISH,
  PUBLISH_PREPARED: ARTIFACT_CATEGORIES.APPROVAL_PUBLISH,
  PERFORMANCE_ANALYSIS_TEMPLATE: ARTIFACT_CATEGORIES.PERFORMANCE,
});

export const ARTIFACT_TITLE_BY_TYPE = Object.freeze({
  JP_SNS_POST: "日本語SNS投稿案",
  GLOBAL_SNS_POST: "グローバルSNS投稿案",
  BLOG_ARTICLE: "ブログ記事ドラフト",
  SEO_TITLE: "SEOタイトル案",
  META_DESCRIPTION: "メタディスクリプション案",
  YOUTUBE_SHORTS_SCRIPT: "YouTube Shorts台本",
  TIKTOK_SCRIPT: "TikTok台本",
  INSTAGRAM_IMAGE_IDEA: "Instagram画像アイデア",
  CANVA_INSTRUCTION: "Canva制作指示",
  AFFILIATE_FUNNEL: "アフィリエイト導線",
  CTA: "CTA案",
  LEGAL_CHECK: "法務確認メモ",
  BRAND_QA: "ブランドQA",
  OWNER_APPROVAL_PACKAGE: "Owner承認パッケージ",
  PUBLISH_PREPARED: "公開準備メモ",
  PERFORMANCE_ANALYSIS_TEMPLATE: "パフォーマンス分析テンプレート",
});

export const PACKAGE_REQUIRED_FIELDS = Object.freeze([
  "packageId",
  "packageVersion",
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
  "mockOnly",
  "externalExecutionAllowed",
  "productionExecutionAllowed",
  "createdAt",
  "updatedAt",
  "createdBy",
  "packageSummary",
  "assignments",
  "artifacts",
  "qualitySummary",
  "legalSummary",
  "brandSummary",
  "approvalSummary",
  "publishPreparation",
  "performanceTemplate",
  "eventCandidates",
  "validationErrors",
  "sourceOfTruth",
  "schemaVersion",
]);

export const PACKAGE_TOP_LEVEL_FIELDS = Object.freeze([...PACKAGE_REQUIRED_FIELDS]);

export const ARTIFACT_REQUIRED_FIELDS = Object.freeze([
  "artifactId",
  "artifactType",
  "title",
  "category",
  "status",
  "valueType",
  "mockOnly",
  "primaryOwnerEmployeeId",
  "reviewerEmployeeId",
  "backupEmployeeId",
  "requiredApprovalType",
  "requiredLegalReview",
  "requiredBrandReview",
  "input",
  "draft",
  "qualityCriteria",
  "validationErrors",
  "createdAt",
  "updatedAt",
]);

export const ASSIGNMENT_REQUIRED_FIELDS = Object.freeze([
  "assignmentId",
  "artifactId",
  "artifactType",
  "campaignId",
  "packageId",
  "primaryOwnerEmployeeId",
  "reviewerEmployeeId",
  "backupEmployeeId",
  "status",
  "valueType",
  "mockOnly",
]);

export const EVENT_CANDIDATE_REQUIRED_FIELDS = Object.freeze([
  "candidateId",
  "eventName",
  "candidateStatus",
  "notOccurred",
  "appendable",
  "correlationId",
  "intendedActor",
  "intendedTarget",
  "intendedPayload",
  "valueType",
  "mockOnly",
  "createdAt",
  "occurredAt",
  "recordedAt",
  "sourceOfTruth",
  "schemaVersion",
]);
