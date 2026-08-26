import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeAffiliateLink } from "../../src/domain/affiliateProgramMaster.js";
import { mapRepositoryError } from "../../src/domain/affiliateV2Contracts.js";

const sql=readFileSync(new URL("../../supabase/migrations/033_affiliate_write_contract_hardening.sql",import.meta.url),"utf8");

test("M033 replaces only the broken URL constraint and introduces atomic snapshots",()=>{
  assert.match(sql,/drop constraint affiliate_program_master_url_check/);
  assert.match(sql,/length\(affiliate_url\) between 8 and 2000/);
  assert.doesNotMatch(sql,/add constraint affiliate_program_master_url_check[^;]*\{1,1990\}/s);
  assert.match(sql,/p_expected_updated_at timestamptz/);
  assert.match(sql,/p_expected_business_version bigint/);
  assert.match(sql,/for update/);
  assert.match(sql,/business_version=x\.business_version\+1/);
  assert.match(sql,/revoke all on function public\.save_affiliate_program_master_link\(uuid,uuid,text,text\) from public,anon,authenticated/);
});

test("M033 remains narrow and preserves truth and execution boundaries",()=>{
  assert.doesNotMatch(sql,/\b(drop table|truncate|delete from|insert into public\.(revenue_records|affiliate_revenue_evidence|affiliate_actual_revenue_extensions))\b/i);
  assert.doesNotMatch(sql,/grant (insert|update|delete).*authenticated/i);
  assert.match(sql,/'paid_ai_jpy',0/);
  assert.match(sql,/'external_execution','LOCKED'/);
});

test("frontend URL contract preserves valid A8 tracking values exactly",()=>{
  for(const url of [
    "https://px.a8.net/svt/ejp?a8mat=4B7U0U+1IRWFM+5QLS+BZGEP",
    "https://px.a8.net/svt/ejp?a8mat=ABC%2BDEF%2F123&redirect=https%3A%2F%2Fexample.jp%2Fa%3Fb%3D1",
  ]) assert.equal(normalizeAffiliateLink({affiliateUrl:url,linkStatus:"ACTIVE"}).affiliateUrl,url);
  for(const url of ["javascript:alert(1)","https://","https://exa mple.jp/a",`https://example.jp/${"x".repeat(2000)}`])
    assert.throws(()=>normalizeAffiliateLink({affiliateUrl:url,linkStatus:"ACTIVE"}),error=>error.code==="VALIDATION_FAILED");
});

test("M033 database failures map to retry-safe UI states",()=>{
  assert.equal(mapRepositoryError({message:"m033_stale_link_update"}).code,"CONFLICT");
  assert.equal(mapRepositoryError({message:"m033_affiliate_url_invalid"}).code,"VALIDATION_FAILED");
  assert.equal(mapRepositoryError({message:"m033_personal_owner_required"}).code,"WORKSPACE_FORBIDDEN");
});
