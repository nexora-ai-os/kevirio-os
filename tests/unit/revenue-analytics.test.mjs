import test from "node:test";
import assert from "node:assert/strict";
import { mapCanonicalActualAnalytics } from "../../src/domain/revenueAnalytics.js";

test("analytics maps canonical revenue records only",()=>{const value=mapCanonicalActualAnalytics([{id:"r",campaign_id:"c",evidence_candidate_id:"e",gross_amount_minor:10000,cost_amount_minor:2500,net_amount_minor:7500,currency:"JPY",lane:"service",recognized_at:"2026-07-01",created_at:"2026-07-02"}],[{id:"c",offer:{title:"提案"}}],[{id:"e",verification_status:"verified"}]);assert.deepEqual({gross:value.grossMinor,cost:value.costMinor,net:value.netMinor},{gross:10000,cost:2500,net:7500});assert.equal(value.rows[0].evidenceStatus,"検証済み");});
test("pending evidence and forecast inputs cannot enter actual analytics",()=>{const value=mapCanonicalActualAnalytics([],[],[{id:"e",verification_status:"verification_required",amount_minor:99999}]);assert.equal(value.rows.length,0);assert.equal(value.netMinor,0);});
