import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("AI Secretary content slice uses authenticated M029 RPCs and preserves locks", async () => {
  const api = await fs.readFile("api/ai.js", "utf8");
  const intent = await fs.readFile("server/assistantOperationalIntent.js", "utf8");
  for (const value of ["resolveVerifiedOwnerWorkspaceContext", "createSupabaseUserServerClient", "save_personal_operational_record_v2", "prepare_internal_action", "L2_PREPARE", "external_execution: \"LOCKED\"", "paid_ai_jpy: 0"]) assert.ok(api.includes(value), value);
  assert.ok(intent.includes("content_strategy"));
  assert.doesNotMatch(api, /L3_EXECUTE|L4_AUTONOMOUS/);
});
