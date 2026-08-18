import { ASSISTANT_INTENTS, classifyAssistantIntent, normalizeAssistantInput } from "../domain/assistantIntent.js";

const ROUTES = Object.freeze({
  [ASSISTANT_INTENTS.TODAY]: ["/home?tab=今日","今日のホームを開く","今日の優先事項を確認しましょう","今日やること、要確認、進行中をホームで順番に確認できます。"],
  [ASSISTANT_INTENTS.BUSINESS_IDEA]: ["/goals?tab=戦略","目標・戦略を開く","事業アイデアを整理しましょう","対象顧客、解決する課題、提供価値、最小の検証方法を整理してください。外部AIによる評価は行っていません。"],
  [ASSISTANT_INTENTS.MONETIZATION]: ["/goals?tab=今月","今月の戦略を開く","収益化の選択肢を整理しましょう","目標額、期限、使える時間、既存顧客・商品を確認し、見込みを確定売上と分けて計画します。"],
  [ASSISTANT_INTENTS.THREADS_CONTENT]: ["/content?tab=SNS&platform=Threads","コンテンツ制作を開く","Threads投稿の下書きへ進めます","目的と伝えたい内容を入力すると、無料テンプレートで下書きを準備できます。"],
  [ASSISTANT_INTENTS.OPPORTUNITY_REVIEW]: ["/opportunities?tab=CrowdWorks","CrowdWorks案件を登録","案件情報を整理しましょう","案件を手動登録し、適合度、工数、利益、リスク、提案方針を確認できます。"],
  [ASSISTANT_INTENTS.REVENUE_REVIEW]: ["/revenue?tab=全体","収益管理を開く","収益状況を確認しましょう","確定売上、見込み、未入金、経費、利益を分けて確認します。未確認は0として扱いません。"],
  [ASSISTANT_INTENTS.PROPOSAL]: ["/outreach?tab=提案準備","応募・営業を開く","提案準備へ進めます","案件情報を基に、提案の目的、相手の課題、提供価値、次の行動を整理できます。"],
  [ASSISTANT_INTENTS.GENERAL]: ["/goals","目標・戦略を開く","相談内容を整理しましょう","現在は無料の決定ルールで相談先を案内します。目的、期限、望む結果を具体的にすると案内しやすくなります。"],
});

export function createAssistantContextEnvelope({requestingUserId=null,workspaceId=null,dataOwnerId=null,visibility="private",sharingPermission="none",role="OWNER",agentScope="assistant:routing",purpose="work_orchestration"}={}) { return Object.freeze({requestingUserId,workspaceId,dataOwnerId:dataOwnerId||requestingUserId,visibility,sharingPermission,role,agentScope,purpose}); }
export function canUseAssistantContext(context) { if(!context?.requestingUserId||!context?.workspaceId)return {allowed:false,reason:"CONTEXT_UNAVAILABLE"}; if(context.dataOwnerId!==context.requestingUserId&&context.sharingPermission!=="explicit")return {allowed:false,reason:"PRIVATE_DATA_DENIED"}; return {allowed:true,reason:"PRIVATE_CONTEXT_ALLOWED"}; }
export function orchestrateAssistantRequest(value,{context}={}) { const input=normalizeAssistantInput(value),intent=classifyAssistantIntent(input),access=context?canUseAssistantContext(context):{allowed:true,reason:"NO_CONTEXT_REQUESTED"}; if(!access.allowed)return Object.freeze({input,intent,status:"denied",message:"この相談に必要な情報への権限がありません。個人データは共有されません。",actions:[],execution:{provider:"none",paidAiCalls:0,externalExecution:false},access}); const [path,label,title,message]=ROUTES[intent]; return Object.freeze({input,intent,status:"routed",title,message,actions:[Object.freeze({id:`${intent}:primary`,type:"navigate",path,label})],execution:{provider:"deterministic-local",paidAiCalls:0,externalExecution:false},access}); }
