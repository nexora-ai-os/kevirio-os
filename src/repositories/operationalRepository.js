const requireClient=client=>{if(!client)throw new Error("supabase_client_required");return client};
const trim=(value,max)=>String(value??"").trim().slice(0,max);

export const CAPTURE_INTENTS=Object.freeze(["IDEA","TASK","MEMO","IMPROVEMENT","AFFILIATE_CANDIDATE","CONTENT_IDEA","WORK_OPPORTUNITY","RESEARCH_REQUEST"]);
export const ATTENTION_STATES=Object.freeze(["DUE","OVERDUE","NEEDS_ATTENTION","BLOCKED","FOLLOW_UP","OPPORTUNITY","WAITING","READY"]);

export function normalizeCapture(input={}){
  const intent=CAPTURE_INTENTS.includes(input.intent)?input.intent:"MEMO",title=trim(input.title,300),summary=trim(input.summary,4000);
  if(!title)throw new Error("capture_title_required");
  const attentionState=input.attentionState&&ATTENTION_STATES.includes(input.attentionState)?input.attentionState:null;
  const dueAt=input.dueAt?new Date(input.dueAt).toISOString():null;
  return Object.freeze({intent,title,summary,attentionState,dueAt,details:{intent,body:summary,source:"OWNER_QUICK_CAPTURE",external_execution:"LOCKED",paid_ai_jpy:0}});
}

export async function listOperationalObjects(client,{limit=100}={}){
  const{data,error}=await requireClient(client).from("operational_objects").select("id,object_type,title,summary,state,attention_state,due_at,details,truth_class,lifecycle_status,version,created_at,updated_at").neq("lifecycle_status","ARCHIVED").order("updated_at",{ascending:false}).limit(Math.min(Math.max(limit,1),200));
  if(error)throw error;return data||[];
}

export async function listOperationalTimeline(client,{limit=60}={}){
  const{data,error}=await requireClient(client).from("operational_activity_events").select("id,object_type,object_id,event_type,actor_type,truth_class,safe_metadata,created_at").order("created_at",{ascending:false}).limit(Math.min(Math.max(limit,1),100));
  if(error)throw error;return data||[];
}

export async function saveOperationalObject(client,input={}){
  const normalized=normalizeCapture(input);
  const{data,error}=await requireClient(client).rpc("save_operational_object",{p_object_id:input.id||null,p_object_type:input.objectType||"QUICK_CAPTURE",p_title:normalized.title,p_summary:normalized.summary||null,p_state:input.state||"CAPTURED",p_attention_state:normalized.attentionState,p_due_at:normalized.dueAt,p_details:{...normalized.details,...(input.details||{})},p_truth_class:input.truthClass||"OWNER_STATED",p_expected_version:input.id?input.expectedVersion:null});
  if(error)throw error;return Array.isArray(data)?data[0]:data;
}

export async function saveOperationalDraft(client,{objectId,expectedDraftVersion=1,baseObjectVersion,payload,deviceHint=null}){
  const{data,error}=await requireClient(client).rpc("save_operational_draft",{p_object_id:objectId,p_expected_draft_version:expectedDraftVersion,p_base_object_version:baseObjectVersion,p_payload:payload,p_device_hint:trim(deviceHint,80)||null});if(error)throw error;return data;
}

export async function archiveOperationalObject(client,{id,version}){const{data,error}=await requireClient(client).rpc("archive_operational_object",{p_object_id:id,p_expected_version:version});if(error)throw error;return data}

export async function listInternalActions(client,{limit=50}={}){const{data,error}=await requireClient(client).from("internal_action_records").select("id,employee_id,target_type,target_id,action_type,autonomy_level,risk_class,status,result_summary,result_truth_class,version,created_at,updated_at").order("updated_at",{ascending:false}).limit(Math.min(Math.max(limit,1),100));if(error)throw error;return data||[]}

export async function prepareInternalAction(client,{employeeId,targetType="QUICK_CAPTURE",targetId=null,actionType,autonomyLevel="L2_PREPARE",description}){const idempotencyKey=`owner:${employeeId}:${globalThis.crypto?.randomUUID?.()||Date.now()}`;const{data,error}=await requireClient(client).rpc("prepare_internal_action",{p_employee_id:trim(employeeId,80),p_target_type:targetType,p_target_id:targetId,p_action_type:actionType,p_autonomy_level:autonomyLevel,p_risk_class:"LOW",p_policy_approval:"AUTO_LOW_RISK",p_payload:{idempotency_key:idempotencyKey,description:trim(description,4000),external_execution:"LOCKED",paid_ai_jpy:0}});if(error)throw error;return data}

export async function loadOperationalCommandContext(client){const[objects,timeline]=await Promise.all([listOperationalObjects(client),listOperationalTimeline(client)]);return{objects,timeline}}

export function searchOperationalContext(objects,query){const q=trim(query,120).toLocaleLowerCase("ja-JP");if(!q)return[];return(objects||[]).filter(item=>[item.title,item.summary,item.details?.body,item.details?.intent,item.object_type,item.attention_state].some(value=>String(value||"").toLocaleLowerCase("ja-JP").includes(q))).slice(0,30)}

export function operationalAttention(objects,now=new Date()){
  const time=now.getTime();return(objects||[]).filter(item=>item.lifecycle_status!=="ARCHIVED").map(item=>{const due=item.due_at?new Date(item.due_at).getTime():null;const computed=due!==null&&due<time?"OVERDUE":item.attention_state;return{...item,computed_attention:computed}}).filter(item=>item.computed_attention).sort((a,b)=>{const rank={OVERDUE:0,BLOCKED:1,DUE:2,NEEDS_ATTENTION:3,FOLLOW_UP:4,OPPORTUNITY:5,WAITING:6,READY:7};return(rank[a.computed_attention]??9)-(rank[b.computed_attention]??9)||(new Date(b.updated_at)-new Date(a.updated_at))})
}
