import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration003 = readFileSync(new URL("../../supabase/migrations/003_revenue_production_foundation.sql", import.meta.url), "utf8");
const sql = readFileSync(new URL("../../supabase/migrations/007_manual_execution_package.sql", import.meta.url), "utf8").toLowerCase();

test("approval generates a durable manual package and advances the workflow", () => {
  assert.match(sql, /create or replace function public\.decide_approval[\s\S]+generate_manual_execution_package/);
  assert.match(sql, /insert into public\.execution_packages/);
  assert.match(sql, /owner_artifact_approval[\s\S]+manual_package_ready[\s\S]+evidence_waiting/);
  assert.match(sql, /manual_package\.generated/);
});

test("duplicate packages are prevented from the same approval", () => {
  assert.match(migration003, /unique\(workspace_id,idempotency_key\)/i);
  assert.match(sql, /'manual-package:'\|\|v_request\.id::text/);
  assert.match(sql, /on conflict\(workspace_id,idempotency_key\) do nothing/);
});

test("wrong workspace, incomplete approval and snapshot mismatch fail closed", () => {
  assert.match(sql, /manual_package_workspace_denied/);
  assert.match(sql, /manual_package_workspace_mismatch/);
  assert.match(sql, /manual_package_approval_required/);
  assert.match(sql, /approval_snapshot_mismatch/);
  assert.match(sql, /manual_package_snapshot_mismatch/);
  assert.match(sql, /v_decision\.decision_snapshot <> v_request\.preview_snapshot/);
});

test("external execution stays false and actual remains evidence-gated", () => {
  assert.match(sql, /'externalexecutionallowed',false/);
  assert.match(sql, /external_execution_allowed,idempotency_key[\s\S]+false,v_key/);
  assert.doesNotMatch(sql, /\b(?:http|net|oauth|send|publish|charge|billing)\s*\(/);
  assert.match(sql, /current_step='evidence_waiting'/);
  assert.doesNotMatch(sql, /insert into public\.revenue_records/);
});

test("retrieval, viewing, copy and download are audited", () => {
  assert.match(sql, /manual_package\.retrieved/);
  assert.match(sql, /p_action not in \('viewed','copied','downloaded'\)/);
  assert.match(sql, /'manual_package\.'\|\|p_action/);
});

test("migration 007 is additive and keeps authenticated-only RPC access", () => {
  assert.ok(sql.trim().startsWith("begin;"));
  assert.ok(sql.trim().endsWith("commit;"));
  for (const name of ["generate_manual_execution_package", "retrieve_manual_execution_packages", "record_manual_package_access"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${name}[\\s\\S]+from public, anon`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${name}[\\s\\S]+to authenticated`));
  }
  assert.doesNotMatch(sql, /service_role/);
});
