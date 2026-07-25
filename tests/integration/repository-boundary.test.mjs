import test from "node:test";
import assert from "node:assert/strict";
import { createRevenueRepository } from "../../src/repositories/revenueRepository.js";

test("repository scopes reads by workspace",async()=>{let filter;const client={from:()=>({select:()=>({eq:(field,value)=>{filter={field,value};return Promise.resolve({data:[],error:null});}})})};await createRevenueRepository(client).listCampaigns("workspace-a");assert.deepEqual(filter,{field:"workspace_id",value:"workspace-a"});});
test("repository rejects cross-workspace writes before provider call",async()=>{const repo=createRevenueRepository({from:()=>{throw new Error("must not call");}});await assert.rejects(()=>repo.createCampaign("workspace-a",{workspace_id:"workspace-b"}),/WORKSPACE_MISMATCH/);});
