import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/005_revenue_repository_integration.sql", import.meta.url), "utf8").toLowerCase();

test("migration 005 exposes only authenticated revenue commands", () => {
  assert.match(sql, /security definer set search_path = ''/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /is_active_workspace_member/);
  assert.match(sql, /revoke all on function public\.create_revenue_candidate[\s\S]+from public, anon/);
  assert.match(sql, /grant execute on function public\.create_revenue_candidate[\s\S]+to authenticated/);
});

test("migration 005 preserves approval, actual and external-execution boundaries", () => {
  assert.match(sql, /external_execution_allowed[\s\S]+false/);
  assert.match(sql, /actual_revenue_verification/);
  assert.match(sql, /verification_required/);
  assert.match(sql, /actual_revenue_snapshot_mismatch/);
  assert.match(sql, /evidencecandidateid/);
  assert.match(sql, /revenue_records_approval_snapshot/);
  assert.doesNotMatch(sql, /service_role/);
});
