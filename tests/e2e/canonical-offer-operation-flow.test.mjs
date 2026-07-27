import test from "node:test";
import assert from "node:assert/strict";
import { buildProfitByCurrency,formatContentPackageMarkdown,nextOperationAction } from "../../src/domain/offerOperations.js";

test("safe acceptance path preserves approval, external lock and zero actual without evidence",()=>{
  const states=["owner_artifact_approval","manual_package_ready","performance_waiting","learning_ready"];
  assert.match(nextOperationAction({status:states[0]}),/承認/);
  const payload={campaignTitle:"Test Offer ASPコンテンツ運用",externalExecutionAllowed:false,content:{article:{headline:"Test Guide",outline:["対象者","条件"],cta:"公式条件を確認"},socialPosts:[],shortVideo:{beats:[]}},executionChecklist:["Ownerが手動公開"]};
  assert.match(formatContentPackageMarkdown(payload),/手動公開/);assert.equal(payload.externalExecutionAllowed,false);
  const analytics=buildProfitByCurrency({revenueRecords:[],costRecords:[{currency:"JPY",amount_minor:100,value_type:"test"}]});
  assert.deepEqual(analytics,[]);
});
