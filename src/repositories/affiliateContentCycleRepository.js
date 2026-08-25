import {listCanonicalDomain,saveCanonicalDomain} from "./canonicalDomainRepository.js";

const contentFor=(row,programId)=>row?.payload?.affiliate_program_id===programId&&row?.payload?.workflow==="AFFILIATE_REAL_CYCLE";
export async function loadAffiliateContentCycle(client,{programId}){
  const rows=await listCanonicalDomain(client,"CONTENT",{limit:200});
  return rows.filter(row=>contentFor(row,programId));
}
export async function saveAffiliateContentCycle(client,{record=null,payload,lifecycleStatus="DRAFT"}){
  return saveCanonicalDomain(client,{type:"CONTENT",id:record?.id||null,expectedVersion:record?.version??null,payload:{title:payload.title,payload,lifecycle_status:lifecycleStatus}});
}
