import test from "node:test";
import assert from "node:assert/strict";
import { MEMORY_CATEGORIES, TIMELINE_STAGES, opportunityViewModel, promptViewModel, timelineViewModel } from "../../src/components/affiliate-v2/viewModels/affiliateV2FinalViewModel.js";

test("missing opportunity evidence remains Unknown",()=>{const vm=opportunityViewModel([]);assert.equal(vm.score,"Unknown");assert.equal(vm.confidence,"Unknown");assert.equal(vm.evidence,"Unknown")});
test("timeline always preserves the canonical lifecycle without invented events",()=>{const vm=timelineViewModel([]);assert.deepEqual(vm.map(x=>x.stage),TIMELINE_STAGES);assert.ok(vm.every(x=>x.timestamp==="Unknown"&&x.truthClass==="Unknown"))});
test("business memory defines every required category",()=>{assert.deepEqual(MEMORY_CATEGORIES,["Successful Patterns","Failed Patterns","Audience Learnings","Revenue Learnings","Compliance Learnings","Reusable Knowledge","Owner Decision Patterns"])});
test("prompt view model exposes identifiers and metadata rather than prompt bodies",()=>{const [vm]=promptViewModel([{id:"p1",name:"Research brief",prompt:"SECRET BODY",version:2}]);assert.equal(vm.prompt,"Research brief");assert.equal(vm.version,2);assert.equal(JSON.stringify(vm).includes("SECRET BODY"),false)});
