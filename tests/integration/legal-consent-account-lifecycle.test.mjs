import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../../supabase/migrations/018_legal_consent_account_lifecycle.sql",import.meta.url),"utf8").toLowerCase();

test("legal migration is additive and transaction wrapped",()=>{
  assert.ok(sql.startsWith("begin;")&&sql.trim().endsWith("commit;"));
  assert.doesNotMatch(sql,/\b(drop table|drop column|truncate)\b/);
});
test("legal versions, immutable hashes, and re-consent are canonical",()=>{
  for(const value of ["legal_documents","document_version","content_hash","reconsent_required","material_revision","user_consent_records","external_services_notice"])assert.match(sql,new RegExp(value));
  assert.match(sql,/unique\(user_id,legal_document_id\)/);
});
test("activation requires every current mandatory affirmative acceptance",()=>{
  assert.match(sql,/all_current_mandatory_documents_required/);
  assert.match(sql,/affirmative_acceptance_required/);
  assert.match(sql,/document_version_or_hash_mismatch/);
  assert.match(sql,/has_current_required_consents/);
  assert.match(sql,/lifecycle_state='active'/);
  assert.doesNotMatch(sql,/default\s+'active'.*user_account_states/s);
});
test("consent writes are protected and browser tables are read-only",()=>{
  assert.match(sql,/security definer set search_path=''/);
  assert.match(sql,/v_user uuid:=auth\.uid\(\)/);
  assert.match(sql,/revoke all on public\.legal_documents,public\.user_account_states,public\.user_consent_records from anon,authenticated/);
  assert.match(sql,/grant select on public\.legal_documents,public\.user_account_states,public\.user_consent_records to authenticated/);
  assert.doesNotMatch(sql,/grant\s+(insert|update|delete|all)[^;]*to authenticated/);
});
test("technical evidence rejects surveillance and credentials",()=>{
  for(const field of ["fingerprint","device_id","token","authorization","cookie"])assert.match(sql,new RegExp(`'${field}'`));
});
