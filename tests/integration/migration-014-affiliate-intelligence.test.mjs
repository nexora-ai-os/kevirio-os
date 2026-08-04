import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/014_affiliate_intelligence.sql",import.meta.url),"utf8").toLowerCase();
test("migration 014 is additive and transaction wrapped",()=>{assert.match(sql,/^begin;/);assert.match(sql,/commit;\s*$/);assert.doesNotMatch(sql,/drop table|truncate|delete from/);});
test("affiliate tables are RLS read-only for authenticated browser",()=>{assert.match(sql,/enable row level security/);assert.match(sql,/create policy affiliate_owner_read/);assert.match(sql,/revoke all on table public\.affiliate_programs/);});
test("workspace composite foreign keys and execution locks exist",()=>{assert.match(sql,/foreign key\(offer_id,workspace_id\)/);assert.match(sql,/foreign key\(affiliate_program_id,workspace_id\)/);assert.match(sql,/check\(external_execution_allowed=false\)/);});
test("real RingConn case is not seeded",()=>assert.doesNotMatch(sql,/ringconn|a8\.net|acalie/));
