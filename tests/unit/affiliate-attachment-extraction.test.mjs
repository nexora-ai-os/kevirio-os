import test from "node:test";
import assert from "node:assert/strict";
import {extractAffiliateProgramFromAttachments,normalizeAffiliateExtraction,validateAffiliateAttachments} from "../../server/affiliateAttachmentExtraction.js";

const file={mimeType:"image/png",data:Buffer.from("safe fixture image").toString("base64")};
test("Affiliate attachment intake is Owner/workspace scoped and bounded",()=>{
 assert.equal(validateAffiliateAttachments([]).reasonCode,"AFFILIATE_ATTACHMENT_COUNT_INVALID");
 assert.equal(validateAffiliateAttachments([{...file,mimeType:"text/html"}]).reasonCode,"AFFILIATE_ATTACHMENT_TYPE_UNSUPPORTED");
});
test("normalization allowlists fields, preserves conflict and never creates truth",()=>{
 const value=normalizeAffiliateExtraction({fields:[{field:"epc",value:42.5,confidence:"HIGH",source:"資料 1"},{field:"actualRevenue",value:999,confidence:"HIGH",source:"資料 1"},{field:"epc",value:50,confidence:"HIGH",source:"資料 2"}]});
 assert.equal(value.fields.length,1);assert.equal(value.fields[0].conflict,true);assert.equal(value.truthClass,"AI_OUTPUT");assert.equal(value.evidenceStatus,"NOT_EVIDENCE");assert.equal(value.canonicalApplied,false);
});
test("Gemini multimodal extraction is one FREE call with inline media and no paid fallback",async()=>{
 let body;
 const result=await extractAffiliateProgramFromAttachments({workspaceId:"w",explicitOwnerAction:true,files:[file],currentProgram:{epc:null}},{credential:"fixture",transport:async(_url,options)=>{body=JSON.parse(options.body);return{ok:true,status:200,json:async()=>({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify({fields:[{field:"epc",value:42.5,confidence:"HIGH",sources:["資料 1"]}],warnings:[]})}]}}]})}}});
 assert.equal(result.ok,true);assert.equal(result.cost,"FREE");assert.equal(result.paidFallbackCalls,0);assert.equal(result.externalExecution,false);assert.equal(result.fields[0].value,42.5);assert.equal(body.contents[0].parts[0].inlineData.mimeType,"image/png");assert.equal(body.generationConfig.responseMimeType,"application/json");
});
