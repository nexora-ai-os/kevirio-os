const asArray=(value)=>Array.isArray(value)?value:[];
const unknownFinancials=()=>Object.freeze({actualRevenue:"Unknown",actualCost:"Unknown",netProfit:"Unknown",roi:"Unknown",truthClass:"Unknown"});

export function buildBusinessIntelligenceV3({companyCore,revenue,affiliate,aiEmployees,availability={}}={}) {
  const domains=companyCore?.domains||{};
  const programs=asArray(affiliate?.programs);
  const alerts=asArray(affiliate?.alerts);
  const actualFinancials=affiliate?.actualFinancials||unknownFinancials();
  const timeline=asArray(affiliate?.timeline).map((event)=>Object.freeze({
    timestamp:event.timestamp||null, source:event.source||null, actor:event.actor||null,
    evidence:event.evidence||null, truthClass:event.truthClass||"Unknown",
  }));
  const freshness=[...Object.values(domains).flatMap((domain)=>domain?.records||[]),...programs,...alerts].reduce((all,row)=>{const date=row.updated_at||row.created_at||row.updatedAt||row.createdAt;if(date)all.push(date);return all},[]).sort().at(-1)||null;
  const unavailable=Object.entries(availability).filter(([,status])=>status!=="available").map(([source])=>source);
  const operationalBlockers=Object.freeze([
    ...asArray(revenue?.operationalBlockers),
    ...unavailable.map((source)=>Object.freeze({source,status:"unavailable",truthClass:"Unknown"})),
  ]);
  return Object.freeze({
    organizationHealth:Object.freeze({records:Object.freeze(asArray(domains.organization?.records)),truthClass:domains.organization?.truthClass||"Unknown"}),
    businessHealth:Object.freeze({records:Object.freeze(asArray(domains.business?.records)),truthClass:domains.business?.truthClass||"Unknown"}),
    executiveDashboard:Object.freeze({actual:actualFinancials,forecast:Object.freeze(asArray(revenue?.forecast)),freshness}),
    commandCenter:Object.freeze({
      programs:Object.freeze(programs),
      approvalQueue:Object.freeze(asArray(revenue?.approvalQueue)),
      executionQueue:Object.freeze(asArray(revenue?.executionQueue)),
      evidenceQueue:Object.freeze(asArray(revenue?.evidenceQueue)),
      externalExecution:false,
    }),
    digitalTwin:Object.freeze({
      workspaceState:companyCore?.workspaceId?"available":"Unknown",
      domainStates:Object.fromEntries(Object.entries(domains).map(([key,value])=>[key,value.status])),
      freshness,
      truthClass:freshness?"Actual":"Unknown",
      migrationUnavailable:companyCore?.migrationUnavailable===true,
    }),
    aiWorkforce:Object.freeze(asArray(aiEmployees)),
    businessMemory:Object.freeze(asArray(domains.knowledge?.records)),
    knowledgeGraph:Object.freeze({nodes:Object.freeze(asArray(affiliate?.graph?.nodes)),edges:Object.freeze(asArray(affiliate?.graph?.edges)),projectionOnly:true}),
    opportunityRadar:Object.freeze(asArray(revenue?.opportunities).length?asArray(revenue.opportunities):asArray(affiliate?.opportunities)),
    riskRadar:Object.freeze(alerts),
    timeline:Object.freeze(timeline),
    capabilityMap:Object.freeze(asArray(domains.capability?.records)),
    operationalBlockers,
    availability:Object.freeze({...availability}),
    partial:unavailable.length>0,
    externalExecution:false,
  });
}

export function intelligenceHasNoFabricatedSuccess(model) {
  return !model.timeline.some((event)=>event.truthClass==="Actual"&&(!event.timestamp||!event.source||!event.evidence));
}
