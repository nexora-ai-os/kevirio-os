import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../../supabase/migrations/025_affiliate_personal_workspace_read.sql",import.meta.url),"utf8").toLowerCase();

test("M025 is additive, transactional, and uses the canonical Personal Workspace owner boundary",()=>{
  assert.match(sql,/^begin;/);assert.match(sql,/commit;\s*$/);
  for(const token of ["is_canonical_personal_workspace_owner","account_personal_workspaces","apw.user_id=auth.uid()","wm.role='owner'","wm.status='active'","uas.lifecycle_state='active'"])assert.match(sql,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.doesNotMatch(sql,/disable row level security|service_role.*register_affiliate_program_master/);
});

test("M025 grants read only and retains protected Affiliate registration",()=>{
  const registrationSignature=sql.match(/create function public\.register_affiliate_program_master\(([\s\S]*?)\) returns uuid/);
  assert.ok(registrationSignature,"registration RPC signature must exist");
  assert.match(sql,/grant select on table public\.affiliate_programs[\s\S]*public\.operating_cost_records to authenticated/);
  assert.match(sql,/revoke insert,update,delete on table[\s\S]*from authenticated/);
  assert.match(sql,/create function public\.register_affiliate_program_master/);
  assert.match(sql,/select apw\.workspace_id into v_workspace[\s\S]*where apw\.user_id=v_actor/);
  assert.match(sql,/not public\.is_canonical_personal_workspace_owner\(v_workspace\)/);
  assert.match(sql,/external_execution_allowed,created_by[\s\S]*false,v_actor/);
  assert.match(sql,/affiliate_program_master_registered/);
  assert.doesNotMatch(registrationSignature[1],/p_workspace_id/);
});

test("M025 policies cover Owner reads while Member, anonymous, and cross-workspace remain denied",()=>{
  for(const table of ["affiliate_programs","affiliate_publications","affiliate_performance_records","affiliate_program_master","revenue_records","operating_cost_records"])assert.match(sql,new RegExp(table));
  assert.match(sql,/auth.role\(\)='authenticated'/);
  assert.match(sql,/apw.workspace_id=p_workspace_id/);
  assert.match(sql,/revoke all on function public\.is_canonical_personal_workspace_owner\(uuid\) from public,anon/);
  assert.match(sql,/revoke all on function public\.register_affiliate_program_master[\s\S]*from public,anon/);
});
