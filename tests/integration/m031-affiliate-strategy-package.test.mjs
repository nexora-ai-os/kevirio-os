import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=p=>readFile(new URL(`../../${p}`,import.meta.url),"utf8");

test("M031 is additive and does not manufacture Application semantics",async()=>{
 const sql=await read("docs/database/m031/031_affiliate_strategy.sql");
 assert.match(sql,/create table public\.affiliate_strategies/);
 assert.match(sql,/affiliate_program_id uuid not null/);
 assert.match(sql,/source_research_id uuid not null/);
 assert.match(sql,/GENERATED_DRAFT','OWNER_REVIEW','CONFIRMED','ARCHIVED/);
 assert.doesNotMatch(sql,/insert into public\.opportunities|save_canonical_domain_object\('APPLICATION'/);
 assert.doesNotMatch(sql,/alter table public\.(?!affiliate_strategies)/);
 assert.match(sql,/join public\.workspace_members/);
 assert.doesNotMatch(sql,/not public\.is_canonical_personal_workspace_owner/);
});

test("M031 preserves owner privacy, protected writes, concurrency and truth",async()=>{
 const sql=await read("docs/database/m031/031_affiliate_strategy.sql");
 for(const value of ["enable row level security","force row level security","revoke all on public.affiliate_strategies from public,anon,authenticated","p_expected_version","m031_stale_or_denied","paid_ai_jpy',0","external_execution','LOCKED","NOT_EVIDENCE","service_role"]) assert.ok(sql.includes(value),value);
 assert.match(sql,/grant select on public\.affiliate_strategies to authenticated/);
 assert.doesNotMatch(sql,/grant (insert|update|delete).*affiliate_strategies to authenticated/i);
});
