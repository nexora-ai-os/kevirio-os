import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const LOCAL_EMAIL = "playwright-owner@local.test";

export function getLocalSupabaseEnvironment() {
  if(process.env.KEVIRIO_LOCAL_SUPABASE_URL&&process.env.KEVIRIO_LOCAL_SUPABASE_ANON_KEY&&process.env.KEVIRIO_LOCAL_SUPABASE_SERVICE_KEY)return{url:process.env.KEVIRIO_LOCAL_SUPABASE_URL,anonKey:process.env.KEVIRIO_LOCAL_SUPABASE_ANON_KEY,serviceKey:process.env.KEVIRIO_LOCAL_SUPABASE_SERVICE_KEY};
  const output = execFileSync(resolveLocalSupabaseCli(), ["status", "-o", "env"], { encoding: "utf8", windowsHide: true,timeout:15_000 });
  const values = Object.fromEntries([...output.matchAll(/^([A-Z_]+)="([^"]*)"$/gm)].map((match) => [match[1], match[2]]));
  assert.match(values.API_URL || "", /^http:\/\/127\.0\.0\.1:/, "Playwright requires local Supabase API_URL");
  assert.ok(values.ANON_KEY && values.SERVICE_ROLE_KEY, "Local Supabase keys are unavailable");
  process.env.KEVIRIO_LOCAL_SUPABASE_URL=values.API_URL;process.env.KEVIRIO_LOCAL_SUPABASE_ANON_KEY=values.ANON_KEY;process.env.KEVIRIO_LOCAL_SUPABASE_SERVICE_KEY=values.SERVICE_ROLE_KEY;
  return { url: values.API_URL, anonKey: values.ANON_KEY, serviceKey: values.SERVICE_ROLE_KEY };
}

function resolveLocalSupabaseCli(){
  if(process.env.SUPABASE_CLI_PATH&&existsSync(process.env.SUPABASE_CLI_PATH))return process.env.SUPABASE_CLI_PATH;
  if(process.platform!=="win32")return "supabase";
  const root=join(homedir(),"AppData","Local","npm-cache","_npx");
  const candidates=existsSync(root)?readdirSync(root).map(entry=>join(root,entry,"node_modules","@supabase","cli-windows-x64","bin","supabase.exe")).filter(existsSync):[];
  candidates.sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs);
  assert.ok(candidates[0],"Cached local Supabase CLI is unavailable");return candidates[0];
}

function localSql(sql) {
  return execFileSync("docker", ["exec", "-i", "supabase_db_kevirio-os", "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", "-c", sql], { encoding: "utf8", windowsHide: true });
}

function safeUuid(value) {
  assert.match(value, /^[0-9a-f-]{36}$/i);
  return value;
}

export async function provisionLocalPlaywrightOwner() {
  const env = getLocalSupabaseEnvironment();
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(env.url, env.serviceKey, options);
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  assert.equal(listed.error, null, `Local user listing failed: ${listed.error?.message}`);
  const password = `Local-${crypto.randomUUID()}-Aa1!`;
  const existing = listed.data.users.find((candidate) => candidate.email === LOCAL_EMAIL);
  const prepared = existing
    ? await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    : await admin.auth.admin.createUser({ email: LOCAL_EMAIL, password, email_confirm: true });
  assert.equal(prepared.error, null, `Local Owner preparation failed: ${prepared.error?.message}`);
  const userId = safeUuid(prepared.data.user.id);
  localSql(`insert into public.owner_profiles(owner_id,role,status) values ('${userId}','owner','active') on conflict (owner_id) do update set role='owner',status='active';`);

  const bootstrap = await admin.rpc("bootstrap_personal_workspace_for_user", { p_user_id: userId, p_name: "Personal Workspace" });
  assert.equal(bootstrap.error, null, `Personal Workspace bootstrap failed: ${bootstrap.error?.message}`);

  const userClient = createClient(env.url, env.anonKey, options);
  const signed = await userClient.auth.signInWithPassword({ email: LOCAL_EMAIL, password });
  assert.equal(signed.error, null, `Local fixture sign-in failed: ${signed.error?.message}`);
  assert.equal(signed.data.user.id, userId, "Local fixture identity mismatch");
  const docs = await userClient.from("legal_documents").select("id,document_version,content_hash,mandatory").in("lifecycle_status", ["ACTIVE", "RECONSENT_REQUIRED"]);
  assert.equal(docs.error, null, `Legal document load failed: ${docs.error?.message}`);
  const accepted = await userClient.rpc("accept_required_legal_documents", {
    p_acceptances: docs.data.filter((doc) => doc.mandatory).map((doc) => ({ documentId: doc.id, documentVersion: doc.document_version, policyHash: doc.content_hash, accepted: true })),
    p_workspace_id: bootstrap.data,
    p_technical_evidence: { method: "playwright-local-fixture" },
  });
  assert.equal(accepted.error, null, `Local legal acceptance failed: ${accepted.error?.message}`);
  const access = await userClient.rpc("current_account_access_state");
  assert.equal(access.error, null, `Local lifecycle check failed: ${access.error?.message}`);
  assert.equal(access.data, "ACTIVE", "Playwright Owner is not ACTIVE");
  const session = signed.data.session;
  assert.ok(session?.access_token && session?.refresh_token, "Fresh local session tokens are missing");
  const storageKey = `sb-${new URL(env.url).hostname.split(".")[0]}-auth-token`;
  return { email: LOCAL_EMAIL, userId, url: env.url, session, storageKey };
}
