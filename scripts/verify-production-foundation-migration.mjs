import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../supabase/migrations/003_revenue_production_foundation.sql",import.meta.url),"utf8").toLowerCase();
const bootstrapAccessSql=readFileSync(new URL("../supabase/migrations/004_owner_workspace_bootstrap_access.sql",import.meta.url),"utf8").toLowerCase();
const repositorySql=readFileSync(new URL("../supabase/migrations/005_revenue_repository_integration.sql",import.meta.url),"utf8").toLowerCase();
const triggerFixSql=readFileSync(new URL("../supabase/migrations/006_revenue_integrity_trigger_fix.sql",import.meta.url),"utf8").toLowerCase();
const tables=["workspaces","workspace_members","brand_profiles","clients","opportunities","owner_decisions","campaigns","tasks","artifacts","approval_requests","approval_decisions","execution_packages","evidence_candidates","revenue_records","workflow_runs","workflow_steps","business_memory_records","audit_logs"];
for(const table of tables){
  assert.ok(sql.includes(`create table if not exists public.${table}`),`missing ${table}`);
  assert.ok(sql.includes(`alter table public.${table} enable row level security`),`rls missing ${table}`);
}
assert.ok(sql.startsWith("begin;")&&sql.trim().endsWith("commit;"));
assert.ok(sql.includes("security definer set search_path = ''"));
assert.ok(sql.includes("net_amount_minor = gross_amount_minor - cost_amount_minor"));
assert.ok(sql.includes("unique(workspace_id,source_type,source_reference)"));
assert.ok(sql.includes("create or replace function public.decide_approval"));
assert.ok(sql.includes("create or replace function public.verify_evidence_and_record_revenue"));
assert.ok((sql.match(/workspace_integrity/g)||[]).length>=20);
assert.ok(!/grant\s+.+\s+to\s+(?:public|anon)/.test(sql));
assert.ok(!/\bdrop\s+table\b/.test(sql));
assert.ok(bootstrapAccessSql.includes("grant select on table public.owner_profiles to authenticated"));
assert.ok(bootstrapAccessSql.includes("grant select on table public.workspaces to authenticated"));
assert.ok(bootstrapAccessSql.includes("grant select on table public.workspace_members to authenticated"));
assert.ok(bootstrapAccessSql.includes("grant select on table public.brand_profiles to authenticated"));
assert.ok(bootstrapAccessSql.includes("grant execute on function public.bootstrap_owner_workspace(text,text) to authenticated"));
assert.ok(!/\b(?:drop|delete|truncate)\b/.test(bootstrapAccessSql));
assert.ok(repositorySql.includes("create or replace function public.create_revenue_candidate"));
assert.ok(triggerFixSql.includes("v_new jsonb := to_jsonb(new)"));
assert.ok(!/\bnew\.(?:workspace_id|brand_id|client_id|opportunity_id|campaign_id|task_id|artifact_id|approval_request_id|evidence_candidate_id|workflow_run_id)\b/.test(triggerFixSql));
assert.ok(triggerFixSql.includes("grant select on table"));
assert.ok(!/grant\s+(?:insert|update|delete|all)[\s\S]+to authenticated/.test(triggerFixSql));
console.log(`Production foundation migration: ${tables.length}/${tables.length} tables verified`);
