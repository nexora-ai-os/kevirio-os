import { listPersonalRecords, resolvePersonalWorkspace } from "./personalWorkspaceRepository.js";
import { loadOperationalCommandContext, operationalAttention } from "./operationalRepository.js";

const knownRecords=(result)=>result.status==="fulfilled"?result.value:[];
export async function loadAuthorizedPersonalContext(client){
  const workspaceId=await resolvePersonalWorkspace(client);
  const[contentResult,opportunityResult,candidateResult,retrospectiveResult,revenueResult,operationalResult]=await Promise.allSettled([
    listPersonalRecords(client,{workspaceId,recordType:"CONTENT"}),listPersonalRecords(client,{workspaceId,recordType:"OPPORTUNITY"}),listPersonalRecords(client,{workspaceId,recordType:"REVENUE_CANDIDATE"}),listPersonalRecords(client,{workspaceId,recordType:"RETROSPECTIVE"}),client.from("revenue_records").select("currency,gross_amount_minor,net_amount_minor,recognized_at").eq("workspace_id",workspaceId),loadOperationalCommandContext(client),
  ]);
  const stateOf=result=>result.status==="fulfilled"?"KNOWN":"UNKNOWN",revenueState=revenueResult.status==="fulfilled"&&!revenueResult.value.error?"KNOWN":"UNKNOWN";
  return{workspaceId,content:knownRecords(contentResult),contentState:stateOf(contentResult),opportunities:knownRecords(opportunityResult),opportunityState:stateOf(opportunityResult),revenueCandidates:knownRecords(candidateResult),candidateState:stateOf(candidateResult),retrospectives:knownRecords(retrospectiveResult),learningState:stateOf(retrospectiveResult),revenue:revenueState==="KNOWN"?revenueResult.value.data:[],revenueState,operational:operationalResult.status==="fulfilled"?operationalResult.value:{objects:[],timeline:[]},operationalState:stateOf(operationalResult)};
}

export function buildTodayActions(context){
  const actions=[],candidates=context.revenueCandidates||[],retrospectives=context.retrospectives||[];
  for(const item of operationalAttention(context.operational?.objects||[]).slice(0,5))actions.push({id:`operational:${item.id}`,title:item.title,reason:`${item.computed_attention}${item.due_at?` / ${new Date(item.due_at).toLocaleString("ja-JP")}`:""}`,path:item.details?.intent==="AFFILIATE_CANDIDATE"?"/affiliate-intelligence":item.details?.intent==="CONTENT_IDEA"?"/content":"/note"});
  for(const record of context.content.filter(item=>item.payload?.status==="DRAFT"))actions.push({id:`content:${record.id}`,title:record.title||"Threads下書き",reason:"保存済みの下書きが未完了です",path:"/content"});
  for(const record of context.opportunities.filter(item=>["EVALUATING","APPLYING","APPLIED"].includes(item.payload?.status)))actions.push({id:`opportunity:${record.id}`,title:record.title||"案件",reason:`案件の状態が「${{EVALUATING:"検討中",APPLYING:"応募準備中",APPLIED:"応募済み"}[record.payload.status]}」です`,path:"/opportunities"});
  for(const record of context.opportunities.filter(item=>item.payload?.status==="WON"&&item.payload?.active_work?.state==="ACTIVE"&&!candidates.some(candidate=>candidate.payload?.source_work_id===item.id)))actions.push({id:`work-revenue:${record.id}`,title:`${record.title||"受注した仕事"}の売上候補を記録`,reason:"進行中の仕事に売上情報がまだありません。金額は自動推測しません",path:"/revenue"});
  for(const candidate of candidates.filter(item=>!retrospectives.some(retro=>retro.payload?.source_record_id===item.id)))actions.push({id:`learning:${candidate.id}`,title:`${candidate.title||"仕事"}の学びを残す`,reason:"売上候補があり、任意の振り返りをまだ記録していません",path:"/projects/retrospective"});
  for(const learning of retrospectives.filter(item=>item.payload?.repeat_next))actions.push({id:`apply-learning:${learning.id}`,title:`${learning.title||"過去の仕事"}の学びを次へ活かす`,reason:`本人が次も繰り返すと記録: ${learning.payload.repeat_next}`,path:"/opportunities"});
  if(context.revenueState==="UNKNOWN")actions.push({id:"revenue:unknown",title:"収益データを確認",reason:"Actual Revenueの状態を確認できていません。未確認を0円とは扱いません",path:"/revenue"});
  return actions.slice(0,10);
}
