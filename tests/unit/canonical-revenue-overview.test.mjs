import test from "node:test";
import assert from "node:assert/strict";
import { buildCanonicalRevenueOverview } from "../../src/domain/canonicalRevenueOverview.js";

test("canonical overview excludes legacy mock state",()=>{const value=buildCanonicalRevenueOverview({campaigns:[{id:"c"}],approvals:[],revenue:[{gross_amount_minor:10000,net_amount_minor:7500}],workflows:[{status:"completed",current_step:"revenue_recorded"}]});assert.equal(value.campaignCount,1);assert.equal(value.netActualMinor,7500);assert.equal(value.revenueRecordCount,1);});
test("canonical pending approval becomes the first Owner action",()=>{const value=buildCanonicalRevenueOverview({approvals:[{status:"pending"}],workflows:[{status:"paused_for_approval",current_step:"actual_revenue_approval"}]});assert.equal(value.pendingApprovals,1);assert.equal(value.nextAction.page,"approval");assert.match(value.nextAction.title,/承認/);});
test("evidence waiting never claims Actual",()=>{const value=buildCanonicalRevenueOverview({revenue:[],workflows:[{status:"running",current_step:"evidence_waiting"}]});assert.equal(value.netActualMinor,0);assert.match(value.nextAction.title,/Evidence/);});
