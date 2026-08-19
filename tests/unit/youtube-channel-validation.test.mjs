import test from "node:test";
import assert from "node:assert/strict";
import {createOAuthCipher} from "../../server/oauthRuntime.js";
import {validateYouTubeChannel} from "../../server/googleResourceDiscovery.js";

const key="test-only-key-that-is-at-least-thirty-two-bytes";
const cipher=createOAuthCipher(key);
const client={from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{state:"connected",token_ciphertext:cipher.encrypt("token"),refresh_token_ciphertext:cipher.encrypt("refresh"),token_expires_at:new Date(Date.now()+3600000).toISOString(),granted_scopes:["https://www.googleapis.com/auth/youtube.readonly"]},error:null})})};

test("YouTube selection validates one authorized channel and at most five videos",async()=>{
  const calls=[];
  const transport=async(url,options)=>{
    calls.push({url,options});
    if(url.includes("/channels?"))return {ok:true,status:200,json:async()=>({items:[{id:"channel_12345",snippet:{title:"Owner channel"},statistics:{videoCount:"8"},contentDetails:{relatedPlaylists:{uploads:"uploads"}}}]})};
    return {ok:true,status:200,json:async()=>({items:Array.from({length:7},(_,i)=>({id:`i${i}`,contentDetails:{videoId:`v${i}`},snippet:{title:`video ${i}`}}))})};
  };
  const result=await validateYouTubeChannel({client,workspaceId:"w",encryptionKey:key,channelId:"channel_12345",transport});
  assert.equal(result.ok,true);
  assert.equal(result.resourceState,"RESOURCE_SELECTED");
  assert.equal(result.recentVideos.length,5);
  assert.equal(result.writes,0);
  assert.equal(result.polling,false);
  assert.ok(calls.every(call=>call.options.method==="GET"));
});
