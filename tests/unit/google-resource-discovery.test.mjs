import test from "node:test";
import assert from "node:assert/strict";
import {createOAuthCipher} from "../../server/oauthRuntime.js";
import {discoverGoogleResources} from "../../server/googleResourceDiscovery.js";

const scopes=["analytics.readonly","webmasters.readonly","youtube.readonly"].map(value=>`https://www.googleapis.com/auth/${value}`);
const key="test-only-key-that-is-at-least-thirty-two-bytes";
const cipher=createOAuthCipher(key);
const client={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{state:"connected",token_ciphertext:cipher.encrypt("token"),refresh_token_ciphertext:cipher.encrypt("refresh"),token_expires_at:new Date(Date.now()+3600000).toISOString(),granted_scopes:scopes},error:null})})};

test("Google resource discovery is bounded, read-only, and independently classified",async()=>{
  const calls=[];
  const transport=async(url,options)=>{
    calls.push({url,options});
    if(url.includes("analyticsadmin"))return {ok:false,status:403,json:async()=>({error:{errors:[{reason:"accessNotConfigured"}]}})};
    if(url.includes("webmasters"))return {ok:true,status:200,json:async()=>({siteEntry:[]})};
    return {ok:true,status:200,json:async()=>({items:[{id:"c1",snippet:{title:"channel"}}]})};
  };
  const result=await discoverGoogleResources({client,workspaceId:"w",encryptionKey:key,transport});
  assert.equal(result.ok,true);
  assert.deepEqual(result.requestBounds,{analytics:20,searchConsole:20,youtube:5});
  assert.equal(result.services.analytics.state,"API_DISABLED");
  assert.equal(result.services.searchConsole.state,"NO_RESOURCE");
  assert.equal(result.services.youtube.state,"RESOURCE_AVAILABLE");
  assert.equal(result.writes,0);
  assert.equal(result.polling,false);
  assert.ok(calls.every(call=>call.options.method==="GET"));
});
