import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("@pgsql/parser/v17");

const artifacts = {
  migration: new URL("../supabase/migrations/015_affiliate_intelligence_v2.sql", import.meta.url),
  precheck: new URL("../supabase/validation/015_pre_apply_checks.sql", import.meta.url),
  postsmoke: new URL("../supabase/validation/015_post_apply_smoke.sql", import.meta.url),
};

const results = {};
for (const [name, path] of Object.entries(artifacts)) {
  const parsed = await parse(readFileSync(path, "utf8"));
  assert.ok(parsed.stmts.length > 0, `${name} parser returned no statements`);
  results[name] = { status: "PASS", statements: parsed.stmts.length };
}
console.log(JSON.stringify({ parser: "@pgsql/parser PostgreSQL 17", results }, null, 2));
