import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../../supabase/migrations/020_service_role_foundation_privileges.sql", import.meta.url),
  "utf8",
).toLowerCase();

test("migration 020 is additive, transactional, and server-only", () => {
  assert.match(migration, /^begin;/);
  assert.match(migration, /commit;\s*$/);
  assert.doesNotMatch(migration, /\b(drop|truncate|delete\s+from|alter\s+table)\b/);
  assert.match(migration, /from anon, authenticated/);
  assert.doesNotMatch(migration, /grant\s+[^;]+\s+to\s+(anon|authenticated)/);
});

test("migration 020 grants only required foundation operations", () => {
  assert.match(migration, /grant select on table public\.owner_profiles, public\.workspace_members to service_role/);
  assert.doesNotMatch(migration, /grant[^;]+public\.workspaces[^;]+to service_role/);
  assert.doesNotMatch(migration, /grant\s+all/);
  assert.doesNotMatch(migration, /grant\s+[^;]*(insert|update|delete)/);
});
