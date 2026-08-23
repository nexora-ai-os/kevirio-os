import { dispatchGeminiFreeParts } from "./geminiFreeAdapter.js";

export const AFFILIATE_EXTRACTION_FIELDS = Object.freeze(["aspName","programId","advertiserName","programName","category","rewardType","rewardSummary","rewardDetails","epc","approvalRate","revisitWindowDays","confirmationDays","conversionConditions","rejectionConditions","prPoints","listingPolicy","listingNgWords","listingNgWordsRaw","listingVerificationStatus","affiliateUrl","sourceType","sourceVerifiedAt","sourceNotes"]);
const ALLOWED_MIME = new Set(["image/png","image/jpeg","image/webp","application/pdf"]);
const CONFIDENCE = new Set(["HIGH","MEDIUM","LOW"]);
const MAX_FILES = 4, MAX_FILE_BYTES = 2_500_000, MAX_TOTAL_BYTES = 7_000_000;
const fail = (reasonCode) => ({ ok:false, status:"blocked", reasonCode, provider:"gemini", cost:"FREE", paidFallbackCalls:0, externalExecution:false });
const cleanBase64 = (value) => String(value||"").replace(/^data:[^;]+;base64,/,"").replace(/\s/g,"");
const byteLength = (base64) => Math.floor(base64.length * 3 / 4);

export function validateAffiliateAttachments(files=[]) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_FILES) return fail("AFFILIATE_ATTACHMENT_COUNT_INVALID");
  let total=0;
  const safe=[];
  for (let index=0;index<files.length;index++) {
    const mimeType=String(files[index]?.mimeType||"").toLowerCase(), data=cleanBase64(files[index]?.data), size=byteLength(data);
    if(!ALLOWED_MIME.has(mimeType)) return fail("AFFILIATE_ATTACHMENT_TYPE_UNSUPPORTED");
    if(!data || size>MAX_FILE_BYTES) return fail("AFFILIATE_ATTACHMENT_TOO_LARGE");
    total+=size; safe.push({source:`資料 ${index+1}`,mimeType,data});
  }
  if(total>MAX_TOTAL_BYTES) return fail("AFFILIATE_ATTACHMENT_BUNDLE_TOO_LARGE");
  return {ok:true,files:safe,totalBytes:total};
}

function parseJson(text) {
  const raw=String(text||"").trim().replace(/^```json\s*/i,"").replace(/\s*```$/,"");
  return JSON.parse(raw);
}

export function normalizeAffiliateExtraction(payload={}) {
  const rows=[];
  for(const item of Array.isArray(payload.fields)?payload.fields:[]) {
    if(!AFFILIATE_EXTRACTION_FIELDS.includes(item?.field) || item.value == null || item.value === "") continue;
    const confidence=CONFIDENCE.has(item.confidence)?item.confidence:"LOW";
    const sources=[...new Set((Array.isArray(item.sources)?item.sources:[item.source]).filter(Boolean).map(String))].slice(0,4);
    const value=typeof item.value==="string"?item.value.trim().slice(0,20000):Array.isArray(item.value)?item.value.map(x=>String(x).trim().slice(0,300)).filter(Boolean).slice(0,100):item.value&&typeof item.value==="object"?Object.fromEntries(Object.entries(item.value).slice(0,12).map(([k,v])=>[String(k).slice(0,80),typeof v==="string"?v.slice(0,2000):v])):item.value;
    rows.push({field:item.field,value,confidence,sources,conflict:Boolean(item.conflict),alternatives:Array.isArray(item.alternatives)?item.alternatives.slice(0,4):[]});
  }
  const byField=new Map();
  for(const row of rows){const prior=byField.get(row.field);if(!prior)byField.set(row.field,row);else if(JSON.stringify(prior.value)!==JSON.stringify(row.value))byField.set(row.field,{...prior,sources:[...new Set([...prior.sources,...row.sources])],conflict:true,alternatives:[prior.value,row.value]});else byField.set(row.field,{...prior,sources:[...new Set([...prior.sources,...row.sources])],confidence:prior.confidence==="HIGH"||row.confidence==="HIGH"?"HIGH":prior.confidence})}
  return {fields:[...byField.values()],missing:AFFILIATE_EXTRACTION_FIELDS.filter(field=>!byField.has(field)),warnings:Array.isArray(payload.warnings)?payload.warnings.map(String).slice(0,10):[],truthClass:"AI_OUTPUT",evidenceStatus:"NOT_EVIDENCE",canonicalApplied:false};
}

export async function extractAffiliateProgramFromAttachments(request={},options={}) {
  if(!request.explicitOwnerAction || !request.workspaceId) return fail("OWNER_AUTH_CONTEXT_REQUIRED");
  if(!options.credential) return fail("PROVIDER_CREDENTIAL_REQUIRED");
  const checked=validateAffiliateAttachments(request.files); if(!checked.ok)return checked;
  const existing=Object.fromEntries(AFFILIATE_EXTRACTION_FIELDS.filter(k=>request.currentProgram?.[k]!=null&&request.currentProgram?.[k]!=="").map(k=>[k,request.currentProgram[k]]));
  const prompt=`Extract Affiliate Program facts visible in the attached ASP screenshots/images/PDFs. Return JSON only: {"fields":[{"field":"camelCase field name","value":...,"confidence":"HIGH|MEDIUM|LOW","sources":["資料 1"],"conflict":false,"alternatives":[]}],"warnings":[]}. Allowed fields: ${AFFILIATE_EXTRACTION_FIELDS.join(", ")}. Never guess. Omit absent facts. UNKNOWN stays absent. Treat revenue/performance as non-canonical and do not output Actual Revenue, Evidence, conversions or publications. listingVerificationStatus may be CONFIRMED or NONE_CONFIRMED only when source text explicitly proves it; otherwise omit. Detect conflicting values across files and return conflict=true with alternatives; never silently choose. Existing confirmed Owner values are context only and must not be overwritten: ${JSON.stringify(existing).slice(0,6000)}.`;
  const parts=[...checked.files.map(file=>({inlineData:{mimeType:file.mimeType,data:file.data}})),{text:prompt}];
  try{const response=await dispatchGeminiFreeParts(parts,{...options,responseMimeType:"application/json",maxOutputTokens:5000,temperature:0});if(!response.ok)return {...fail(response.reasonCode),httpStatus:response.httpStatus};const extraction=normalizeAffiliateExtraction(parseJson(response.text));return {ok:true,status:"completed",provider:"gemini",model:"gemini-2.5-flash",cost:"FREE",paidFallbackCalls:0,externalExecution:false,totalBytes:checked.totalBytes,fileCount:checked.files.length,...extraction};}catch{return fail("AFFILIATE_EXTRACTION_INVALID_RESPONSE")}
}
