import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app=readFileSync(new URL("../../src/App.jsx",import.meta.url),"utf8");
const home=readFileSync(new URL("../../src/components/RevenueCommandCenter.jsx",import.meta.url),"utf8");
test("primary Approval route uses the canonical Production repository workflow",()=>{assert.match(app,/approval:\s*<ProductionRevenueWorkspace ownerSupabaseClient=\{ownerSupabaseClient\}/);assert.doesNotMatch(app,/import ApprovalCenter/);});
test("Home loads canonical repository state instead of claiming Actual is disconnected",()=>{assert.match(home,/createRevenueRepository/);assert.match(home,/buildCanonicalRevenueOverview/);assert.doesNotMatch(home,/未接続のActual/);});
