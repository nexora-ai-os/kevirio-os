import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("../../supabase/migrations/004_owner_workspace_bootstrap_access.sql", import.meta.url), "utf8").toLowerCase();

test("migration 004 is additive and transaction wrapped", () => {
  assert.ok(sql.startsWith("begin;") && sql.trim().endsWith("commit;"));
  assert.equal(/\b(?:drop|delete|truncate)\b/.test(sql), false);
});
test("authenticated can execute only existing bootstrap RPC", () => assert.ok(sql.includes("grant execute on function public.bootstrap_owner_workspace(text,text) to authenticated")));
test("public and anon cannot execute bootstrap RPC", () => assert.ok(sql.includes("from public") && sql.includes("from anon")));
test("authenticated receives read-only bootstrap verification grants", () => {
  for (const table of ["owner_profiles","workspaces","workspace_members","brand_profiles"]) assert.ok(sql.includes(`grant select on table public.${table} to authenticated`));
  assert.equal(/grant\s+(?:insert|update|delete|all).*to authenticated/.test(sql), false);
});
