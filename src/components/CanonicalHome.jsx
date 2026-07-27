import { useCallback,useEffect,useMemo,useState } from "react";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { buildCanonicalRevenueOverview } from "../domain/canonicalRevenueOverview.js";
import { buildProfitByCurrency,nextOperationAction } from "../domain/offerOperations.js";
import ProductionFoundationPanel from "./ProductionFoundationPanel.jsx";

const money=(minor,currency="JPY")=>new Intl.NumberFormat("ja-JP",{style:"currency",currency}).format(Number(minor||0));
const operationLabel={owner_artifact_approval:"Content承認待ち",manual_package_ready:"手動実行準備完了",performance_waiting:"Performance待ち",learning_ready:"Learning確認待ち",closed:"完了"};
const readinessLabel={authorization_required:"Owner認証が必要",credentials_missing:"認証情報未設定",dry_run_ready:"手動実行準備完了",production_ready:"本番準備完了",owner_locked:"Ownerロック",adapter_unavailable:"未対応",configuration_incomplete:"設定未完了",permission_missing:"権限不足",error:"エラー"};

export default function CanonicalHome({ownerSession,ownerSupabaseClient,setPage}){
  const revenueRepository=useMemo(()=>createRevenueRepository(ownerSupabaseClient),[ownerSupabaseClient]);
  const operationsRepository=useMemo(()=>createOfferOperationsRepository(ownerSupabaseClient),[ownerSupabaseClient]);
  const [state,setState]=useState(null);const [error,setError]=useState("");
  const refresh=useCallback(async()=>{try{const context=await revenueRepository.loadContext(ownerSession);const [revenue,operations]=await Promise.all([revenueRepository.loadSnapshot(context.workspace.id),operationsRepository.loadSnapshot(context.workspace.id)]);setState({revenue,operations,overview:buildCanonicalRevenueOverview(revenue),profits:buildProfitByCurrency({revenueRecords:revenue.revenue,costRecords:operations.costs})});setError("");}catch{setError("Canonical Supabase状態を取得できません。Migration 009とOwner Sessionを確認してください。");}},[revenueRepository,operationsRepository,ownerSession]);
  useEffect(()=>{refresh();},[refresh]);
  const operation=state?.operations.operations?.[0]||null;const next=operation?{title:"Offer Operationを進める",reason:nextOperationAction(operation),page:"campaign"}:state?.overview.nextAction;
  return <main className="content production-revenue canonical-home"><ProductionFoundationPanel ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient}/>
    <section className="production-hero"><div><span className="eyebrow">OWNER CONTROL PLANE</span><h1>今日進めるべきRevenue Action</h1><p>Offer、Approval、Execution Package、Evidence、Actual、Profitを同じSupabase Workspaceから復元しています。</p></div><div className="boundary-card"><span>NEXT OWNER ACTION</span><strong>{next?.title||"Remote状態を確認中"}</strong><p>{next?.reason||"読み込み後に表示します。"}</p><button disabled={!next} onClick={()=>setPage(next.page)}>対象画面を開く</button></div></section>
    {error&&<p className="production-alert danger">{error}</p>}
    <section className="production-kpis"><article><span>Offer</span><strong>{state?.operations.offers.length??"—"}</strong></article><article><span>Operation</span><strong>{state?.operations.operations.length??"—"}</strong></article><article><span>Owner承認待ち</span><strong>{state?.overview.pendingApprovals??"—"}</strong></article><article><span>Actual Revenue</span><strong>{state?.overview.revenueRecordCount?money(state.overview.netActualMinor):"実績未登録"}</strong></article></section>
    <section className="production-grid"><article className="production-panel"><div className="panel-heading"><div><span className="eyebrow">CANONICAL WORKFLOW</span><h2>現在の運用Step</h2></div><button className="text-button" onClick={refresh}>再取得</button></div>{operation?<><div className="workflow-row"><span>状態</span><strong>{operationLabel[operation.status]||operation.status}</strong><small>Reload復元済み</small></div><p className="evidence-boundary">{nextOperationAction(operation)}</p></>:<p className="empty-copy">Offer Operationは未登録です。</p>}<button className="production-secondary" onClick={()=>setPage("campaign")}>Offer Operationsへ</button></article>
      <article className="production-panel"><div className="panel-heading"><div><span className="eyebrow">ACTUAL PROFIT</span><h2>検証済み利益</h2></div><span className="mode-badge actual">ACTUAL ONLY</span></div>{!state?.profits.length?<p className="empty-copy">実績未登録。Forecast/Testは表示しません。</p>:state.profits.map((v)=><div className="actual-row" key={v.currency}><div><strong>{v.currency}</strong><small>Verified Revenue − Actual costs</small></div><strong>{money(v.netProfitMinor,v.currency)}</strong></div>)}<button className="production-secondary" onClick={()=>setPage("analytics")}>Analyticsへ</button></article>
      <article className="production-panel featured"><div className="panel-heading"><div><span className="eyebrow">CONNECTIONS / ALERTS</span><h2>Production安全状態</h2></div><span className="lock-chip">External Execution LOCKED</span></div><div className="connection-grid">{(state?.operations.connections||[]).map((v)=><div key={v.id}><strong>{v.provider}</strong><span>{readinessLabel[v.readiness]||v.readiness}</span><small>{v.external_execution_allowed?"実行可能":"外部実行なし"}</small></div>)}</div>{state?.operations.failures.length?<p className="production-alert danger">安全に停止したOperationが{state.operations.failures.length}件あります。Connections / Opsで確認してください。</p>:<p className="empty-copy">記録済みのOperation failureはありません。</p>}</article>
    </section>
  </main>;
}
