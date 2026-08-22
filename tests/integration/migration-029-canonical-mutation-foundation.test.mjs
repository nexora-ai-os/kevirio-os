import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql=fs.readFileSync("docs/database/m029/029_canonical_mutation_foundation.sql","utf8");
const rollback=fs.readFileSync("docs/database/m029/029_rollback.sql","utf8");

test("M029 is one additive transaction and preserves M028 native ownership",()=>{
  assert.match(sql,/^(?:--[^\n]*\n)*begin;/);
  assert.match(sql,/commit;\s*$/);
  assert.doesNotMatch(sql,/alter table public\.operational_objects.*object_type/is);
  assert.doesNotMatch(sql,/drop table public\.(campaigns|tasks|clients|opportunities|operational_objects)/i);
});

test("M029 supplies concurrency drafts timeline links and private reads",()=>{
  for(const token of ["p_expected_version","m029_stale_or_not_found","canonical_domain_drafts","p_expected_draft_version","m029_draft_stale_or_not_found","operational_activity_events","link_canonical_domain_objects"] )assert.match(sql,new RegExp(token));
  for(const policy of ["clients_private_read","opportunities_private_read","owner_decisions_private_read","campaigns_private_read","tasks_private_read","content_assets_private_read","business_memory_private_read"])assert.match(sql,new RegExp(`create policy ${policy}`));
  assert.match(sql,/force row level security/);
  assert.match(sql,/revoke all privileges on table public\.clients/);
  assert.match(sql,/convert_canonical_domain_object/);
});

test("M029 includes production namespace, accepted-data recovery and performance gates",()=>{
  for(const file of ["029_namespace_compatibility_audit.sql","029_freeze_accepted_data.sql","029_reimport_accepted_data.sql","029_performance_validation.sql"]) assert.equal(fs.existsSync(`docs/database/m029/${file}`),true);
  const namespace=fs.readFileSync("docs/database/m029/029_namespace_compatibility_audit.sql","utf8");
  assert.match(namespace,/M029_NAMESPACE_COMPATIBILITY_PASS/);
  for(const file of ["029_recovery_00_create_accepted_fixture.sql","029_recovery_b_export_verification.sql","029_recovery_d_m028_baseline_verification.sql","029_recovery_g_reimport_verification.sql","029_recovery_h_continuation_verification.sql"]) assert.equal(fs.existsSync(`docs/database/m029/${file}`),true);
  assert.match(rollback,/drop index if exists public\.clients_owner_updated_idx/);
});

test("M029 keeps cost execution and revenue truth fail closed",()=>{
  assert.match(sql,/external_execution_allowed=false/);
  assert.match(sql,/paid_ai_jpy',0/);
  assert.match(sql,/m029_truth_or_execution_denied/);
  assert.match(sql,/m029_revenue_truth_denied/);
  assert.doesNotMatch(sql,/insert into public\.(revenue_records|evidence_candidates)/i);
});

test("M029 uses restricted namespace and has bounded rollback",()=>{
  assert.doesNotMatch(sql,/(?<!extensions\.)\bgen_random_uuid\s*\(/);
  // Eight M029 functions plus the hardened M028 canonical resolver override.
  assert.equal((sql.match(/security definer set search_path=''/gi)||[]).length,9);
  assert.match(rollback,/drop table public\.canonical_domain_drafts/);
  assert.doesNotMatch(rollback,/delete from public\.(revenue_records|evidence_candidates|affiliate_program_master)/i);
});
