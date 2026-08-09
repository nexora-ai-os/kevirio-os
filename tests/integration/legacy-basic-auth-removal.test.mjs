import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("legacy Basic auth is removed while KEVIRIO Owner Auth remains mounted", () => {
  assert.equal(existsSync(new URL("../../middleware.js", import.meta.url)), false);
  assert.doesNotMatch(read(".env.example"), /BASIC_AUTH_(?:USER|PASSWORD)/);
  assert.match(read("src/main.jsx"), /<SupabaseOwnerAuthGate><AppRouter \/><\/SupabaseOwnerAuthGate>/);
  assert.match(read("src/components/SupabaseOwnerAuthGate.jsx"), /id="owner-login-title"/);
});
