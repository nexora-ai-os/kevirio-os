import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration003 = readFileSync(new URL("../../supabase/migrations/003_revenue_production_foundation.sql", import.meta.url), "utf8");
const migration005 = readFileSync(new URL("../../supabase/migrations/005_revenue_repository_integration.sql", import.meta.url), "utf8");
const sql = readFileSync(new URL("../../supabase/migrations/006_revenue_integrity_trigger_fix.sql", import.meta.url), "utf8").toLowerCase();

const tables = [
  "opportunities", "owner_decisions", "campaigns", "tasks", "artifacts",
  "approval_requests", "approval_decisions", "execution_packages",
  "evidence_candidates", "revenue_records", "workflow_runs", "workflow_steps",
];

function columnsFor(table) {
  const match = migration003.match(new RegExp(`create table if not exists public\\.${table} \\(([\\s\\S]*?)\\n\\);`, "i"));
  assert.ok(match, `schema missing for ${table}`);
  return match[1].split("\n").map((line) => line.trim().match(/^([a-z_][a-z0-9_]*)\s/i)?.[1]).filter(Boolean);
}

test("reported root cause is reproducible from migration 003 schema", () => {
  assert.equal(columnsFor("opportunities").includes("opportunity_id"), false);
  assert.equal(columnsFor("tasks").includes("opportunity_id"), false);
  assert.match(migration003, /new\.opportunity_id/i);
  assert.match(migration003, /opportunities_workspace_integrity/i);
});

test("migration 006 never dereferences a table-specific NEW field", () => {
  assert.doesNotMatch(sql, /\bnew\.(?:workspace_id|brand_id|client_id|opportunity_id|campaign_id|task_id|artifact_id|approval_request_id|evidence_candidate_id|workflow_run_id)\b/);
  assert.match(sql, /v_new jsonb := to_jsonb\(new\)/);
  assert.match(sql, /tg_table_name='owner_decisions'/);
  assert.match(sql, /tg_table_name='campaigns'/);
});

test("all original integrity triggers are replaced without removing coverage", () => {
  const attached = tables.filter((table) => migration003.includes(`create trigger ${table}_workspace_integrity`));
  assert.equal(attached.length, 11);
  for (const table of attached) {
    assert.match(sql, new RegExp(`drop trigger if exists ${table}_workspace_integrity on public\\.${table}`));
    assert.match(sql, new RegExp(`create trigger ${table}_workspace_integrity`));
  }
});

test("authenticated receives SELECT only on the twelve production tables", () => {
  for (const table of tables) assert.match(sql, new RegExp(`public\\.${table}`));
  assert.match(sql, /revoke all privileges on table[\s\S]+from authenticated/);
  assert.match(sql, /grant select on table[\s\S]+to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete|all)[\s\S]+to authenticated/);
  assert.match(sql, /from public, anon/);
});

test("protected RPC grants remain authenticated-only", () => {
  for (const rpc of ["create_revenue_candidate", "register_revenue_evidence", "decide_approval", "verify_evidence_and_record_revenue"]) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${rpc}[\\s\\S]+from public, anon`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${rpc}[\\s\\S]+to authenticated`));
  }
});

test("candidate transaction still creates the complete paused workflow atomically", () => {
  assert.ok(migration005.trim().toLowerCase().startsWith("begin;"));
  assert.ok(migration005.trim().toLowerCase().endsWith("commit;"));
  for (const table of ["opportunities", "owner_decisions", "campaigns", "tasks", "artifacts", "approval_requests", "workflow_runs", "workflow_steps"]) {
    assert.match(migration005, new RegExp(`insert into public\\.${table}`, "i"));
  }
  assert.match(migration005, /on conflict\(workspace_id,idempotency_key\)/i);
  assert.match(migration005, /external_execution_allowed[\s\S]+false/i);
});
