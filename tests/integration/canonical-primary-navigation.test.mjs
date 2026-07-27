import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app=readFileSync(new URL("../../src/App.jsx",import.meta.url),"utf8");
const home=readFileSync(new URL("../../src/components/CanonicalHome.jsx",import.meta.url),"utf8");
test("primary Approval route uses the canonical Production repository workflow",()=>{assert.match(app,/approval:\s*<ProductionRevenueWorkspace ownerSupabaseClient=\{ownerSupabaseClient\}/);assert.doesNotMatch(app,/import ApprovalCenter/);});
test("Home loads Revenue and Offer Operations from the same canonical workspace",()=>{assert.match(home,/createRevenueRepository/);assert.match(home,/createOfferOperationsRepository/);assert.match(home,/buildCanonicalRevenueOverview/);assert.match(home,/buildProfitByCurrency/);assert.doesNotMatch(home,/localStorage|mockEventLedger/);});
