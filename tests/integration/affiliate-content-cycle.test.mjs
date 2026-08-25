import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const read=path=>fs.readFile(path,"utf8");
test("affiliate content cycle uses M029 canonical content without synthetic objects",async()=>{const[api,ui,repo]=await Promise.all([read("api/ai.js"),read("src/components/affiliate-v2/AffiliateProgramMaster.jsx"),read("src/repositories/affiliateContentCycleRepository.js")]);for(const value of["affiliateContentPrepare","AFFILIATE_CONTENT_CONTEXT_NOT_FOUND","paidAiJpy:0","externalExecution:\"LOCKED\""])assert.ok(api.includes(value),value);for(const value of["コンテンツを作る","公開準備","WAITING_FOR_REAL_EXTERNAL_RESULT","AI_OUTPUT · NOT_EVIDENCE","Owner確認内容をcanonical保存"])assert.ok(ui.includes(value),value);assert.ok(repo.includes('saveCanonicalDomain(client,{type:"CONTENT"'));assert.doesNotMatch(api,/APPLICATION|insert into public/)});
