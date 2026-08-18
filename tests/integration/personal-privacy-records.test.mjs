import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../../supabase/migrations/019_personal_privacy_records.sql",import.meta.url),"utf8").toLowerCase();

test("personal privacy migration is additive and fail closed",()=>{
  assert.ok(sql.startsWith("begin;")&&sql.trim().endsWith("commit;"));
  assert.doesNotMatch(sql,/\b(drop table|drop column|truncate)\b/);
  assert.match(sql,/visibility text not null default 'private'/);
  assert.match(sql,/external_execution_allowed boolean not null default false check\(external_execution_allowed=false\)/);
});
test("content opportunity and feedback share one owner privacy contract",()=>{
  for(const kind of ["'content'","'opportunity'","'feedback'"])assert.match(sql,new RegExp(kind));
  assert.match(sql,/data_owner_id uuid not null/);
  assert.match(sql,/constraint personal_record_owner_membership_fk/);
});
test("workspace owner has no implicit private access",()=>{
  const readFunction=sql.slice(sql.indexOf("create function public.can_read_personal_record"),sql.indexOf("create policy personal_records_permission_read"));
  assert.match(readFunction,/r\.data_owner_id=p_user_id/);
  assert.match(readFunction,/explicit_shared/);
  assert.match(readFunction,/team_memberships/);
  assert.doesNotMatch(readFunction,/owner_profiles|role='owner'|role = 'owner'/);
});
test("browser mutation is limited to owner-bound protected RPCs",()=>{
  assert.match(sql,/revoke all on public\.personal_operational_records,public\.personal_record_shares from anon,authenticated/);
  assert.match(sql,/grant select on public\.personal_operational_records,public\.personal_record_shares to authenticated/);
  assert.doesNotMatch(sql,/grant\s+(insert|update|delete|all)[^;]*to authenticated/);
  assert.match(sql,/where id=p_record_id and workspace_id=p_workspace_id and data_owner_id=v_user/);
});
test("sharing validates active grantees and team membership",()=>{
  assert.match(sql,/share_grantee_invalid/);
  assert.match(sql,/team_share_not_permitted/);
  assert.match(sql,/wm\.status='active'/);
  assert.match(sql,/tm\.status='active'/);
});
test("share metadata also requires an active account and workspace",()=>{
  const policy=sql.slice(sql.indexOf("create policy personal_shares_participant_read"),sql.indexOf("revoke all on public.personal_operational_records"));
  assert.match(policy,/is_active_workspace_principal\(r\.workspace_id,auth\.uid\(\)\)/);
  assert.match(policy,/r\.visibility='explicit_shared'/);
});test("obvious credential material is rejected",()=>{
  for(const field of ["password","access_token","refresh_token","service_role_key","authorization","cookie"])assert.match(sql,new RegExp(`'${field}'`));
});
