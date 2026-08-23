import test from "node:test";
import assert from "node:assert/strict";
import { providerRequiresClarification, resolveAssistantOperationalIntent } from "../../server/assistantOperationalIntent.js";

test("ASK and CREATE are not confused", () => {
  assert.equal(resolveAssistantOperationalIntent("投稿の作り方を教えて").intent, "ASK");
  assert.deepEqual(resolveAssistantOperationalIntent("投稿作って"), { intent: "CREATE", action: "CLARIFY", missing: "subject" });
});

test("bounded content create resolves the existing specialist", () => {
  const result = resolveAssistantOperationalIntent("ThreadsでREAL_CYCLE_001の進捗投稿を作って");
  assert.equal(result.action, "CREATE_CONTENT_DRAFT");
  assert.equal(result.specialist, "content_strategy");
  assert.match(result.subject, /REAL_CYCLE_001/);
});

test("provider refusal cannot become a canonical draft", () => {
  assert.equal(providerRequiresClarification("情報が不足しているため、投稿を作成することができません。"), true);
  assert.equal(providerRequiresClarification("以下が完成したThreads投稿です。"), false);
});
