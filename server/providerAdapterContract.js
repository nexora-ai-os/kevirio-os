import { normalizeProviderError } from "../src/services/providerPlatform.js";
const CAPABILITIES = new Set(["health","text_generation","gmail","drive","calendar","analytics","search_console","youtube","design_read","design_create","design_export"]);
export function defineProviderAdapter(definition = {}) {
  if (!definition.id || typeof definition.normalizeRequest !== "function" || typeof definition.normalizeResponse !== "function" || typeof definition.classifyError !== "function") throw new Error("PROVIDER_ADAPTER_CONTRACT_INVALID");
  const capabilities = Object.freeze([...(definition.capabilities||[])]);
  if (capabilities.some((item)=>!CAPABILITIES.has(item))) throw new Error("PROVIDER_CAPABILITY_INVALID");
  return Object.freeze({ id:definition.id, credentialType:definition.credentialType||"api_key", capabilities, requiredScopes:Object.freeze({...definition.requiredScopes}), streamingSupported:definition.streamingSupported===true, idempotencySupported:definition.idempotencySupported===true, externalExecutionClassification:"locked", normalizeRequest:definition.normalizeRequest, normalizeResponse:definition.normalizeResponse, normalizeUsage:definition.normalizeUsage||((usage={})=>({inputTokens:Number(usage.inputTokens||0),outputTokens:Number(usage.outputTokens||0)})), classifyError:(error)=>definition.classifyError(error)||normalizeProviderError(error), healthCheck:definition.healthCheck||(()=>({ok:true,mode:"fixture",externalRequestCount:0})), dispatch:definition.dispatch });
}
const text=(id,models)=>defineProviderAdapter({id,capabilities:["health","text_generation"],streamingSupported:false,idempotencySupported:false,normalizeRequest:(request)=>({provider:id,model:models.includes(request.model)?request.model:null,maxOutputTokens:request.maxOutputTokens,inputHash:request.promptHash||null}),normalizeResponse:(response)=>({ok:true,text:String(response?.text||""),usage:response?.usage||{}}),classifyError:normalizeProviderError});
export const providerAdapters=Object.freeze({
  openai:text("openai",["gpt-5-nano"]),
  anthropic:text("anthropic",[]),
  gemini:text("gemini",["gemini-2.5-flash"]),
  perplexity:text("perplexity",["sonar"]),
  google:defineProviderAdapter({id:"google",credentialType:"oauth",capabilities:["gmail","drive","calendar","analytics","search_console","youtube"],requiredScopes:{gmail:["gmail.readonly"],drive:["drive.metadata.readonly"],calendar:["calendar.readonly"],analytics:["analytics.readonly"],search_console:["webmasters.readonly"],youtube:["youtube.readonly"]},normalizeRequest:(r)=>({provider:"google",capability:r.capability,requestClass:r.requestClass}),normalizeResponse:(r)=>({ok:true,data:r?.data||null}),classifyError:normalizeProviderError}),
  canva:defineProviderAdapter({id:"canva",credentialType:"oauth",capabilities:["design_read","design_create","design_export"],requiredScopes:{design_read:["design:read"],design_create:["design:write"],design_export:["design:content:read"]},normalizeRequest:(r)=>({provider:"canva",capability:r.capability,requestClass:r.requestClass}),normalizeResponse:(r)=>({ok:true,data:r?.data||null}),classifyError:normalizeProviderError}),
});
export function getProviderAdapter(provider){return providerAdapters[provider]||null;}
