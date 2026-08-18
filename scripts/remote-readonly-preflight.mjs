import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
assert.ok(/^https:\/\//.test(url || ""), "Remote SUPABASE_URL required");
assert.ok(key, "Remote server key required");

const response = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, authorization: `Bearer ${key}`, accept: "application/openapi+json" } });
assert.equal(response.ok, true, `Remote OpenAPI request failed (${response.status})`);
const specification = await response.json();
const definitions = specification.definitions || specification.components?.schemas || {};
const paths = specification.paths || {};
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

const tableNames = ["legal_documents", "user_consent_records", "user_account_states", "personal_operational_records", "personal_record_shares", "account_personal_workspaces", "member_administration_events"];
const functionNames = ["current_account_access_state", "accept_required_legal_documents", "save_personal_operational_record", "set_personal_record_sharing", "resolve_personal_workspace", "bootstrap_personal_workspace_for_user", "transition_personal_opportunity"];
const tableEvidence = Object.fromEntries(tableNames.map((name) => [name, Boolean(definitions[name])]));
const functionEvidence = Object.fromEntries(functionNames.map((name) => [name, Boolean(paths[`/rpc/${name}`])]));

const existing = {};
for (const name of ["owner_profiles", "workspaces", "workspace_members", "organizations", "affiliate_program_master", "revenue_records"]) {
  const result = await client.from(name).select("*", { count: "exact", head: true }).limit(1);
  existing[name] = result.error ? { readable: false, reason: result.error.code || "READ_DENIED" } : { readable: true, hasRows: Number(result.count || 0) > 0 };
}

console.log(JSON.stringify({ mode: "READ_ONLY", mutationCount: 0, tableEvidence, functionEvidence, existing, ledger: "REMOTE_UNKNOWN_NOT_EXPOSED_BY_REST" }, null, 2));
