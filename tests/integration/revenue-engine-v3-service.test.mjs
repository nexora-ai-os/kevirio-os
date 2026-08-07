import test from "node:test";
import assert from "node:assert/strict";
import { createRevenueEngineV3Service } from "../../src/services/revenueEngineV3Service.js";

test("service reuses one canonical snapshot without duplicate fetches",async()=>{let calls=0;const service=createRevenueEngineV3Service({async loadSnapshot(workspaceId){calls++;assert.equal(workspaceId,"w");return {campaigns:[{id:"c",lane:"affiliate",forecast_currency:"JPY",forecast_revenue_minor:10,forecast_cost_minor:2}],revenue:[],evidence:[]}}});const out=await service.readPerformance("w");assert.equal(calls,1);assert.equal(out.forecast[0].engineType,"affiliate");assert.deepEqual(out.actual,[])});
test("service fails closed without repository or workspace",async()=>{assert.throws(()=>createRevenueEngineV3Service({}),/revenue_repository_required/);await assert.rejects(()=>createRevenueEngineV3Service({loadSnapshot(){}}).readPerformance(),/workspace_id_required/)});
