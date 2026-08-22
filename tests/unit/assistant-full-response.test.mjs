import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { executeGeminiFreeRequest } from "../../server/geminiFreeGateway.js";

const request = { text: "全文検証", workspaceId: "workspace", feature: "assistant", explicitOwnerAction: true };
const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

for (const length of [1000, 5000, 11000]) test(`Gemini ${length} character response remains byte-for-byte complete`, async () => {
  const output = `${"段落と箇条書きの全文。".repeat(Math.ceil(length / 11))}`.slice(0, length);
  const result = await executeGeminiFreeRequest(request, { credential: "fixture", transport: async () => ({ ok: true, status: 200, async json() { return { candidates: [{ finishReason: "STOP", content: { parts: [{ text: output }] } }] }; } }) });
  assert.equal(result.ok, true);
  assert.equal(result.rawLength, length);
  assert.equal(result.text.length, length);
  assert.equal(result.text, output);
  assert.equal(result.modelOutputLimited, false);
});

test("MAX_TOKENS is distinguished from UI truncation", async () => {
  const result = await executeGeminiFreeRequest(request, { credential: "fixture", transport: async () => ({ ok: true, status: 200, async json() { return { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "途中までの全文" }] } }] }; } }) });
  assert.equal(result.finishReason, "MAX_TOKENS");
  assert.equal(result.modelOutputLimited, true);
});

test("API, repository, UI and CSS preserve canonical message bodies", async () => {
  const [api, repository, component, markdown, css, migration] = await Promise.all([read("api/ai.js"), read("src/repositories/assistantConversationRepository.js"), read("src/components/next/NextDurableAssistant.jsx"), read("src/components/next/AssistantMarkdown.jsx"), read("src/components/next/assistant-full-content.css"), read("docs/database/m027/027_practical_intelligence_2.sql")]);
  assert.match(migration, /content_text text not null check\(length\(btrim\(content_text\)\) between 1 and 12000\)/);
  assert.match(api, /dbStoredLength !== apiReceivedLength/);
  assert.match(api, /provider_raw_length/);
  assert.match(repository, /audit_metadata/);
  assert.match(component, /data-content-length/);
  assert.match(component, /全文をコピー/);
  assert.match(markdown, /assistant-2__markdown/);
  assert.match(css, /max-height:none/);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.doesNotMatch(css, /line-clamp|text-overflow|overflow:hidden/);
});
