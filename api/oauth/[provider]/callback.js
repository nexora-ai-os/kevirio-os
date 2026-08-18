const safeTarget=(provider,params)=>{
  const query=new URLSearchParams({oauth_provider:provider});
  for(const key of ["code","state","error"]){const value=params.get(key);if(value&&value.length<=4096)query.set(key,value);}
  return `/integrations?${query}`;
};

export default async function handler(req,res){
  if(req.method!=="GET")return res.status(405).json({ok:false,status:"blocked",reasonCode:"METHOD_NOT_ALLOWED",externalExecution:false});
  const provider=String(req.query?.provider||"");
  if(!["google","canva"].includes(provider))return res.status(400).json({ok:false,status:"blocked",reasonCode:"OAUTH_PROVIDER_INVALID",externalExecution:false});
  const url=new URL(req.url||"/",`https://${req.headers?.host||"localhost"}`);
  const hasResult=(url.searchParams.has("code")&&url.searchParams.has("state"))||url.searchParams.has("error");
  if(!hasResult)return res.status(400).json({ok:false,status:"blocked",reasonCode:"OAUTH_CALLBACK_INVALID",externalExecution:false});
  res.setHeader("cache-control","no-store");res.setHeader("referrer-policy","no-referrer");return res.redirect(303,safeTarget(provider,url.searchParams));
}
