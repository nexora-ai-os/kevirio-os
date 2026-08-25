import test from "node:test";
import assert from "node:assert/strict";
import {generateAffiliateContent,normalizeAffiliateContent} from "../../server/affiliateContentGeneration.js";

test("content normalization preserves structured owner-review draft",()=>{const value=normalizeAffiliateContent('```json\n{"title":"RingConn","body":"本文","cta":"確認する","assetChecklist":["画像"],"recommendedTiming":"夜","executionChecklist":["PR表記"]}\n```');assert.equal(value.ok,true);assert.equal(value.draft.body,"本文");assert.deepEqual(value.draft.executionChecklist,["PR表記"])});
test("content generation is free, locked, and rejects malformed output",async()=>{const ok=await generateAffiliateContent({program:{id:"p"},strategy:{id:"s"},contentType:"THREADS"},{credential:"x",dispatch:async()=>({ok:true,text:'{"title":"T","body":"B","cta":null,"assetChecklist":[],"recommendedTiming":null,"executionChecklist":[]}',finishReason:"STOP",rawLength:100})});assert.equal(ok.paidAiJpy,0);assert.equal(ok.externalExecution,"LOCKED");const bad=normalizeAffiliateContent("not json");assert.equal(bad.ok,false)});
