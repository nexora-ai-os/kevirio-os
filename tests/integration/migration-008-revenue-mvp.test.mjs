import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/008_revenue_mvp_completion.sql",import.meta.url),"utf8").toLowerCase();
test("migration 008 is additive and protected",()=>{assert.ok(sql.trim().startsWith("begin;"));assert.ok(sql.trim().endsWith("commit;"));assert.doesNotMatch(sql,/drop table|disable row level security|service_role/);assert.match(sql,/from public, anon/);});
test("existing package is upgraded without duplicate insertion",()=>{assert.match(sql,/update public\.execution_packages/);assert.match(sql,/build_sales_ready_package_payload/);assert.doesNotMatch(sql,/insert into public\.execution_packages/);assert.match(sql,/'campaigntitle'/);assert.match(sql,/'externalexecutionallowed',false/);});
test("evidence registration rejects duplicates and creates immutable approval snapshot",()=>{assert.match(sql,/duplicate_evidence_reference/);assert.match(sql,/'evidencecandidateid',v_evidence,'campaignid',p_campaign_id,'amountminor',p_amount_minor,'costamountminor',p_cost_amount_minor,'currency',p_currency/);assert.match(sql,/manual_package_required/);assert.match(sql,/actual_revenue_approval/);});
test("evidence reference is unique across source types",()=>assert.match(sql,/unique index if not exists evidence_candidates_workspace_reference_idx on public\.evidence_candidates\(workspace_id,source_reference\)/));
test("actual recording is evidence and snapshot gated",()=>{assert.match(sql,/v_d\.decision_snapshot<>v_a\.preview_snapshot/);assert.match(sql,/actual_revenue_snapshot_mismatch/);assert.match(sql,/duplicate_revenue_record/);assert.match(sql,/v_e\.amount_minor-v_e\.cost_amount_minor/);assert.match(sql,/revenue_recorded/);});
test("legacy unsafe command signatures lose authenticated execute",()=>{assert.match(sql,/revoke all on function public\.register_revenue_evidence\(uuid,uuid,text,text,bigint,bigint,text,timestamptz\) from authenticated/);assert.match(sql,/revoke all on function public\.verify_evidence_and_record_revenue\(uuid,uuid,uuid,text\) from authenticated/);});

test("admin backfills validate workspace edges before narrowly disabling triggers",()=>{
  const campaignValidation=sql.indexOf("migration_008_campaign_workspace_mismatch");
  const campaignDisable=sql.indexOf("disable trigger campaigns_workspace_integrity");
  const campaignUpdate=sql.indexOf("update public.campaigns c set offer");
  const campaignEnable=sql.indexOf("enable trigger campaigns_workspace_integrity");
  assert.ok(campaignValidation<campaignDisable&&campaignDisable<campaignUpdate&&campaignUpdate<campaignEnable);
  const packageValidation=sql.indexOf("migration_008_package_workspace_mismatch");
  const packageDisable=sql.indexOf("disable trigger execution_packages_workspace_integrity");
  const packageUpdate=sql.indexOf("update public.execution_packages ep set payload_snapshot");
  const packageEnable=sql.indexOf("enable trigger execution_packages_workspace_integrity");
  assert.ok(packageValidation<packageDisable&&packageDisable<packageUpdate&&packageUpdate<packageEnable);
  assert.match(sql,/left join public\.brand_profiles b[\s\S]+b\.workspace_id=c\.workspace_id/);
  assert.match(sql,/ar\.workspace_id=ep\.workspace_id and ar\.campaign_id=ep\.campaign_id/);
});

test("empty database path is valid and trigger state rolls back transactionally",()=>{
  assert.match(sql,/if exists\([\s\S]+migration_008_campaign_workspace_mismatch/);
  assert.match(sql,/if exists\([\s\S]+migration_008_package_workspace_mismatch/);
  assert.equal((sql.match(/disable trigger/g)||[]).length,2);
  assert.equal((sql.match(/enable trigger/g)||[]).length,2);
  assert.ok(sql.indexOf("begin;")<sql.indexOf("disable trigger"));
  assert.ok(sql.lastIndexOf("enable trigger")<sql.lastIndexOf("commit;"));
});

test("runtime authenticated package upgrade keeps integrity trigger enabled",()=>{
  const runtimeStart=sql.indexOf("create or replace function public.retrieve_manual_execution_packages");
  const runtimeEnd=sql.indexOf("revoke all on function public.retrieve_manual_execution_packages",runtimeStart);
  const runtime=sql.slice(runtimeStart,runtimeEnd);
  assert.match(runtime,/is_active_workspace_member/);
  assert.doesNotMatch(runtime,/disable trigger|enable trigger/);
});
