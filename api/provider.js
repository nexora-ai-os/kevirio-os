import {resolveVerifiedOwnerWorkspaceContext} from "../server/verifiedOwnerContext.js";
import {createSupabaseServerClient} from "../server/supabaseServerClient.js";
import {createProviderConnectionRuntime} from "../server/providerConnectionRuntime.js";
import {executeProviderPlatformRequest} from "../server/providerPlatformGateway.js";
import {createOAuthCodeExchange} from "../server/oauthProviderTransport.js";
import {buildOAuthAuthorization,getOAuthProviderPolicy} from "../server/oauthAuthorization.js";
import {validateGoogleBoundedReads} from "../server/googleBoundedRead.js";
import {validateCanvaProfile} from "../server/canvaProfileValidation.js";
import {readGoogleProductData} from "../server/googleProductRead.js";
const safe=(reasonCode)=>({ok:false,status:"blocked",reasonCode,externalExecution:false,productionExecution:false});
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json(safe("METHOD_NOT_ALLOWED"));
  const body=req.body&&typeof req.body==="object"&&!Array.isArray(req.body)?req.body:{};const client=createSupabaseServerClient();const verified=await resolveVerifiedOwnerWorkspaceContext(req,body.workspaceId,{client});if(!verified.ok)return res.status(403).json(safe(verified.reasonCode));
  if(body.action==="dryRun"){const result=await executeProviderPlatformRequest({...body.request,mode:"dry_run",workspaceId:verified.context.workspaceId},{ownerVerified:true,workspaceId:verified.context.workspaceId,externalExecutionLocked:true});return res.status(result.ok?200:403).json(result);}
  if(body.action==="beginOAuth"){
    if(!["google","canva"].includes(body.provider))return res.status(400).json(safe("OAUTH_PROVIDER_INVALID"));
    if(process.env[`${body.provider.toUpperCase()}_OAUTH_ENABLED`]!=="true")return res.status(403).json(safe("OAUTH_PROVIDER_LOCKED"));
    const base=process.env.OAUTH_REDIRECT_BASE_URL;let redirectUri;try{redirectUri=new URL(`/api/oauth/${body.provider}/callback`,base).toString();}catch{return res.status(503).json(safe("OAUTH_REDIRECT_NOT_CONFIGURED"));}
    const policy=getOAuthProviderPolicy(body.provider);const runtime=createProviderConnectionRuntime({client,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY,allowedRedirectUris:[redirectUri]});const result=await runtime.beginOAuth({workspaceId:verified.context.workspaceId,ownerId:verified.context.ownerId,provider:body.provider,redirectUri,scopes:policy.scopes});
    if(!result.ok)return res.status(403).json(result);const authorization=buildOAuthAuthorization(body.provider,result.authorization);if(!authorization)return res.status(503).json(safe("OAUTH_PROVIDER_CONFIGURATION_REQUIRED"));return res.status(200).json({...result,authorization});
  }
  if(body.action==="completeOAuth"){
    if(!["google","canva"].includes(body.provider)||process.env[`${body.provider?.toUpperCase()}_OAUTH_ENABLED`]!=="true")return res.status(403).json(safe("OAUTH_PROVIDER_LOCKED"));
    const base=process.env.OAUTH_REDIRECT_BASE_URL;let redirectUri;try{redirectUri=new URL(`/api/oauth/${body.provider}/callback`,base).toString();}catch{return res.status(503).json(safe("OAUTH_REDIRECT_NOT_CONFIGURED"));}
    const exchangeCode=createOAuthCodeExchange(body.provider);if(!exchangeCode)return res.status(503).json(safe("OAUTH_PROVIDER_CONFIGURATION_REQUIRED"));
    const runtime=createProviderConnectionRuntime({client,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY,allowedRedirectUris:[redirectUri]});const result=await runtime.completeOAuth({workspaceId:verified.context.workspaceId,ownerId:verified.context.ownerId,provider:body.provider,redirectUri,state:body.state,code:body.code,exchangeCode});return res.status(result.ok?200:403).json(result);
  }
  if(body.action==="validateGoogleReads"){if(process.env.GOOGLE_OAUTH_ENABLED!=="true")return res.status(403).json(safe("OAUTH_PROVIDER_LOCKED"));const result=await validateGoogleBoundedReads({client,workspaceId:verified.context.workspaceId,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY});return res.status(result.ok?200:403).json(result);}
  if(body.action==="validateCanvaProfile"){if(process.env.CANVA_OAUTH_ENABLED!=="true")return res.status(403).json(safe("OAUTH_PROVIDER_LOCKED"));const result=await validateCanvaProfile({client,workspaceId:verified.context.workspaceId,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY});return res.status(result.ok?200:403).json(result);}
  if(body.action==="connectionStatus"){const result=await client.from("provider_connections").select("provider,state,granted_scopes,token_expires_at,refresh_token_ciphertext").eq("workspace_id",verified.context.workspaceId).in("provider",["google","canva"]);if(result.error)return res.status(503).json(safe("OAUTH_STATUS_UNAVAILABLE"));return res.status(200).json({ok:true,connections:(result.data||[]).map(row=>({provider:row.provider,state:row.state,grantedScopes:row.granted_scopes||[],expiryTracked:Boolean(row.token_expires_at),refreshAvailable:Boolean(row.refresh_token_ciphertext)})),externalExecution:false});}
  if(body.action==="disconnect"){if(!["google","canva"].includes(body.provider)||body.ownerConfirmed!==true)return res.status(400).json(safe("OWNER_CONFIRMATION_REQUIRED"));const runtime=createProviderConnectionRuntime({client,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY});const result=await runtime.disconnect({workspaceId:verified.context.workspaceId,ownerId:verified.context.ownerId,provider:body.provider});return res.status(result.ok?200:403).json(result);}
  if(body.action==="readGoogleProductData"){if(process.env.GOOGLE_OAUTH_ENABLED!=="true")return res.status(403).json(safe("OAUTH_PROVIDER_LOCKED"));const result=await readGoogleProductData({client,workspaceId:verified.context.workspaceId,encryptionKey:process.env.OAUTH_TOKEN_ENCRYPTION_KEY,query:body.query});return res.status(result.ok?200:403).json(result);}
  return res.status(400).json(safe("UNKNOWN_ACTION"));
}
