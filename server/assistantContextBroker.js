const blocked=/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|authorization|secret|credential)\b/i;
const safe=(value,max=300)=>{const text=String(value??"").replace(/\s+/g," ").trim();return blocked.test(text)?"[REDACTED]":text.slice(0,max)};
const queryTerms=value=>safe(value,400).toLocaleLowerCase("ja-JP").split(/[\s、。,.!?！？/]+/).filter(term=>term.length>1).slice(0,12);
const relevance=(item,terms)=>{const text=[item.title,item.kind,item.state,item.attention].map(value=>safe(value).toLocaleLowerCase("ja-JP")).join(" ");return terms.reduce((score,term)=>score+(text.includes(term)?3:0),0)+(item.attention?2:0)+(item.dueAt?1:0)};

export function assembleLiveOperationalContext({query="",feature="assistant",operational=[],personal=[],affiliate=[]}={}){
  const items=[
    ...operational.map(row=>({kind:row.object_type,title:row.title,state:row.state,attention:row.attention_state,dueAt:row.due_at,truth:"OWNER_STATED",id:row.id})),
    ...personal.map(row=>({kind:row.record_type,title:row.title,state:row.lifecycle_status,truth:"OWNER_STATED",id:row.id})),
    ...affiliate.map(row=>({kind:"AFFILIATE",title:row.program_name,state:row.program_status,attention:row.next_action?"NEEDS_ATTENTION":null,dueAt:row.next_action_due_at,truth:"CANONICAL",id:row.id})),
  ];
  const terms=queryTerms(query),ranked=items.map(item=>({...item,score:relevance(item,terms)})).sort((a,b)=>b.score-a.score||String(b.dueAt||"").localeCompare(String(a.dueAt||""))).slice(0,16);
  const lines=ranked.map(item=>`- ${safe(item.kind,64)} | ${safe(item.title)} | state=${safe(item.state,64)||"UNKNOWN"} | attention=${safe(item.attention,64)||"NONE"} | due=${safe(item.dueAt,64)||"NONE"} | truth=${item.truth}`);
  return Object.freeze({feature:safe(feature,64),itemCount:ranked.length,text:[`Feature: ${safe(feature,64)}`,"Policy: minimal authorized metadata; AI output is NOT_EVIDENCE; Forecast is not Actual; External Execution LOCKED; Paid AI JPY 0.",`Relevant live operational records (${ranked.length}):`,...(lines.length?lines:["- none available"])].join("\n").slice(0,6000)});
}
