import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createAssistantConversationRepository } from "../../repositories/assistantConversationRepository.js";
import { orchestrateAssistantRequest } from "../../services/assistantOrchestration.js";

const PROMPTS=["今日何をしたらいい？","この事業アイデアどう思う？","今月あと10万円増やすなら？","Threadsの投稿を作りたい","CrowdWorksの案件を評価して","提案資料を作りたい","収益を見る"];

export default function AssistantSecretary(){
  const navigate=useNavigate(),[params]=useSearchParams();
  const repository=useMemo(()=>createAssistantConversationRepository(),[]);
  const [input,setInput]=useState(params.get("prompt")||"");
  const [answer,setAnswer]=useState(null),[history,setHistory]=useState(repository.list());
  const submit=()=>{const text=input.trim();if(!text)return;const result=orchestrateAssistantRequest(text);repository.append({id:`u-${Date.now()}`,role:"user",text});repository.append({id:`a-${Date.now()}`,role:"assistant",text:`${result.title} ${result.message}`});setHistory(repository.list());setAnswer(result);setInput("")};
  const action=answer?.actions?.[0];
  return <div className="next-grid">
    <section className="next-card next-card--wide"><header><h2>何を相談しますか？</h2></header><div className="next-chat">
      {history.length?<div className="next-assistant-history" aria-label="この画面の会話履歴">{history.map(item=><p key={item.id} data-role={item.role}><b>{item.role==="user"?"あなた":"AI秘書"}</b> {item.text}</p>)}</div>:null}
      <label htmlFor="assistant-input">日本語で入力</label><textarea id="assistant-input" value={input} onChange={event=>setInput(event.target.value)} placeholder="例：Threadsの投稿を作りたい"/>
      <div className="next-actions"><button className="next-primary" onClick={submit}>相談を整理する</button><span className="next-state next-state--blocked">外部AI停止中・¥0</span></div>
    </div>{answer?<div className="next-answer" role="status"><b>{answer.title}</b><p>{answer.message}</p><small>無料の決定ルールによる案内です。AIが生成した回答ではありません。</small>{action?<button className="next-link" onClick={()=>navigate(action.path)}>{action.label}</button>:null}</div>:null}</section>
    <section className="next-card"><header><h2>よく使う相談</h2></header>{PROMPTS.map(prompt=><button className="next-prompt" key={prompt} onClick={()=>setInput(prompt)}>{prompt}</button>)}</section>
    <section className="next-card"><header><h2>現在のAI状態</h2></header><p><span className="next-state next-state--manual">安全なルーティング</span></p><p>会話履歴はこの画面だけのメモリに保持され、画面を閉じると消えます。他ユーザーへの共有や外部送信はありません。</p><p><b>実行:</b> ローカル判定のみ / Paid AI ¥0 / 外部自動実行なし</p></section>
  </div>;
}
