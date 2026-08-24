import { dispatchGeminiFreeParts } from "./geminiFreeAdapter.js";

export const AFFILIATE_EXTRACTION_FIELDS = Object.freeze(["aspName","programId","advertiserName","programName","category","rewardType","rewardSummary","rewardDetails","epc","approvalRate","revisitWindowDays","confirmationDays","conversionConditions","rejectionConditions","prPoints","listingPolicy","listingNgWords","listingNgWordsRaw","listingVerificationStatus","affiliateUrl","sourceType","sourceVerifiedAt","sourceNotes"]);
const ALLOWED_MIME = new Set(["image/png","image/jpeg","image/webp","application/pdf"]);
const CONFIDENCE = new Set(["HIGH","MEDIUM","LOW"]);
const NUMERIC_FIELDS = new Set(["epc","approvalRate","revisitWindowDays","confirmationDays"]);
const UNKNOWN_TEXT = /^(?:-|—|―|不明|未設定|記載なし|なし|unknown|n\/?a|null)$/i;
const ENUMS = Object.freeze({rewardType:new Set(["UNKNOWN","FIXED","PERCENTAGE","TIERED","OTHER"]),listingPolicy:new Set(["UNKNOWN","OK","PARTIAL","NG"]),listingVerificationStatus:new Set(["UNKNOWN","NOT_CONFIRMED","CONFIRMED","NONE_CONFIRMED"]),sourceType:new Set(["OWNER_MANUAL","ASP_SCREENSHOT","ASP_PDF","ASP_PAGE"])});
const ENUM_ALIASES = Object.freeze({rewardType:{未確認:"UNKNOWN",定額:"FIXED",割合:"PERCENTAGE",段階報酬:"TIERED",その他:"OTHER"},listingPolicy:{未確認:"UNKNOWN",掲載可:"OK",条件付き:"PARTIAL",掲載不可:"NG"},listingVerificationStatus:{未確認:"NOT_CONFIRMED",確認済み:"CONFIRMED",制限なし確認済み:"NONE_CONFIRMED"},sourceType:{手動確認:"OWNER_MANUAL",screenshot:"ASP_SCREENSHOT",ASPスクリーンショット:"ASP_SCREENSHOT",PDF:"ASP_PDF",ASPページ:"ASP_PAGE"}});
const MAX_FILES = 4, MAX_FILE_BYTES = 2_500_000, MAX_TOTAL_BYTES = 7_000_000;
const fail = (reasonCode) => ({ok:false,status:"blocked",reasonCode,provider:"gemini",cost:"FREE",paidFallbackCalls:0,externalExecution:false});
const cleanBase64 = (value) => String(value||"").replace(/^data:[^;]+;base64,/,"").replace(/\s/g,"");
const byteLength = (base64) => Math.floor(base64.length * 3 / 4);

export function validateAffiliateAttachments(files=[]) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_FILES) return fail("AFFILIATE_ATTACHMENT_COUNT_INVALID");
  let total=0; const safe=[];
  for (let index=0;index<files.length;index++) {
    const mimeType=String(files[index]?.mimeType||"").toLowerCase(), data=cleanBase64(files[index]?.data), size=byteLength(data);
    if(!ALLOWED_MIME.has(mimeType)) return fail("AFFILIATE_ATTACHMENT_TYPE_UNSUPPORTED");
    if(!data || size>MAX_FILE_BYTES) return fail("AFFILIATE_ATTACHMENT_TOO_LARGE");
    total+=size; safe.push({source:`資料 ${index+1}`,mimeType,data});
  }
  if(total>MAX_TOTAL_BYTES) return fail("AFFILIATE_ATTACHMENT_BUNDLE_TOO_LARGE");
  return {ok:true,files:safe,totalBytes:total};
}

function firstBalancedObject(text) {
  const start=text.indexOf("{"); if(start<0)return null;
  let depth=0,inString=false,escaped=false;
  for(let index=start;index<text.length;index++){
    const char=text[index];
    if(inString){if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char==='"')inString=false;continue;}
    if(char==='"'){inString=true;continue;}
    if(char==="{")depth++; else if(char==="}"&&--depth===0)return text.slice(start,index+1);
  }
  return null;
}

export function parseAffiliateExtractionJson(text) {
  const raw=String(text||"").trim();
  const candidates=[raw,raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"") ,firstBalancedObject(raw)].filter(Boolean);
  let lastError;
  for(const candidate of [...new Set(candidates)])try{return {payload:JSON.parse(candidate),parseMode:candidate===raw?"DIRECT":"EXTRACTED_OBJECT"};}catch(error){lastError=error;}
  const error=new Error(lastError?.message||"Affiliate extraction JSON object not found"); error.code=firstBalancedObject(raw)?"JSON_INVALID":"JSON_TRUNCATED_OR_MISSING"; throw error;
}

function normalizeNumeric(field,value) {
  if(typeof value==="number")return Number.isFinite(value)?value:null;
  const text=String(value??"").trim(); if(!text||UNKNOWN_TEXT.test(text))return null;
  const stripped=text.replace(/,/g,"").replace(field==="approvalRate"?/%$/:/[円￥]$/u,"").trim();
  return /^-?\d+(?:\.\d+)?$/.test(stripped)&&Number.isFinite(Number(stripped))?Number(stripped):null;
}

function normalizeEnum(field,value) {
  const text=String(value??"").trim(); if(!text||UNKNOWN_TEXT.test(text))return null;
  const mapped=ENUM_ALIASES[field]?.[text]||text.toUpperCase(); return ENUMS[field]?.has(mapped)?mapped:null;
}

export function normalizeAffiliateExtraction(payload={}) {
  const rows=[],warnings=Array.isArray(payload.warnings)?payload.warnings.map(String).slice(0,10):[];
  for(const item of Array.isArray(payload.fields)?payload.fields:[]) {
    if(!AFFILIATE_EXTRACTION_FIELDS.includes(item?.field)){if(item?.field)warnings.push(`schema外fieldを除外: ${String(item.field).slice(0,80)}`);continue;}
    if(item.value == null || item.value === "" || (typeof item.value==="string"&&UNKNOWN_TEXT.test(item.value.trim())))continue;
    const confidence=CONFIDENCE.has(item.confidence)?item.confidence:"LOW";
    const sources=[...new Set((Array.isArray(item.sources)?item.sources:[item.source]).filter(Boolean).map(x=>String(x).trim()).map(x=>/^screenshot$/i.test(x)?"資料 1":x))].slice(0,4);
    let value=typeof item.value==="string"?item.value.trim().slice(0,20000):Array.isArray(item.value)?item.value.map(x=>String(x).trim().slice(0,300)).filter(Boolean).slice(0,100):item.value&&typeof item.value==="object"?Object.fromEntries(Object.entries(item.value).slice(0,12).map(([key,nested])=>[String(key).slice(0,80),typeof nested==="string"?nested.slice(0,2000):nested])):item.value;
    if(NUMERIC_FIELDS.has(item.field)){value=normalizeNumeric(item.field,value);if(value==null){warnings.push(`${item.field}をUnknownとして除外`);continue;}}
    if(ENUMS[item.field]){value=normalizeEnum(item.field,value);if(value==null){warnings.push(`${item.field}のschema外valueを除外`);continue;}}
    if(item.field==="listingNgWords"&&!Array.isArray(value))value=String(value).split(/[、,\n]/).map(x=>x.trim()).filter(Boolean).slice(0,100);
    if(item.field==="rewardDetails"&&(value==null||Array.isArray(value)||typeof value!=="object")){warnings.push("rewardDetailsのschema外valueを除外");continue;}
    if(item.field==="affiliateUrl"){warnings.push("添付資料のURLはaffiliate tracking URLと断定できないため除外");continue;}
    rows.push({field:item.field,value,confidence,sources,conflict:Boolean(item.conflict),alternatives:Array.isArray(item.alternatives)?item.alternatives.slice(0,4):[]});
  }
  const byField=new Map();
  for(const row of rows){const prior=byField.get(row.field);if(!prior)byField.set(row.field,row);else if(JSON.stringify(prior.value)!==JSON.stringify(row.value))byField.set(row.field,{...prior,sources:[...new Set([...prior.sources,...row.sources])],conflict:true,alternatives:[prior.value,row.value]});else byField.set(row.field,{...prior,sources:[...new Set([...prior.sources,...row.sources])],confidence:prior.confidence==="HIGH"||row.confidence==="HIGH"?"HIGH":prior.confidence});}
  return {fields:[...byField.values()],missing:AFFILIATE_EXTRACTION_FIELDS.filter(field=>!byField.has(field)),warnings:[...new Set(warnings)].slice(0,20),truthClass:"AI_OUTPUT",evidenceStatus:"NOT_EVIDENCE",canonicalApplied:false};
}

export async function extractAffiliateProgramFromAttachments(request={},options={}) {
  if(!request.explicitOwnerAction || !request.workspaceId) return fail("OWNER_AUTH_CONTEXT_REQUIRED");
  if(!options.credential) return fail("PROVIDER_CREDENTIAL_REQUIRED");
  const checked=validateAffiliateAttachments(request.files); if(!checked.ok)return checked;
  const existing=Object.fromEntries(AFFILIATE_EXTRACTION_FIELDS.filter(key=>request.currentProgram?.[key]!=null&&request.currentProgram?.[key]!=="").map(key=>[key,request.currentProgram[key]]));
  const prompt=`Extract Affiliate Program facts visible in the attached ASP screenshots/images/PDFs. Return JSON only: {"fields":[{"field":"camelCase field name","value":...,"confidence":"HIGH|MEDIUM|LOW","sources":["資料 1"],"conflict":false,"alternatives":[]}],"warnings":[]}. Allowed fields: ${AFFILIATE_EXTRACTION_FIELDS.join(", ")}. Never guess. Values shown as -, —, unknown, not stated, or 記載なし must be omitted, never emitted as strings. Numeric fields epc, approvalRate, revisitWindowDays, confirmationDays must be JSON numbers. rewardType must be UNKNOWN|FIXED|PERCENTAGE|TIERED|OTHER. listingPolicy must be UNKNOWN|OK|PARTIAL|NG. listingNgWords must be a JSON string array. sourceType must be OWNER_MANUAL|ASP_SCREENSHOT|ASP_PDF|ASP_PAGE. A product/shop URL is not an affiliateUrl; omit affiliateUrl unless the source explicitly identifies an affiliate tracking URL. Omit absent facts. UNKNOWN stays absent. Treat revenue/performance as non-canonical and do not output Actual Revenue, Evidence, conversions or publications. listingVerificationStatus may be CONFIRMED or NONE_CONFIRMED only when source text explicitly proves it; otherwise omit. Detect conflicting values across files and return conflict=true with alternatives; never silently choose. Existing confirmed Owner values are context only and must not be overwritten: ${JSON.stringify(existing).slice(0,6000)}.`;
  const parts=[...checked.files.map(file=>({inlineData:{mimeType:file.mimeType,data:file.data}})),{text:prompt}];
  try{
    const response=await dispatchGeminiFreeParts(parts,{...options,responseMimeType:"application/json",maxOutputTokens:5000,temperature:0});
    if(!response.ok)return {...fail(response.reasonCode),httpStatus:response.httpStatus,finishReason:response.finishReason||"UNKNOWN"};
    if(response.modelOutputLimited)return {...fail("AFFILIATE_EXTRACTION_TRUNCATED_RESPONSE"),finishReason:response.finishReason,rawLength:response.rawLength};
    const parsed=parseAffiliateExtractionJson(response.text),extraction=normalizeAffiliateExtraction(parsed.payload);
    return {ok:true,status:"completed",provider:"gemini",model:"gemini-2.5-flash",cost:"FREE",paidFallbackCalls:0,externalExecution:false,totalBytes:checked.totalBytes,fileCount:checked.files.length,finishReason:response.finishReason,rawLength:response.rawLength,parseMode:parsed.parseMode,...extraction};
  }catch(error){return {...fail("AFFILIATE_EXTRACTION_INVALID_RESPONSE"),parseErrorCode:error?.code||"UNKNOWN",parseErrorMessage:String(error?.message||"").slice(0,300)};}
}
