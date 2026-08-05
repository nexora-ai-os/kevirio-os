import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const paths = {
  migration: new URL("../supabase/migrations/015_affiliate_intelligence_v2.sql", import.meta.url),
  precheck: new URL("../supabase/validation/015_pre_apply_checks.sql", import.meta.url),
  postsmoke: new URL("../supabase/validation/015_post_apply_smoke.sql", import.meta.url),
  activation: new URL("../docs/validation/MIGRATION_015_OWNER_ACTIVATION_PACKAGE.md", import.meta.url),
};
const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")]));
const lower = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, value.toLowerCase()]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const expectedMigrationSha = "14FF5413ECA910095A47DE6F7032739693FEC980CCF3E754DD864DBFDDAD99F1";
const tables = ["affiliate_products","affiliate_product_sources","affiliate_research_entities","affiliate_experiments","affiliate_intelligence_snapshots","affiliate_risk_findings","affiliate_alerts","affiliate_daily_briefs","reusable_business_assets"];
const indexes = ["affiliate_products_workspace_program_status_idx","affiliate_product_sources_workspace_product_status_idx","affiliate_research_workspace_program_type_idx","affiliate_experiments_workspace_program_status_idx","affiliate_snapshots_workspace_program_type_idx","affiliate_risks_workspace_program_class_idx","affiliate_alerts_workspace_severity_status_idx","affiliate_daily_briefs_workspace_date_idx","reusable_business_assets_workspace_type_idx"];

assert.equal(sha256(files.migration), expectedMigrationSha, "saved Migration 015 SHA freeze mismatch");
assert.match(files.precheck, new RegExp(expectedMigrationSha), "Pre-check SHA mismatch");
assert.match(files.activation, new RegExp(expectedMigrationSha), "Activation Package SHA mismatch");
assert.match(lower.migration, /^begin;/); assert.match(lower.migration, /commit;\s*$/);
for (const table of tables) {
  assert.match(lower.migration, new RegExp(`create table public\\.${table}`));
  assert.match(lower.migration, /alter table public\.%i enable row level security/);
  assert.match(lower.migration, /grant select on table public\.%i to authenticated,service_role/);
}
for (const index of indexes) assert.match(lower.migration, new RegExp(`create index ${index}`));
for (const token of ["security definer set search_path=''","wm.role='owner'","op.role='owner'","ai_metadata_is_safe(p_input,0)","affiliate_intelligence_snapshot_saved","external_execution_allowed=false","foreign key(affiliate_program_id,workspace_id)","affiliate_v2_owner_read","revoke all on function public.save_affiliate_intelligence_snapshot"])
  assert.ok(lower.migration.includes(token), token);
assert.doesNotMatch(lower.migration, /\b(drop table|truncate|delete from|alter table public\.(revenue_records|operating_cost_records|affiliate_offers).*drop)\b/);
assert.doesNotMatch(lower.migration, /insert\s+into\s+public\.(revenue_records|operating_cost_records|affiliate_offers|affiliate_programs)\b/);
assert.doesNotMatch(lower.migration, /ringconn|a8\.net|acalie/);
assert.doesNotMatch(lower.migration, /raw_provider_payload|access_token|refresh_token|session_cookie|client_secret|password\s/);
for (const token of ["begin transaction read only","required_parents","table_absent","function_absent","trigger_absent","policy_absent","index_absent","required_extensions","migration_executor_owns_parent","ringconn_existing_offer_preservation","fail_count","warn_count","overall_status","read_only_rollback","external_execution=locked","rollback;"])
  assert.ok(lower.precheck.includes(token), token);
for (const token of ["begin transaction read only","workspace_id_not_null","exact_indexes","rls_enabled","active_owner_select","direct_browser_mutation_denial","security_definer_search_path","external_execution_lock","actual_forecast_separation","workspace_isolation","no_actual_revenue_cost_duplication","no_seed_no_offer_mutation","fail_count","warn_count","overall_status","read_only_rollback","external_execution=locked","rollback;"])
  assert.ok(lower.postsmoke.includes(token), token);
assert.doesNotMatch(lower.precheck + lower.postsmoke, /^\s*(insert\s+into|update\s+\S+\s+set|delete\s+from|truncate\b|alter\s+table|create\s+table|drop\s+table)/m);

console.log(JSON.stringify({ result:"M015_STATIC_VALIDATION_PASS", parser:"saved-artifact structural parser (not PostgreSQL server parser)", migration_sha256:expectedMigrationSha, precheck_sha256:sha256(files.precheck), postsmoke_sha256:sha256(files.postsmoke), tables:tables.length }, null, 2));
