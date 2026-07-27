import test from "node:test";
import assert from "node:assert/strict";
import { buildProfitByCurrency,formatContentPackageMarkdown,nextOperationAction,validateAffiliateOffer } from "../../src/domain/offerOperations.js";

test("offer validation normalizes markets and ISO currency",()=>{const result=validateAffiliateOffer({title:" Offer ",advertiser:"ASP",commissionSummary:"成果報酬",currency:"jpy",targetMarkets:["JP","GLOBAL","JP"]});assert.equal(result.valid,true);assert.equal(result.normalized.currency,"JPY");assert.deepEqual(result.normalized.targetMarkets,["JP","GLOBAL"]);});
test("offer validation rejects non-integer commission",()=>assert.equal(validateAffiliateOffer({title:"A",advertiser:"B",commissionSummary:"C",commissionMinor:1.2}).valid,false));
test("content package copy is readable and explicitly locked",()=>{const text=formatContentPackageMarkdown({campaignTitle:"Campaign",content:{article:{headline:"Guide",outline:["One"],cta:"Check"},socialPosts:[{market:"JP",text:"Post"}],shortVideo:{hook:"Hook",beats:["Beat"]}},executionChecklist:["Review"]});assert.match(text,/Guide/);assert.match(text,/外部自動実行: ロック中/);assert.doesNotMatch(text,/idempotency|uuid/i);});
test("profit uses verified revenue and actual operating cost only per currency",()=>{const rows=buildProfitByCurrency({revenueRecords:[{currency:"JPY",gross_amount_minor:10000,cost_amount_minor:1000}],costRecords:[{currency:"JPY",amount_minor:500,value_type:"actual"},{currency:"JPY",amount_minor:9000,value_type:"forecast"}]});assert.deepEqual(rows,[{currency:"JPY",grossMinor:10000,revenueCostMinor:1000,operatingCostMinor:500,netProfitMinor:8500,verifiedRevenueCount:1}]);});
test("workflow next action never skips approval",()=>assert.match(nextOperationAction({status:"owner_artifact_approval"}),/承認/));
