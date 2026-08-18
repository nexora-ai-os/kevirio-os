import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/024_member_registration_completion.sql",import.meta.url),"utf8").toLowerCase();
test("member registration completion is additive self-only and fail closed",()=>{assert.match(sql,/begin;/);assert.match(sql,/auth\.uid\(\)/);assert.match(sql,/auth\.role\(\)<>'authenticated'/);assert.match(sql,/suspended','deactivated/);assert.match(sql,/account_registration_forbidden/);assert.doesNotMatch(sql,/delete|truncate|drop table/)});
test("registration can only advance invitation states to consent",()=>{assert.match(sql,/invited','registering','consent_required/);assert.match(sql,/lifecycle_state='consent_required'/);assert.doesNotMatch(sql,/lifecycle_state='active'/)});
