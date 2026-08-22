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

test("M029 pre-apply recovery stores restorable rows and exact security state",()=>{
  const preflight=fs.readFileSync("docs/database/m029/029_preflight_and_scoped_snapshot.sql","utf8");
  const verify=fs.readFileSync("docs/database/m029/029_pre_apply_recovery_verification.sql","utf8");
  const restore=fs.readFileSync("docs/database/m029/029_restore_pre_apply_business_state.sql","utf8");
  const post=fs.readFileSync("docs/database/m029/029_post_restore_verification.sql","utf8");
  for(const table of ["clients","opportunities","owner_decisions","campaigns","tasks","content_assets","business_memory_records","personal_operational_records"]) assert.match(preflight,new RegExp(table));
  assert.match(preflight,/create schema _m029_recovery authorization postgres/);
  assert.match(preflight,/revoke all on schema _m029_recovery from public,anon,authenticated,service_role/);
  assert.match(preflight,/business_rows/);
  for(const kind of ["TABLE_SECURITY","POLICY","GRANT","FUNCTION","INDEX"]) assert.match(preflight,new RegExp(kind));
  assert.match(verify,/M029_PRE_APPLY_RECOVERY_VERIFICATION_PASS/);
  assert.match(restore,/jsonb_populate_record/);
  assert.match(restore,/disable trigger user/);
  assert.match(restore,/grant %s on %I\.%I to %I/);
  assert.match(post,/M029_PRE_APPLY_RESTORE_VERIFICATION_PASS/);
  assert.doesNotMatch(preflight,/(?<!extensions\.)\b(?:digest|gen_random_uuid)\s*\(/);
});

test("M029 recovery artifacts deny browser and service access with FORCE RLS",()=>{
  const fixture=fs.readFileSync("docs/database/m029/029_recovery_00_create_accepted_fixture.sql","utf8");
  const freeze=fs.readFileSync("docs/database/m029/029_freeze_accepted_data.sql","utf8");
  for(const source of [fixture,freeze]){
    assert.match(source,/enable row level security/);
    assert.match(source,/force row level security/);
    assert.match(source,/revoke all .* from public,anon,authenticated,service_role/);
  }
});
