import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lower=readFileSync(new URL("../../supabase/migrations/015_affiliate_intelligence_v2.sql",import.meta.url),"utf8").toLowerCase();
const tables=["affiliate_products","affiliate_product_sources","affiliate_research_entities","affiliate_experiments","affiliate_intelligence_snapshots","affiliate_risk_findings","affiliate_alerts","affiliate_daily_briefs","reusable_business_assets"];
test("Migration 015 is additive, transaction wrapped, and has no seed",()=>{assert.match(lower,/^begin;/);assert.match(lower,/commit;\s*$/);assert.doesNotMatch(lower,/\b(drop table|truncate|delete from)\b/);assert.doesNotMatch(lower,/ringconn|a8\.net|acalie/);});
test("all V2 tables are Workspace scoped, RLS protected, and browser read-only",()=>{for(const table of tables){assert.match(lower,new RegExp(`create table public\\.${table}`));}assert.match(lower,/workspace_id uuid not null/);assert.match(lower,/alter table public\.%i enable row level security/);assert.match(lower,/grant select on table public\.%i to authenticated,service_role/);assert.match(lower,/revoke all on table public\.%i from public,anon,authenticated/);});
test("truth constraints and External Execution stay fail closed",()=>{assert.match(lower,/truth_class in\('actual','forecast','inference','unknown','mock','test'\)/);assert.match(lower,/truth_class<>'actual' or evidence_candidate_id is not null/);assert.match(lower,/external_execution_allowed=false/);});
test("canonical Actual Revenue and Cost are never inserted or redefined",()=>{assert.doesNotMatch(lower,/create table public\.(revenue_records|operating_cost_records)/);assert.doesNotMatch(lower,/insert into public\.(revenue_records|operating_cost_records)/);});
test("snapshot RPC verifies Owner, bounded input, idempotency, and audit",()=>{for(const token of ["security definer set search_path=''","wm.role='owner'","op.role='owner'","pg_column_size(p_input)>32768","ai_metadata_is_safe(p_input,0)","idempotency_key","affiliate_intelligence_snapshot_saved"])assert.ok(lower.includes(token),token);});
