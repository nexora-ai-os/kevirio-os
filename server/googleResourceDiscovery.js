import {getPersistentAccessToken} from "./persistentOAuth.js";

const get=async(url,token,transport)=>{const response=await transport(url,{method:"GET",headers:{authorization:`Bearer ${token}`,accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(15000)});if(!response.ok)throw Object.assign(new Error("GOOGLE_RESOURCE_DISCOVERY_FAILED"),{status:response.status});return response.json()};
const scope=(name)=>`https://www.googleapis.com/auth/${name}`;
export async function discoverGoogleResources({client,workspaceId,encryptionKey,transport=fetch}){
  const auth=await getPersistentAccessToken({client,workspaceId,provider:"google",encryptionKey,transport});if(!auth.ok)return auth;
  const required=[scope("analytics.readonly"),scope("webmasters.readonly"),scope("youtube.readonly")];
  const missing=required.filter(item=>!auth.scopes?.includes(item));if(missing.length)return {ok:false,reasonCode:"GOOGLE_INCREMENTAL_OAUTH_REQUIRED",missingScopes:missing,externalExecution:false};
  try{
    const [analytics,searchConsole,youtube]=await Promise.all([
      get("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=20",auth.accessToken,transport),
      get("https://www.googleapis.com/webmasters/v3/sites",auth.accessToken,transport),
      get("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&maxResults=5",auth.accessToken,transport),
    ]);
    return {ok:true,status:"google_resources_discovered",analytics:(analytics.accountSummaries||[]).flatMap(account=>(account.propertySummaries||[]).slice(0,20).map(property=>({id:property.property,name:property.displayName||"名称なし",account:account.displayName||null}))).slice(0,20),searchConsole:(searchConsole.siteEntry||[]).slice(0,20).map(site=>({id:site.siteUrl,permission:site.permissionLevel||null})),youtube:(youtube.items||[]).slice(0,5).map(channel=>({id:channel.id,name:channel.snippet?.title||"名称なし"})),requestBounds:{analytics:20,searchConsole:20,youtube:5},writes:0,polling:false,externalExecution:false};
  }catch(error){return {ok:false,reasonCode:error.status===401?"GOOGLE_REAUTH_REQUIRED":error.status===403?"GOOGLE_API_ACCESS_PENDING":"GOOGLE_RESOURCE_DISCOVERY_ERROR",externalExecution:false};}
}
