const MAX_MESSAGES=50;
export function createAssistantConversationRepository({storage=null,key="kevirio.assistant.private-session"}={}) { const memory=[]; const read=()=>{if(!storage)return [...memory];try{const value=JSON.parse(storage.getItem(key)||"[]");return Array.isArray(value)?value.slice(-MAX_MESSAGES):[]}catch{return []}}; const write=(messages)=>{const next=messages.slice(-MAX_MESSAGES);if(!storage){memory.splice(0,memory.length,...next);return}try{storage.setItem(key,JSON.stringify(next))}catch{/* Optional session persistence fails closed. */}}; return Object.freeze({list:read,append(message){const safe={id:String(message.id),role:message.role==="user"?"user":"assistant",text:String(message.text||"").slice(0,4000),createdAt:message.createdAt||new Date().toISOString()};write([...read(),safe]);return safe},clear(){write([])},persistence:storage?"private-session":"memory-only"}); }

const THREAD_COLUMNS="id,title,status,rolling_summary,summary_message_sequence,next_message_sequence,version,last_message_at,created_at,updated_at";
const MESSAGE_COLUMNS="id,thread_id,sequence,role,content_text,truth_class,evidence_status,provider,model,paid_cost_jpy,external_execution,created_at";
export function createPersistentAssistantRepository(client){
  if(!client?.from||!client?.rpc)throw new Error("assistant_repository_unavailable");
  return Object.freeze({
    async listThreads({includeArchived=false}={}){let query=client.from("ai_conversation_threads").select(THREAD_COLUMNS).order("last_message_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).limit(50);if(!includeArchived)query=query.eq("status","ACTIVE");const{data,error}=await query;if(error)throw error;return data||[]},
    async listMessages(threadId){const{data,error}=await client.from("ai_conversation_messages").select(MESSAGE_COLUMNS).eq("thread_id",threadId).order("sequence",{ascending:true}).limit(200);if(error)throw error;return data||[]},
    async createThread(title){const{data,error}=await client.rpc("create_ai_conversation_thread",{p_title:String(title||"新しい会話").slice(0,200),p_client_request_id:crypto.randomUUID()});if(error)throw error;return data},
    async appendUserMessage(threadId,content,clientMessageId=crypto.randomUUID()){const{data,error}=await client.rpc("append_ai_user_message",{p_thread_id:threadId,p_client_message_id:clientMessageId,p_content:content});if(error)throw error;const row=Array.isArray(data)?data[0]:data;return{...row,clientMessageId}},
    async archiveThread(threadId,expectedVersion){const{data,error}=await client.rpc("archive_ai_conversation_thread",{p_thread_id:threadId,p_expected_version:expectedVersion});if(error)throw error;return data},
  })
}
