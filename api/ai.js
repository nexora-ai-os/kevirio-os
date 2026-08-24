const ALLOWED_MODES = new Set(["general", "review", "revision", "pipeline", "sandbox", "mock", "local-mock"]);
const REAL_PROVIDERS = new Set(["openai", "gemini", "anthropic", "claude", "perplexity", "meta", "google", "canva"]);

function normalizeControlValue(value) {
  return String(value || "").trim().toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBlockedFlag(value) {
  return value === true || normalizeControlValue(value) === "true";
}

function requestsMockDisabled(value) {
  return value === false || normalizeControlValue(value) === "false";
}

function isUnknownMode(mode) {
  if (mode == null || mode === "") return false;
  return !ALLOWED_MODES.has(normalizeControlValue(mode));
}

function isBlockedExecutionRequest(body = {}) {
  if (!isPlainObject(body)) return false;
  const context = isPlainObject(body.context) ? body.context : {};
  const mode = body.executionMode ?? context.executionMode ?? context.mode;
  const provider = normalizeControlValue(body.provider ?? context.provider);
  return (
    requestsMockDisabled(body.mockOnly) ||
    requestsMockDisabled(context.mockOnly) ||
    hasBlockedFlag(body.externalExecution) ||
    hasBlockedFlag(context.externalExecution) ||
    hasBlockedFlag(body.externalCommunication) ||
    hasBlockedFlag(context.externalCommunication) ||
    hasBlockedFlag(body.production) ||
    hasBlockedFlag(context.production) ||
    hasBlockedFlag(body.productionExecution) ||
    hasBlockedFlag(context.productionExecution) ||
    hasBlockedFlag(body.isExternalRequest) ||
    hasBlockedFlag(context.isExternalRequest) ||
    isUnknownMode(mode) ||
    REAL_PROVIDERS.has(provider)
  );
}

function buildMockReply(message, context = {}) {
  const mode = context.mode || "general";
  return [
    "KEVIRIO Mock AIです。",
    "外部API、fetch、Production実行は行いません。",
    `依頼: ${message}`,
    `モード: ${mode}`,
    "次の一手: Ownerは成果物を確認し、OK / 修正する / あとで のいずれかを選んでください。",
  ].join("\n");
}

const SAFE_REASON_CODES = new Set(["OWNER_SESSION_INVALID", "OWNER_AUTH_CONTEXT_REQUIRED", "OWNER_PROFILE_NOT_ACTIVE", "REQUEST_ORIGIN_NOT_ALLOWED", "OWNER_AUTH_PROVIDER_REQUIRED", "REQUEST_INTEGRITY_REQUIRED", "SERVER_USAGE_STORE_REQUIRED", "USAGE_RESERVATION_FAILED", "USAGE_COMMIT_FAILED", "USAGE_RELEASE_FAILED", "SANDBOX_REQUEST_ALREADY_CLAIMED", "LIVE_SANDBOX_FEATURE_LOCKED", "PROVIDER_CREDENTIAL_REQUIRED", "PROVIDER_EXECUTION_FAILED"]);
function normalizedApiFailure(error) { const reasonCode = SAFE_REASON_CODES.has(error?.reasonCode) ? error.reasonCode : "SERVER_USAGE_STORE_REQUIRED"; return { ok: false, status: "blocked", reasonCode, message: "Sandbox request could not be completed.", productionExecution: false, publishEnabled: false, actualRevenueConnected: false, ledgerAppend: false }; }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = isPlainObject(req.body) ? req.body : {};
  if (body.action === "affiliateExtractAttachment") {
    const verified = await resolveVerifiedOwnerWorkspaceContext(req, body.workspaceId);
    if (!verified.ok) return res.status(403).json(normalizedApiFailure({ reasonCode: verified.reasonCode }));
    const currentProgram = isPlainObject(body.currentProgram) ? body.currentProgram : {};
    if (currentProgram.workspaceId && currentProgram.workspaceId !== body.workspaceId) return res.status(403).json({ ok:false, status:"blocked", reasonCode:"AFFILIATE_WORKSPACE_MISMATCH", cost:"FREE", paidFallbackCalls:0, externalExecution:false });
    const result = await extractAffiliateProgramFromAttachments({ workspaceId:body.workspaceId, files:body.files, currentProgram, explicitOwnerAction:true }, { credential:process.env.GEMINI_API_KEY });
    const statusCode=result.ok?200:result.reasonCode==="GEMINI_QUOTA_EXHAUSTED"?429:result.reasonCode==="PROVIDER_CREDENTIAL_REQUIRED"?503:result.reasonCode?.includes("INVALID")||result.reasonCode?.includes("UNSUPPORTED")||result.reasonCode?.includes("LARGE")?400:502;
    return res.status(statusCode).json(result);
  }
  if (body.action === "assistantRespond") {
    const verified = await resolveVerifiedOwnerWorkspaceContext(req, body.workspaceId);
    if (!verified.ok) return res.status(403).json(normalizedApiFailure({ reasonCode: verified.reasonCode }));
    const client = createSupabaseServerClient();
    if (!client) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_STORE_UNAVAILABLE" });
    const ownerId = verified.context.ownerId;
    const threadId = String(body.threadId || "");
    const threadResult = await client.from("ai_conversation_threads").select("id,workspace_id,owner_user_id,rolling_summary,status").eq("id", threadId).eq("workspace_id", body.workspaceId).eq("owner_user_id", ownerId).eq("status", "ACTIVE").maybeSingle();
    if (threadResult.error || !threadResult.data) return res.status(404).json({ ok: false, reasonCode: "AI_THREAD_NOT_FOUND" });
    const operationalIntent = resolveAssistantOperationalIntent(body.text);
    if (operationalIntent.action === "CLARIFY") {
      const clarification = "投稿の下書きを作成します。テーマ、伝えたい内容、または対象商品を1つだけ教えてください。";
      const requestId = `local-clarify-${String(body.sourceMessageId || Date.now())}`;
      const persisted = await client.rpc("append_ai_assistant_message", { p_owner_user_id: ownerId, p_thread_id: threadId, p_content: clarification, p_provider: "deterministic-local", p_model: "minimum-question-policy-v1", p_provider_request_id: requestId, p_provenance: { source: "KEVIRIO_POLICY", truth_class: "AI_OUTPUT", evidence_status: "NOT_EVIDENCE" }, p_audit_metadata: { feature: body.feature, intent: "CREATE", action: "CLARIFY", paid_ai_jpy: 0, external_execution: "LOCKED" } });
      if (persisted.error) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_RESPONSE_PERSIST_FAILED" });
      return res.status(200).json({ ok: true, text: clarification, provider: "deterministic-local", model: "minimum-question-policy-v1", messageId: persisted.data, operationalAction: { status: "NEEDS_CLARIFICATION", missing: "subject" }, paidFallbackCalls: 0, externalExecution: false });
    }
    const [messageResult, memoryResult, operationalResult, personalResult, affiliateResult] = await Promise.all([
      client.from("ai_conversation_messages").select("sequence,role,content_text,truth_class").eq("thread_id", threadId).eq("owner_user_id", ownerId).order("sequence", { ascending: false }).limit(12),
      client.from("ai_memory_records").select("memory_kind,content_text,confidence,updated_at").eq("workspace_id", body.workspaceId).eq("owner_user_id", ownerId).eq("status", "ACTIVE").order("updated_at", { ascending: false }).limit(8),
      client.from("operational_objects").select("id,object_type,title,state,attention_state,due_at").eq("workspace_id",body.workspaceId).eq("owner_user_id",ownerId).neq("lifecycle_status","ARCHIVED").order("updated_at",{ascending:false}).limit(40),
      client.from("personal_operational_records").select("id,record_type,title,lifecycle_status").eq("workspace_id",body.workspaceId).eq("owner_user_id",ownerId).neq("lifecycle_status","DELETED").order("updated_at",{ascending:false}).limit(40),
      client.from("affiliate_program_master").select("id,program_name,program_status,next_action,next_action_due_at,reward_summary,epc,approval_rate,revisit_window_days,confirmation_days,conversion_conditions,rejection_conditions,listing_policy,listing_ng_words_verification_status,source_verified_at").eq("workspace_id",body.workspaceId).match(body.programId?{id:body.programId}:{}).order("updated_at",{ascending:false}).limit(body.programId?1:40),
    ]);
    if (messageResult.error || memoryResult.error) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_CONTEXT_UNAVAILABLE" });
    if(body.programId&&(affiliateResult.error||affiliateResult.data?.length!==1))return res.status(404).json({ok:false,reasonCode:"AFFILIATE_PROGRAM_CONTEXT_NOT_FOUND"});
    const recent = (messageResult.data || []).reverse().map((item) => `${item.role} [${item.truth_class}]: ${String(item.content_text).slice(0, 1200)}`).join("\n");
    const memories = (memoryResult.data || []).map((item) => `${item.memory_kind}: ${String(item.content_text).slice(0, 700)}`).join("\n");
    const liveContext=assembleLiveOperationalContext({query:body.text,feature:body.feature,operational:operationalResult.error?[]:operationalResult.data,personal:personalResult.error?[]:personalResult.data,affiliate:affiliateResult.error?[]:affiliateResult.data,explicitAffiliateProgramId:body.programId||null});
    const boundedContext = liveContext.hasExplicitAffiliateProgram
      ? [`Priority context:\n${liveContext.text}`,"Conversation context: intentionally excluded because an explicit canonical Affiliate Program reference is active."].join("\n\n")
      : [`Live operational context:\n${liveContext.text}`,`Rolling summary:\n${threadResult.data.rolling_summary || "none"}`, `Recent messages:\n${recent || "none"}`, `Active personal memory:\n${memories || "none"}`].join("\n\n").slice(0, 20000);
    const result = await executeGeminiFreeRequest({ ...body, boundedContext, explicitOwnerAction: true }, { credential: process.env.GEMINI_API_KEY });
    if (!result.ok) {
      const statusCode = result.reasonCode === "GEMINI_QUOTA_EXHAUSTED" ? 429 : result.reasonCode === "PROVIDER_CREDENTIAL_REQUIRED" ? 503 : 502;
      return res.status(statusCode).json(result);
    }
    const apiReceivedLength = result.text.length;
    if (apiReceivedLength > 12000) return res.status(502).json({ ok: false, reasonCode: "ASSISTANT_RESPONSE_EXCEEDS_M027_LIMIT", providerRawLength: result.rawLength, apiReceivedLength, paidFallbackCalls: 0, externalExecution: false });
    let operationalAction = null;
    if (operationalIntent.action === "CREATE_CONTENT_DRAFT" && !providerRequiresClarification(result.text)) {
      const userClient = createSupabaseUserServerClient(req);
      if (!userClient) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_ACTION_STORE_UNAVAILABLE" });
      const actionKey = `assistant:content:${String(body.sourceMessageId || "").replace(/[^A-Za-z0-9_-]/g, "")}`;
      const draftResult = await userClient.rpc("save_personal_operational_record_v2", { p_record_id: null, p_record_type: "CONTENT", p_title: operationalIntent.subject, p_payload: { content_type: "SNS_POST", platform: "THREADS", body: result.text, brief: operationalIntent.subject, status: "DRAFT", truth_class: "AI_OUTPUT", evidence_status: "NOT_EVIDENCE", specialist: operationalIntent.specialist, external_execution: "LOCKED", paid_ai_jpy: 0 }, p_lifecycle_status: "DRAFT", p_expected_version: null, p_idempotency_key: actionKey });
      const draft = Array.isArray(draftResult.data) ? draftResult.data[0] : draftResult.data;
      if (draftResult.error || !draft?.object_id) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_CANONICAL_CREATE_FAILED" });
      const specialistResult = await userClient.rpc("prepare_internal_action", { p_employee_id: operationalIntent.specialist, p_target_type: "CONTENT", p_target_id: draft.object_id, p_action_type: "CONTENT_DRAFT_PREPARED", p_autonomy_level: "L2_PREPARE", p_risk_class: "LOW", p_policy_approval: "AUTO_LOW_RISK", p_payload: { idempotency_key: `${actionKey}:specialist`, source_message_id: body.sourceMessageId, external_execution: "LOCKED", paid_ai_jpy: 0 } });
      if (specialistResult.error) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_SPECIALIST_PREPARE_FAILED" });
      operationalAction = { status: "CREATED", intent: "CREATE", canonicalType: "CONTENT", objectId: draft.object_id, version: draft.object_version, specialist: operationalIntent.specialist, path: `/content?object=${draft.object_id}` };
    } else if (operationalIntent.action === "CREATE_CONTENT_DRAFT") {
      operationalAction = { status: "NEEDS_CLARIFICATION", intent: "CREATE", missing: "content_facts" };
    }
    const requestId = globalThis.crypto?.randomUUID?.() || `gemini-${Date.now()}`;
    const persisted = await client.rpc("append_ai_assistant_message", { p_owner_user_id: ownerId, p_thread_id: threadId, p_content: result.text, p_provider: "gemini", p_model: result.model, p_provider_request_id: requestId, p_provenance: { source: "GEMINI_FREE", truth_class: "AI_OUTPUT", evidence_status: "NOT_EVIDENCE" }, p_audit_metadata: { feature: body.feature, paid_ai_jpy: 0, external_execution: "LOCKED", provider_raw_length: result.rawLength, api_received_length: apiReceivedLength, finish_reason: result.finishReason, model_output_limited: result.modelOutputLimited, operational_action: operationalAction } });
    if (persisted.error) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_RESPONSE_PERSIST_FAILED" });
    const stored = await client.from("ai_conversation_messages").select("content_text").eq("id", persisted.data).eq("owner_user_id", ownerId).maybeSingle();
    const dbStoredLength = stored.data?.content_text?.length ?? null;
    if (stored.error || dbStoredLength !== apiReceivedLength) return res.status(503).json({ ok: false, reasonCode: "ASSISTANT_RESPONSE_LENGTH_MISMATCH" });
    const currentThread = await client.from("ai_conversation_threads").select("version,next_message_sequence").eq("id", threadId).eq("owner_user_id", ownerId).maybeSingle();
    const summaryMessages = [...(messageResult.data || []).reverse(), { role: "ASSISTANT", truth_class: "AI_OUTPUT", content_text: result.text }].slice(-8);
    const summary = ["Subject: current Owner conversation", "Constraints: Paid AI ¥0; External Execution LOCKED; AI output is not Evidence.", ...summaryMessages.map((item) => `${item.role === "USER" ? "USER_STATED" : "AI_PROPOSAL"}: ${String(item.content_text).replace(/\s+/g, " ").slice(0, 700)}`)].join("\n").slice(0, 12000);
    if (currentThread.data && !currentThread.error) await client.rpc("update_ai_thread_summary", { p_owner_user_id: ownerId, p_thread_id: threadId, p_expected_version: currentThread.data.version, p_summary: summary, p_through_sequence: currentThread.data.next_message_sequence - 1 });
    const sourceMessageId = String(body.sourceMessageId || "");
    const explicitMemory = /(?:覚えて|今後は|方針|必ず|しないで|好み|優先する)/.test(String(body.text || ""));
    if (explicitMemory && /^[0-9a-f-]{36}$/i.test(sourceMessageId)) {
      const source = await client.from("ai_conversation_messages").select("id").eq("id", sourceMessageId).eq("thread_id", threadId).eq("owner_user_id", ownerId).eq("role", "USER").maybeSingle();
      if (source.data && !source.error) {
        const memoryKind = /好み/.test(body.text) ? "OWNER_PREFERENCE" : /今後は|方針|必ず|しないで|優先する/.test(body.text) ? "OWNER_DECISION" : "OWNER_FACT";
        const normalizedKey = `owner-stated:${String(body.text).trim().toLowerCase().replace(/\s+/g, " ").slice(0, 260)}`;
        const existing = await client.from("ai_memory_records").select("id,content_text").eq("owner_user_id", ownerId).eq("normalized_key", normalizedKey).eq("status", "ACTIVE").maybeSingle();
        if (!existing.data && !existing.error) await client.rpc("upsert_ai_memory", { p_owner_user_id: ownerId, p_source_thread_id: threadId, p_source_message_id: sourceMessageId, p_memory_kind: memoryKind, p_content: String(body.text).trim().slice(0, 8000), p_normalized_key: normalizedKey, p_provenance: { source: "OWNER_INPUT", source_message_id: sourceMessageId, extraction: "EXPLICIT_ONLY" }, p_confidence: 1, p_supersedes_id: null });
      }
    }
    return res.status(200).json({ ...result, messageId: persisted.data, providerRawLength: result.rawLength, apiReceivedLength, dbStoredLength, operationalAction, contextPolicy: "BOUNDED_PERSONAL_LIVE_OPERATIONAL", contextItemCount:liveContext.itemCount, rollingSummary: "UPDATED_OR_DEFERRED", memoryPolicy: "EXPLICIT_OWNER_INPUT_ONLY" });
  }
  if (body.action === "geminiDailyGenerate") {
    const verified = await resolveVerifiedOwnerWorkspaceContext(req, body.workspaceId);
    if (!verified.ok) return res.status(403).json(normalizedApiFailure({ reasonCode: verified.reasonCode }));
    const result = await executeGeminiFreeRequest({ ...body, explicitOwnerAction: true }, { credential: process.env.GEMINI_API_KEY });
    const statusCode = result.ok ? 200 : result.reasonCode === "GEMINI_QUOTA_EXHAUSTED" ? 429 : result.reasonCode === "PROVIDER_CREDENTIAL_REQUIRED" ? 503 : result.httpStatus && result.httpStatus >= 400 ? 502 : 403;
    return res.status(statusCode).json(result);
  }
  if (body.action === "sandboxGenerateRevenueLanes") {
    try {
      const verified = await resolveVerifiedOwnerContext(req);
      if (!verified.ok) return res.status(403).json(normalizedApiFailure({ reasonCode: verified.reasonCode }));
      const usageStore = createVerifiedSupabaseUsageStoreAdapter(createSupabaseServerClient(), verified.context);
      const result = await executeOpenAIProviderGateway(body, { featureEnabled: process.env.KEVIRIO_OPENAI_SANDBOX_ENABLED === "true", usageStore, credential: process.env.OPENAI_API_KEY, ownerContext: verified.context });
      const statusCode = result.ok ? 200 : result.reasonCode === "PROVIDER_CREDENTIAL_REQUIRED" ? 503 : result.status === "blocked" ? 403 : 502;
      return res.status(statusCode).json(result);
    } catch (error) {
      return res.status(503).json(normalizedApiFailure(error));
    }
  }
  if (body.action != null) {
    return res.status(400).json({ ok: false, status: "blocked", reasonCode: "UNKNOWN_ACTION", message: "未対応の操作です。" });
  }
  const { message, context = {} } = body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required." });
  }

  if (isBlockedExecutionRequest(body)) {
    return res.status(403).json({
      error: "Mock-only route blocked the request.",
      mockOnly: true,
      externalExecution: false,
      productionExecution: false,
      approvalConfirmed: false,
    });
  }

  return res.status(200).json({
    text: buildMockReply(message, context),
    provider: "local-mock",
    mockOnly: true,
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
  });
}
import { executeOpenAIProviderGateway } from "../server/openAIProviderGateway.js";
import { resolveVerifiedOwnerContext, resolveVerifiedOwnerWorkspaceContext } from "../server/verifiedOwnerContext.js";
import { createSupabaseServerClient, createSupabaseUserServerClient } from "../server/supabaseServerClient.js";
import { createVerifiedSupabaseUsageStoreAdapter } from "../server/supabaseUsageStoreAdapter.js";
import { executeGeminiFreeRequest } from "../server/geminiFreeGateway.js";
import { assembleLiveOperationalContext } from "../server/assistantContextBroker.js";
import { providerRequiresClarification, resolveAssistantOperationalIntent } from "../server/assistantOperationalIntent.js";
import { extractAffiliateProgramFromAttachments } from "../server/affiliateAttachmentExtraction.js";
