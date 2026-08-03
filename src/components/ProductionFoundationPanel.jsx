import { useEffect,useMemo,useRef,useState } from "react";
import { bootstrapOwnerWorkspace,inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";

const LABELS={checking:"確認中",not_initialized:"初期化が必要",ready:"検証済み",loading:"初期化中",success:"初期化済み",already_exists:"初期化済み",failure:"確認失敗"};

export default function ProductionFoundationPanel({ownerSession,ownerSupabaseClient}){
  const [remote,setRemote]=useState({status:"checking",migrationStatus:"checking",workspace:null,brand:null});const inFlight=useRef(false);
  useEffect(()=>{let active=true;setRemote({status:"checking",migrationStatus:"checking",workspace:null,brand:null});inspectOwnerWorkspace(ownerSupabaseClient,ownerSession).then((result)=>{if(active)setRemote(result.ok?result:{...result,migrationStatus:"not_verified",workspace:null,brand:null});});return()=>{active=false};},[ownerSession,ownerSupabaseClient]);
  const initialize=async()=>{if(inFlight.current||["ready","already_exists"].includes(remote.status))return;inFlight.current=true;setRemote((v)=>({...v,status:"loading"}));const result=await bootstrapOwnerWorkspace(ownerSupabaseClient,ownerSession);setRemote(result.ok?result:{...result,migrationStatus:remote.migrationStatus,workspace:null,brand:null});inFlight.current=false;};
  const display=useMemo(()=>({workspaceName:remote.workspace?.name||"KEVIRIO Owner Workspace",brandName:remote.brand?.name||"KEVIRIO",workspaceStatus:LABELS[remote.status]||LABELS.failure,migrationStatus:remote.migrationStatus==="verified"?"検証済み":remote.migrationStatus==="checking"?"確認中":"未検証"}),[remote]);
  const items=[["ワークスペース / Brand",`${display.workspaceName} / ${display.brandName}`,display.workspaceStatus],["正規データソース","Supabase canonical repository",display.migrationStatus],["実績売上","Evidence検証済みのみ","実績のみ"],["外部実行","手動Copy / Downloadのみ","ロック中"],["Security","Owner認証 / Workspace RLS","適用中"],["APIコスト","制限付きOpenAI Sandbox","サーバー上限あり"]];
  const canInitialize=ownerSession?.user?.id&&remote.status==="not_initialized";
  return <details className="kv-technical-details production-foundation-panel"><summary>システム境界の詳細</summary><div className="kv-technical-details__body"><section aria-labelledby="production-foundation-title"><div className="section-head"><div><p className="eyebrow">PRODUCTION FOUNDATION</p><h2 id="production-foundation-title">Owner制御状態</h2></div><span className="status-badge">{ownerSession?.user?.id?"OWNER確認済み":"ロック中"}</span></div><div className="metric-grid">{items.map(([label,value,status])=><article className="metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{status}</small></article>)}</div>
    {canInitialize&&<button type="button" onClick={initialize} disabled={inFlight.current||remote.status==="loading"}>Owner Workspaceを初期化</button>}
    {remote.status==="loading"&&<p role="status">Owner Workspaceを安全に初期化しています。</p>}{remote.status==="success"&&<p role="status">Workspace、Owner membership、KEVIRIO Brandを確認しました。</p>}{remote.status==="already_exists"&&<p role="status">Owner Workspaceは初期化済みです。</p>}{remote.status==="failure"&&<p role="alert">Remote状態を確認できません。通信状態を確認して再取得してください。</p>}
    <p>Mock、Forecast、Actualは別Domainです。外部送信、公開、課金、Deploymentは有効化されていません。</p></section></div></details>;
}
