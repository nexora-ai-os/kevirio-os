import test from "node:test";
import assert from "node:assert/strict";
import {extractAffiliateProgramFromAttachments,normalizeAffiliateExtraction,parseAffiliateExtractionJson,validateAffiliateAttachments} from "../../server/affiliateAttachmentExtraction.js";

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
test("A8 image response normalizes Unknown markers and schema drift without inventing facts",()=>{
 const value=normalizeAffiliateExtraction({fields:[
  {field:"epc",value:"-",confidence:"HIGH",sources:["screenshot"]},{field:"approvalRate",value:"不明",confidence:"HIGH",sources:["screenshot"]},
  {field:"rewardType",value:"購入",confidence:"HIGH",sources:["screenshot"]},{field:"rewardSummary",value:"7%",confidence:"HIGH",sources:["screenshot"]},
  {field:"revisitWindowDays",value:"90",confidence:"HIGH",sources:["screenshot"]},{field:"listingPolicy",value:"A8.netのルールを遵守",confidence:"HIGH",sources:["screenshot"]},
  {field:"listingNgWords",value:"社名、サービス名、表記ゆれ",confidence:"HIGH",sources:["screenshot"]},{field:"conversionConditions",value:"WEB注文後、30日以内の入金確認\n対象商品のみ",confidence:"HIGH",sources:["screenshot"]},
  {field:"affiliateUrl",value:"https://shop.example/item",confidence:"HIGH",sources:["screenshot"]},
 ]});
 for(const field of ["epc","approvalRate","rewardType","listingPolicy","affiliateUrl"])assert.equal(value.fields.find(x=>x.field===field),undefined);
 assert.equal(value.fields.find(x=>x.field==="revisitWindowDays").value,90);assert.deepEqual(value.fields.find(x=>x.field==="listingNgWords").value,["社名","サービス名","表記ゆれ"]);assert.equal(value.fields.find(x=>x.field==="conversionConditions").value.includes("\n"),true);assert.deepEqual(value.fields.find(x=>x.field==="rewardSummary").sources,["資料 1"]);
 assert.equal(value.truthClass,"AI_OUTPUT");assert.equal(value.evidenceStatus,"NOT_EVIDENCE");
});
test("parser accepts fenced or mixed JSON but rejects truncated JSON",()=>{
 assert.equal(parseAffiliateExtractionJson('```json\n{"fields":[],"warnings":[]}\n```').payload.fields.length,0);
 assert.equal(parseAffiliateExtractionJson('説明です\n{"fields":[],"warnings":[]}\n以上').parseMode,"EXTRACTED_OBJECT");
 assert.throws(()=>parseAffiliateExtractionJson('{"fields":[{"field":"prPoints"'),error=>error.code==="JSON_TRUNCATED_OR_MISSING");
});
test("MAX_TOKENS is reported as truncation, not generic invalid JSON",async()=>{
 const result=await extractAffiliateProgramFromAttachments({workspaceId:"w",explicitOwnerAction:true,files:[file],currentProgram:{}},{credential:"fixture",transport:async()=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:"MAX_TOKENS",content:{parts:[{text:'{"fields":['}]}}]})})});
 assert.equal(result.reasonCode,"AFFILIATE_EXTRACTION_TRUNCATED_RESPONSE");assert.equal(result.finishReason,"MAX_TOKENS");
});
