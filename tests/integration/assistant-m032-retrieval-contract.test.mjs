import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const api = await readFile(new URL("../../api/ai.js", import.meta.url), "utf8");
const loader = await readFile(new URL("../../server/affiliateCycleAssistantContext.js", import.meta.url), "utf8");

test("AI Secretary M032 retrieval is exact, owner/workspace bounded, and migration-free", () => {
  for (const table of ["affiliate_program_master", "research_findings", "affiliate_strategies", "personal_operational_records", "affiliate_cycle_publications", "affiliate_cycle_performance", "affiliate_revenue_candidates", "affiliate_revenue_evidence", "affiliate_actual_revenue_extensions"]) assert.match(loader, new RegExp(table));
  assert.match(loader, /\.eq\("workspace_id", workspaceId\)/);
  assert.match(loader, /\.eq\("owner_user_id", ownerId\)/);
  assert.match(loader, /\.eq\("data_owner_id", ownerId\)/);
  assert.match(loader, /\.eq\("created_by", ownerId\)/);
  assert.match(api, /Conversation context: intentionally excluded/);
  assert.match(api, /CANONICAL_AFFILIATE_CYCLE/);
  assert.match(api, /paid_ai_jpy: 0/);
  assert.doesNotMatch(loader, /insert\(|update\(|delete\(/);
});
