import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const migration=readFileSync(new URL("../../supabase/migrations/021_personal_workspace_member_administration.sql",import.meta.url),"utf8").toLowerCase();
test("migration 021 defines an explicit one-to-one personal workspace mapping",()=>{assert.match(migration,/user_id uuid primary key/);assert.match(migration,/workspace_id uuid not null unique/);assert.match(migration,/account_personal_workspace_membership_fk/);assert.match(migration,/references public\.workspace_members\(workspace_id,user_id\)/)});
test("personal workspace resolution is server-derived and fail closed",()=>{assert.match(migration,/create function public\.resolve_personal_workspace\(\)/);assert.match(migration,/where apw\.user_id=auth\.uid\(\)/);assert.match(migration,/personal_workspace_required/);assert.doesNotMatch(migration,/order by|limit 1/)});
test("bootstrap is idempotent and creates no implicit team sharing",()=>{assert.match(migration,/on conflict\(user_id\) do nothing/);assert.match(migration,/v_candidate_count<>1/);assert.doesNotMatch(migration,/insert into public\.(teams|team_memberships|personal_record_shares)/)});
test("administration audit is service-only and excludes private payloads",()=>{assert.match(migration,/member_administration_events/);assert.match(migration,/service_role_required/);assert.doesNotMatch(migration,/password|access_token|refresh_token|content|conversation/)});
