const PROVIDERS=Object.freeze({
  google:{
    authorizationUrl:"https://accounts.google.com/o/oauth2/v2/auth",
    scopes:Object.freeze([
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/youtube.readonly",
    ]),
  },
  canva:{authorizationUrl:"https://www.canva.com/api/oauth/authorize",scopes:Object.freeze(["profile:read"])},
});

export function getOAuthProviderPolicy(provider){return PROVIDERS[provider]||null;}

export function buildOAuthAuthorization(provider,authorization,env=process.env){
  const policy=getOAuthProviderPolicy(provider),clientId=env[`${provider?.toUpperCase()}_CLIENT_ID`];
  if(!policy||!clientId||!authorization?.state||!authorization?.pkceChallenge||!authorization?.redirectUri)return null;
  const params=new URLSearchParams({response_type:"code",client_id:clientId,redirect_uri:authorization.redirectUri,scope:policy.scopes.join(" "),state:authorization.state,code_challenge:authorization.pkceChallenge,code_challenge_method:"S256"});
  if(provider==="google"){params.set("access_type","offline");params.set("include_granted_scopes","true");params.set("prompt","consent");}
  return {authorizationUrl:`${policy.authorizationUrl}?${params}`,scopes:[...policy.scopes],redirectUri:authorization.redirectUri};
}
