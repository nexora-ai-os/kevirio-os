import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const paths = {
  migration: new URL("../supabase/migrations/014_affiliate_intelligence.sql", import.meta.url),
  precheck: new URL("../supabase/validation/014_pre_apply_checks.sql", import.meta.url),
  postsmoke: new URL("../supabase/validation/014_post_apply_smoke.sql", import.meta.url),
  activation: new URL("../docs/validation/MIGRATION_014_OWNER_ACTIVATION_PACKAGE.md", import.meta.url),
};
const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")]));
const lower = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, value.toLowerCase()]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();
const expectedMigrationSha = "47B84532D42C327B7A59424062E7E71FB00C1338CA94F2555FFC02CB49B99F10";

assert.equal(sha256(files.migration), expectedMigrationSha, "saved Migration 014 SHA freeze mismatch");
assert.match(files.precheck, new RegExp(expectedMigrationSha), "Pre-check expected SHA is not synchronized");
assert.match(files.activation, new RegExp(expectedMigrationSha), "Activation Package expected SHA is not synchronized");

assert.match(lower.migration, /^begin;/);
assert.match(lower.migration, /commit;\s*$/);
for (const table of ["affiliate_programs","affiliate_materials","affiliate_publications","affiliate_performance_records"]) {
  assert.match(lower.migration, new RegExp(`create table public\\.${table}`));
  assert.match(lower.migration, new RegExp(`'${table}'`));
}
for (const index of ["affiliate_programs_workspace_status_idx","affiliate_materials_workspace_program_status_idx","affiliate_publications_workspace_program_status_idx","affiliate_performance_workspace_program_period_idx"])
  assert.match(lower.migration, new RegExp(`create index ${index}`));
for (const boundary of ["security definer set search_path=''","wm.role='owner'","op.role='owner'","ai_metadata_is_safe(p_input,0)","affiliate_program_draft_saved","external_execution_allowed=false","revoke all on table public.affiliate_programs","grant select on table public.affiliate_programs"])
  assert.match(lower.migration, new RegExp(boundary.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
assert.match(lower.migration, /foreign key\(offer_id,workspace_id\)/);
assert.match(lower.migration, /foreign key\(affiliate_program_id,workspace_id\)/);
assert.doesNotMatch(lower.migration, /\b(drop table|truncate|delete from|alter table public\.(revenue_records|operating_cost_records).*drop)\b/);
assert.doesNotMatch(lower.migration, /ringconn|a8\.net|acalie/);
assert.doesNotMatch(lower.migration, /password|access_token|session_cookie|raw_provider_payload/);

for (const token of ["begin transaction read only","required_parents","table_absent","function_absent","trigger_absent","policy_absent","index_absent","migration_executor_owns_parent","m014_pre_apply_checks_fail_stop","rollback;"])
  assert.match(lower.precheck, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
for (const token of ["begin transaction read only","expected_columns","expected_constraints","expected_indexes","pass_count","fail_count","warn_count","overall_status","read_only_rollback","external_execution=locked","m014_post_apply_smoke_fail_stop","rollback;"])
  assert.match(lower.postsmoke, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
assert.doesNotMatch(lower.precheck + lower.postsmoke, /^\s*(insert\s+into|update\s+\S+\s+set|delete\s+from|truncate\b|alter\s+table|create\s+table|drop\s+table)/m);

console.log(JSON.stringify({
  result: "M014_STATIC_VALIDATION_PASS",
  migration_sha256: expectedMigrationSha,
  precheck_sha256: sha256(files.precheck),
  postsmoke_sha256: sha256(files.postsmoke),
  validation: "saved UTF-8 artifacts",
}, null, 2));
