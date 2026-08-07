import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Card, EmptyState, LoadingState, PageHeader, SectionHeader } from "../design-system/index.js";
import { inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";
import { createCompanyCoreV3Repository } from "../repositories/companyCoreV3Repository.js";
import { createCompanyCoreRepository } from "../repositories/companyCoreRepository.js";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createCompanyCoreService } from "../services/companyCoreV3Services.js";
import { createRevenueEngineV3Service } from "../services/revenueEngineV3Service.js";
import { createAffiliateV2CommandCenterService } from "../services/affiliateV2CommandCenterService.js";
import { createBusinessIntelligenceV3Service } from "../services/businessIntelligenceV3Service.js";

const show=(value)=>typeof value==="number"?String(value):(value||"Unknown");
const count=(records,truthClass)=>truthClass==="Unknown"?"Unknown":String(records.length);

export default function CompanyCoreV3Workspace(props){
  return props.mode==="intelligence"?<BusinessIntelligenceWorkspace {...props}/>:<CompanyCoreWorkspace {...props}/>;
}

function CompanyCoreWorkspace({ownerSupabaseClient,ownerSession}){
  const location=useLocation();
  const service=useMemo(()=>createCompanyCoreService(createCompanyCoreV3Repository(ownerSupabaseClient)),[ownerSupabaseClient]);
  const [state,setState]=useState({status:"loading",organizations:[],businesses:[],teams:[]});
  useEffect(()=>{let active=true;(async()=>{try{
    const ctx=await inspectOwnerWorkspace(ownerSupabaseClient,ownerSession);
    if(!ctx.ok||ctx.status!=="ready")throw new Error("OWNER_WORKSPACE_REQUIRED");
    const organizationMatch=location.pathname.match(/^\/company-core\/organizations\/([^/]+)$/);
    const businessMatch=location.pathname.match(/^\/company-core\/businesses\/([^/]+)$/);
    let organizations,businesses,teams;
    if(organizationMatch){
      const organization=await service.getOrganizationById(ctx.workspace.id,decodeURIComponent(organizationMatch[1]));
      if(organization?.status==="Unavailable")throw new Error("MIGRATION_016_UNAVAILABLE");
      [businesses,teams]=await Promise.all([service.listBusinesses(ctx.workspace.id,{organizationId:organization?.id}),service.listTeams(ctx.workspace.id,{organizationId:organization?.id})]);
      organizations=organization?[organization]:[];
    }else if(businessMatch){
      const business=await service.getBusinessById(ctx.workspace.id,decodeURIComponent(businessMatch[1]));
      if(business?.status==="Unavailable")throw new Error("MIGRATION_016_UNAVAILABLE");
      teams=business?await service.listTeams(ctx.workspace.id,{businessId:business.id}):[];
      organizations=[];businesses=business?[business]:[];
    }else{
      [organizations,businesses,teams]=await Promise.all([service.listOrganizations(ctx.workspace.id),service.listBusinesses(ctx.workspace.id),service.listTeams(ctx.workspace.id)]);
    }
    if(active)setState({status:"ready",organizations,businesses,teams});
  }catch{if(active)setState({status:"unavailable",organizations:[],businesses:[],teams:[]});}})();return()=>{active=false}},[location.pathname,ownerSession,ownerSupabaseClient,service]);
  if(state.status==="loading")return <main className="content"><LoadingState title="Company Coreを読み込み中" message="Canonical authorityを確認しています。"/></main>;
  return <main className="content"><PageHeader eyebrow="V3 COMPANY CORE" title="Organization / Business / Team" description="保存済みcanonical stateのみを表示します。未取得値はUnknownです。" actions={<Badge label="External Execution: LOCKED"/>}/>{state.status==="unavailable"&&<EmptyState title="Migration 016 unavailable" message="Company Coreはfail-closedです。V1/V2 routesは継続利用できます。"/>}{state.status==="ready"&&<CompanyCoreSections state={state}/>}</main>;
}

function CompanyCoreSections({state}){
  return <><section><SectionHeader title="Organization health"/><div className="av2-card-grid">{state.organizations.map(x=><Card key={x.id}><h2>{x.name}</h2><p>Status: {x.status}</p><p>Currency: {x.defaultCurrency}</p></Card>)}{!state.organizations.length&&<EmptyState title="Organizationは未登録です" message="Protected server boundaryからOwnerが登録します。"/>}</div></section><section><SectionHeader title="Business health"/><div className="av2-card-grid">{state.businesses.map(x=><Card key={x.id}><h2>{x.name}</h2><p>Type: {x.businessType}</p><p>Profitability: {x.profitabilityStatus}</p></Card>)}{!state.businesses.length&&<EmptyState title="Businessは未登録です" message="値を推測またはゼロ補完しません。"/>}</div></section><section><SectionHeader title="Teams"/><div className="av2-card-grid">{state.teams.map(x=><Card key={x.id}><h2>{x.name}</h2><p>Status: {x.membershipStatus}</p></Card>)}{!state.teams.length&&<EmptyState title="Teamは未登録です" message="Roleとpermissionはfail-closedです。"/>}</div></section></>;
}

function BusinessIntelligenceWorkspace({ownerSupabaseClient,ownerSession}){
  const service=useMemo(()=>createBusinessIntelligenceV3Service({
    companyCoreRepository:createCompanyCoreRepository(ownerSupabaseClient),
    revenueEngineService:createRevenueEngineV3Service(createRevenueRepository(ownerSupabaseClient)),
    affiliateService:createAffiliateV2CommandCenterService(ownerSupabaseClient),
  }),[ownerSupabaseClient]);
  const [state,setState]=useState({status:"loading",model:null});
  useEffect(()=>{let active=true;(async()=>{try{
    const ctx=await inspectOwnerWorkspace(ownerSupabaseClient,ownerSession);
    if(!ctx.ok||ctx.status!=="ready")throw new Error("OWNER_WORKSPACE_REQUIRED");
    const model=await service.read(ctx.workspace.id);
    if(active)setState({status:model.partial?"partial":"ready",model});
  }catch{if(active)setState({status:"error",model:null});}})();return()=>{active=false}},[ownerSession,ownerSupabaseClient,service]);
  if(state.status==="loading")return <main className="content"><LoadingState title="Business Intelligenceを読み込み中" message="Canonical projectionsを確認しています。"/></main>;
  if(state.status==="error")return <main className="content"><PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Executive Dashboard" actions={<Badge label="External Execution: LOCKED"/>}/><EmptyState title="Business Intelligence unavailable" message="安全に読み取れませんでした。値は推測しません。"/></main>;
  const model=state.model,actual=model.executiveDashboard.actual,revenueAvailable=model.availability.revenue==="available";
  return <main className="content"><PageHeader eyebrow="BUSINESS INTELLIGENCE" title="Executive Dashboard" description="Actual・Forecast・Inference・Unknownを分離したservice-backed projectionです。" actions={<Badge label="External Execution: LOCKED"/>}/>{state.status==="partial"&&<p role="status" className="av2-boundary">一部のcanonical sourceは利用できません。利用不能値はUnknownです。</p>}{model.digitalTwin.migrationUnavailable&&<EmptyState title="Migration 016 unavailable" message="Organization / Business healthはfail-closedでUnknownです。既存canonical projectionsのみ表示します。"/>}<section><SectionHeader title="Organization / Business health"/><div className="av2-card-grid"><Card><h2>Organizations</h2><p>{count(model.organizationHealth.records,model.organizationHealth.truthClass)}</p><Badge label={model.organizationHealth.truthClass}/></Card><Card><h2>Businesses</h2><p>{count(model.businessHealth.records,model.businessHealth.truthClass)}</p><Badge label={model.businessHealth.truthClass}/></Card></div></section><section><SectionHeader title="Actual Revenue / Cost"/><p className="av2-boundary">ForecastとActualは合算しません。Unknownはゼロに変換しません。</p><dl className="av2-data-grid"><div><dt>Actual Revenue</dt><dd>{show(actual.actualRevenue)}</dd></div><div><dt>Actual Cost</dt><dd>{show(actual.actualCost)}</dd></div><div><dt>Net Profit</dt><dd>{show(actual.netProfit)}</dd></div><div><dt>ROI</dt><dd>{show(actual.roi)}</dd></div><div><dt>Forecast records</dt><dd>{revenueAvailable?model.executiveDashboard.forecast.length:"Unknown"}</dd></div></dl></section><section><SectionHeader title="Owner queues"/><dl className="av2-data-grid"><div><dt>Approval queue</dt><dd>{revenueAvailable?model.commandCenter.approvalQueue.length:"Unknown"}</dd></div><div><dt>Execution queue</dt><dd>{revenueAvailable?model.commandCenter.executionQueue.length:"Unknown"}</dd></div><div><dt>Evidence queue</dt><dd>{revenueAvailable?model.commandCenter.evidenceQueue.length:"Unknown"}</dd></div><div><dt>Operational blockers</dt><dd>{model.operationalBlockers.length}</dd></div></dl></section><section><SectionHeader title="Opportunity / Risk"/><div className="av2-card-grid">{model.opportunityRadar.map((item,index)=><Card key={item.id||index}><h2>{item.title||item.name||"Opportunity"}</h2><Badge label={item.truth_class||item.truthClass||"Inference"}/></Card>)}{!model.opportunityRadar.length&&<EmptyState title="OpportunityはUnknownです"/>}{model.riskRadar.map((item,index)=><Card key={item.id||index}><h2>{item.summary||item.title||"Risk"}</h2><Badge label={item.severity||"Unknown"}/></Card>)}</div></section><section><SectionHeader title="AI Workforce / Capability"/><div className="av2-card-grid">{model.aiWorkforce.map((item,index)=><Card key={index}><h2>{item.role}</h2><p>Maturity: {item.maturity}</p><Badge label="External Execution: LOCKED"/></Card>)}{!model.aiWorkforce.length&&<EmptyState title="AI Employee stateはUnknownです"/>}</div></section><section><SectionHeader title="Knowledge / Learning growth"/><p>{model.businessMemory.length||"Unknown"}</p><p>Capability records: {model.capabilityMap.length||"Unknown"}</p></section></main>;
}
