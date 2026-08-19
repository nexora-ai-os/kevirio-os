import {getPersistentAccessToken} from "./persistentOAuth.js";

const scope=(name)=>`https://www.googleapis.com/auth/${name}`;
const normalize=(status,reason)=>{if(status===401)return "INVALID_CREDENTIAL";if(status===429)return "QUOTA";if(status===403&&/accessNotConfigured|SERVICE_DISABLED/i.test(reason))return "API_DISABLED";if(status===403)return "PERMISSION_DENIED";return "PROVIDER_ERROR"};
const get=async(url,token,transport)=>{try{const response=await transport(url,{method:"GET",headers:{authorization:`Bearer ${token}`,accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(15000)});if(response.ok)return {ok:true,http:response.status||200,data:await response.json()};let reason="";try{const body=await response.json();reason=body?.error?.errors?.[0]?.reason||body?.error?.status||""}catch{}return {ok:false,http:response.status,error:normalize(response.status,reason)}}catch{return {ok:false,http:null,error:"PROVIDER_ERROR"}}};
const state=(result,count)=>result.ok?(count?"RESOURCE_AVAILABLE":"NO_RESOURCE"):result.error;
export async function discoverGoogleResources({client,workspaceId,encryptionKey,transport=fetch}){
  const auth=await getPersistentAccessToken({client,workspaceId,provider:"google",encryptionKey,transport});if(!auth.ok)return auth;
  const required={analytics:scope("analytics.readonly"),searchConsole:scope("webmasters.readonly"),youtube:scope("youtube.readonly")};
  const missing=Object.entries(required).filter(([,value])=>!auth.scopes?.includes(value)).map(([service])=>service);if(missing.length)return {ok:false,reasonCode:"GOOGLE_INCREMENTAL_OAUTH_REQUIRED",missingServices:missing,externalExecution:false};
  const [analyticsResult,searchResult,youtubeResult]=await Promise.all([
    get("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=20",auth.accessToken,transport),
    get("https://www.googleapis.com/webmasters/v3/sites",auth.accessToken,transport),
    get("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&maxResults=5",auth.accessToken,transport),
  ]);
  const analytics=analyticsResult.ok?(analyticsResult.data.accountSummaries||[]).flatMap(account=>(account.propertySummaries||[]).slice(0,20).map(property=>({id:property.property,name:property.displayName||"名称なし",account:account.displayName||null}))).slice(0,20):[];
  const searchConsole=searchResult.ok?(searchResult.data.siteEntry||[]).slice(0,20).map(site=>({id:site.siteUrl,permission:site.permissionLevel||null})):[];
  const youtube=youtubeResult.ok?(youtubeResult.data.items||[]).slice(0,5).map(channel=>({id:channel.id,name:channel.snippet?.title||"名称なし"})):[];
  return {ok:true,status:"google_resources_discovered",services:{analytics:{scope:"GRANTED",api:"Analytics Admin API",http:analyticsResult.http,error:analyticsResult.ok?null:analyticsResult.error,resourceCount:analytics.length,state:state(analyticsResult,analytics.length)},searchConsole:{scope:"GRANTED",api:"Search Console API",http:searchResult.http,error:searchResult.ok?null:searchResult.error,resourceCount:searchConsole.length,state:state(searchResult,searchConsole.length)},youtube:{scope:"GRANTED",api:"YouTube Data API v3",http:youtubeResult.http,error:youtubeResult.ok?null:youtubeResult.error,resourceCount:youtube.length,state:state(youtubeResult,youtube.length)}},analytics,searchConsole,youtube,requestBounds:{analytics:20,searchConsole:20,youtube:5},writes:0,polling:false,externalExecution:false};
}
