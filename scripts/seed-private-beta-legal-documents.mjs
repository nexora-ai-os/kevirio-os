import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
assert.ok(/^https:\/\//.test(url || ""), "SUPABASE_URL required");
assert.ok(key, "SUPABASE_SECRET_KEY required");
const definitions = [["TERMS", "TERMS_1.0"], ["PRIVACY", "PRIVACY_1.0"], ["AI_NOTICE", "AI_NOTICE_1.0"], ["EXTERNAL_SERVICES_NOTICE", "EXTERNAL_SERVICES_1.0"]];
const rows = await Promise.all(definitions.map(async ([document_type, document_version]) => {
  const bytes = await readFile(new URL(`../public/legal/${document_version}.md`, import.meta.url));
  return { document_type, document_version, lifecycle_status: "ACTIVE", mandatory: true, material_revision: false, content_hash: createHash("sha256").update(bytes).digest("hex"), content_reference: `/legal/${document_version}.md`, effective_at: "2026-08-18T00:00:00+09:00" };
}));
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const current = await client.from("legal_documents").select("id,document_type,document_version,lifecycle_status,mandatory,material_revision,content_hash,content_reference,effective_at");
if (current.error) throw current.error;
const relevant = current.data.filter(row => rows.some(candidate => candidate.document_type === row.document_type));
for (const row of relevant) {
  const expected = rows.find(candidate => candidate.document_type === row.document_type);
  assert.equal(row.document_version, expected.document_version, `Conflicting legal version: ${row.document_type}`);
  assert.equal(row.content_hash, expected.content_hash, `Existing legal hash mismatch: ${row.document_version}`);
  assert.equal(row.lifecycle_status, "ACTIVE", `Existing legal status mismatch: ${row.document_version}`);
}
if (relevant.length === 0) {
  const inserted = await client.from("legal_documents").insert(rows);
  if (inserted.error) throw inserted.error;
}
const verified = await client.from("legal_documents").select("id,document_type,document_version,lifecycle_status,mandatory,content_hash,content_reference").eq("mandatory", true).eq("lifecycle_status", "ACTIVE");
if (verified.error) throw verified.error;
assert.equal(verified.data.length, 4, "Exactly four mandatory ACTIVE legal documents required");
for (const expected of rows) {
  const actual = verified.data.find(row => row.document_version === expected.document_version);
  assert.ok(actual, `Missing ${expected.document_version}`);
  assert.equal(actual.content_hash, expected.content_hash, `Hash mismatch ${expected.document_version}`);
  assert.equal(actual.content_reference, expected.content_reference, `Reference mismatch ${expected.document_version}`);
}
console.log(JSON.stringify({ status: "ACTIVE", count: 4, documents: verified.data.map(({ id, document_version, content_hash }) => ({ id, document_version, content_hash })) }, null, 2));
