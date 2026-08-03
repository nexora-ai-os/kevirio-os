export const COMPANY_CYCLE_STAGES=Object.freeze([
  'opportunity','offer','market_intelligence','audience_intelligence','competitor_intelligence','trend_intelligence','strategy','planning','content','quality_review','owner_approval','schedule','manual_or_approved_execution','performance','evidence','verified_revenue','actual_cost','net_profit','learning','optimization','reallocation'
]);
export const REVENUE_ENGINE_TYPES=Object.freeze(['affiliate','media_advertising','sns_operations','owned_media','digital_products','service_client']);
export const TRUTH_CLASSES=Object.freeze(['Actual','Forecast','Mock','Unknown']);
export const COMPANY_CYCLE_STATUSES=Object.freeze(['not_started','ready','waiting','in_progress','blocked','awaiting_approval','manually_executed','evidence_pending','completed','failed','cancelled','unknown']);
export const MATURITY=Object.freeze(['Production','Conditional','Mock','Locked']);
export const AI_ORGANIZATION=Object.freeze({
  Executive:['strategy','operations','profit_cost','market_growth'],
  Intelligence:['market','competitor','trend','audience','keyword_seo','risk'],
  Production:['content_strategy','article','sns','video_script','creative','localization'],
  Operations:['google_operations','publishing','media_calendar','provider_operations','workflow_operations'],
  Performance:['analytics','revenue_verification','profit_optimization','business_memory'],
  Governance:['quality_assurance','compliance_disclosure','security_cost_monitoring','audit']
});
export const MINIMUM_OPERATIONAL_WORKFORCE=Object.freeze(['strategy_orchestration','market_intelligence','offer_analysis','content_strategy','article_production','sns_content_production','quality_risk_review','google_operations','publishing_preparation','analytics','revenue_evidence','profit_optimization']);
const CURRENCIES=/^[A-Z]{3}$/; const COUNTRY=/^[A-Z]{2}$/;
export function validateMarket(value={}){const errors=[];for(const key of ['country','countryCode','locale','language','currency','timezone'])if(!value[key])errors.push(`${key}_required`);if(value.countryCode&&!COUNTRY.test(value.countryCode))errors.push('countryCode_invalid');if(value.currency&&!CURRENCIES.test(value.currency))errors.push('currency_invalid');return {valid:errors.length===0,errors};}
export function validateRevenueEngine(value={}){const errors=[];for(const key of ['workspaceId','brandId','name','type','marketId','currency','status','maturity'])if(!value[key])errors.push(`${key}_required`);if(value.type&&!REVENUE_ENGINE_TYPES.includes(value.type))errors.push('type_invalid');if(value.currency&&!CURRENCIES.test(value.currency))errors.push('currency_invalid');if(value.maturity&&!MATURITY.includes(value.maturity))errors.push('maturity_invalid');return {valid:errors.length===0,errors};}
export function buildCompanyCycle({operation=null,approvals=[],evidence=[],revenue=[],costs=[],learnings=[],performance=[],dataAvailable=false}={}){
  const state=new Map(COMPANY_CYCLE_STAGES.map((id)=>[id,dataAvailable?'not_started':'unknown']));
  const complete=(id,condition)=>{if(condition)state.set(id,'completed');};
  const objectHasData=(value)=>Boolean(value&&typeof value==='object'&&Object.keys(value).length);
  if(operation){
    complete('opportunity',true);complete('offer',true);
    complete('market_intelligence',objectHasData(operation.intelligence_snapshot));
    complete('audience_intelligence',objectHasData(operation.audience_snapshot));
    complete('strategy',objectHasData(operation.strategy_snapshot));
    complete('planning',objectHasData(operation.schedule_snapshot));
    complete('content',objectHasData(operation.content_snapshot));
    if(state.get('quality_review')==='not_started')state.set('quality_review','unknown');
    const approval=approvals.find((item)=>item.id===operation.approval_request_id)||null;
    if(approval?.status==='approved')state.set('owner_approval','completed');
    else if(approval?.status==='pending')state.set('owner_approval','awaiting_approval');
    else if(approval?.status==='rejected')state.set('owner_approval','blocked');
    complete('schedule',objectHasData(operation.schedule_snapshot));
    if(operation.status==='manual_package_ready')state.set('manual_or_approved_execution','ready');
    if(performance.length){state.set('manual_or_approved_execution','manually_executed');state.set('performance','completed');}
    else if(operation.status==='performance_waiting')state.set('performance','waiting');
    if(evidence.length)state.set('evidence','completed');
    else if(performance.length)state.set('evidence','evidence_pending');
    complete('verified_revenue',revenue.length>0);
    const actualCosts=costs.filter((item)=>!item.value_type||item.value_type==='actual');
    complete('actual_cost',actualCosts.length>0);
    const revenueCurrencies=new Set(revenue.map((item)=>item.currency).filter(Boolean));
    const hasComparableCost=actualCosts.some((item)=>revenueCurrencies.has(item.currency));
    if(revenue.length&&hasComparableCost)state.set('net_profit','completed');
    else if(revenue.length||actualCosts.length)state.set('net_profit','waiting');
    complete('learning',learnings.length>0);
    if(learnings.length){state.set('optimization','ready');state.set('reallocation','ready');}
  }
  return COMPANY_CYCLE_STAGES.map((id,index)=>({id,order:index+1,state:state.get(id)}));
}
export function groupProfitByCurrency({revenue=[],costs=[]}={}){const values=new Map();for(const row of revenue){if(row.truth_class&&row.truth_class!=='Actual')continue;const c=row.currency;if(!CURRENCIES.test(c||''))continue;const v=values.get(c)||{currency:c,revenueMinor:0,costMinor:0};v.revenueMinor+=Number(row.net_amount_minor??row.amount_minor??0);values.set(c,v);}for(const row of costs){const c=row.currency;if(!CURRENCIES.test(c||''))continue;const v=values.get(c)||{currency:c,revenueMinor:0,costMinor:0};v.costMinor+=Number(row.amount_minor??0);values.set(c,v);}return [...values.values()].map(v=>({...v,netProfitMinor:v.revenueMinor-v.costMinor}));}
export function prioritizeOwnerDecisions(items=[]){return [...items].filter(x=>x.status==='pending').sort((a,b)=>(Number(b.profitImpactMinor||0)-Number(a.profitImpactMinor||0))||(new Date(a.deadline||8640000000000000)-new Date(b.deadline||8640000000000000)));}
export function createBusinessMemoryCandidate(input={}){if(!input.workspaceId||!input.sourceType||!input.sourceId||!input.statement||!input.evidenceStatus)return {ok:false,reasonCode:'MEMORY_CONTRACT_INVALID'};if(input.evidenceStatus!=='verified')return {ok:false,reasonCode:'VERIFIED_EVIDENCE_REQUIRED'};return {ok:true,memory:{...input,status:'candidate',truthClass:'Actual',externalExecution:false}};}
export function deriveExecutiveKpis({profitByCurrency=[],customers=null,adSpendMinor=null,attributedRevenueMinor=null,acquisitionCostMinor=null,lifetimeValueMinor=null}={}){return {profitByCurrency,roi:null,roas:adSpendMinor>0&&Number.isFinite(attributedRevenueMinor)?attributedRevenueMinor/adSpendMinor:null,cac:customers>0&&Number.isFinite(acquisitionCostMinor)?acquisitionCostMinor/customers:null,ltv:Number.isFinite(lifetimeValueMinor)?lifetimeValueMinor:null,contributionMargin:null};}
