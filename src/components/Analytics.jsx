import { useEffect, useMemo, useState } from "react";
import TopBar from "./TopBar";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { mapCanonicalActualAnalytics } from "../domain/revenueAnalytics.js";
import { buildProfitByCurrency } from "../domain/offerOperations.js";

const money=(minor,currency="JPY")=>new Intl.NumberFormat("ja-JP",{style:"currency",currency}).format(Number(minor||0));
const laneLabel={service:"サービス",affiliate:"アフィリエイト",digital_product:"デジタル商品",media:"メディア"};

export default function Analytics({savedAt,ownerSupabaseClient}){
  const revenueRepository=useMemo(()=>createRevenueRepository(ownerSupabaseClient),[ownerSupabaseClient]);
  const operationsRepository=useMemo(()=>createOfferOperationsRepository(ownerSupabaseClient),[ownerSupabaseClient]);
  const [actual,setActual]=useState(()=>mapCanonicalActualAnalytics());const [profit,setProfit]=useState([]);const [error,setError]=useState("");
  useEffect(()=>{let active=true;(async()=>{try{const context=await revenueRepository.loadContext();const [revenue,operations]=await Promise.all([revenueRepository.loadSnapshot(context.workspace.id),operationsRepository.loadSnapshot(context.workspace.id)]);if(active){setActual(mapCanonicalActualAnalytics(revenue.revenue,revenue.campaigns,revenue.evidence));setProfit(buildProfitByCurrency({revenueRecords:revenue.revenue,costRecords:operations.costs}));}}catch{if(active)setError("Actual / Profitを取得できません。Owner SessionとMigration 009を確認してください。");}})();return()=>{active=false};},[revenueRepository,operationsRepository]);
  return <main className="content production-revenue"><TopBar savedAt={savedAt}/>
    <section className="production-hero"><div><span className="eyebrow">CANONICAL ACTUAL ANALYTICS</span><h1>Actual Revenue & Profit</h1><p>検証済みRevenue RecordとActual Operating Costだけを集計します。Mock、Forecast、Test、承認待ちEvidenceは含みません。</p></div><div className="boundary-card"><strong>ACTUAL SOURCE</strong><span>VERIFIED EVIDENCE ONLY</span><span className="lock-status">External Execution: LOCKED</span></div></section>
    {error&&<div className="production-alert danger">{error}</div>}
    <section className="production-kpis"><article><span>Actual gross</span><strong>{actual.rows.length?money(actual.grossMinor):"実績未登録"}</strong><small>検証済み売上総額</small></article><article><span>Revenue cost</span><strong>{actual.rows.length?money(actual.costMinor):"—"}</strong><small>Revenue Record内の原価</small></article><article><span>Actual net</span><strong>{actual.rows.length?money(actual.netMinor):"—"}</strong><small>Gross − Revenue cost</small></article><article><span>Last verified</span><strong>{actual.lastVerifiedAt?new Date(actual.lastVerifiedAt).toLocaleDateString("ja-JP"):"実績未登録"}</strong><small>Revenue Record作成日</small></article></section>
    <section className="production-panel featured"><div className="panel-heading"><div><span className="eyebrow">CANONICAL PROFIT</span><h2>通貨別・検証済み利益</h2></div><span className="mode-badge actual">ACTUAL ONLY</span></div>{!profit.length?<p className="empty-copy">実績未登録。¥0を売上確定とは表示しません。</p>:profit.map((row)=><div className="actual-row" key={row.currency}><div><strong>{row.currency}</strong><small>Verified gross − Revenue cost − Actual operating cost</small></div><div><span>売上 {money(row.grossMinor,row.currency)}</span><span>運用原価 {money(row.operatingCostMinor,row.currency)}</span><strong>利益 {money(row.netProfitMinor,row.currency)}</strong></div></div>)}</section>
    <section className="production-panel featured"><div className="panel-heading"><div><span className="eyebrow">VERIFIED RECORDS</span><h2>検証済み実績</h2></div><span className="mode-badge actual">PENDING除外</span></div>{!actual.rows.length?<p className="empty-copy">実績未登録です。Evidence登録とOwner承認が完了するまでActualには反映されません。</p>:actual.rows.map((row)=><div className="actual-row" key={row.id}><div><strong>{row.campaign}</strong><small>{laneLabel[row.lane]||"Revenue"} · {row.period} · {row.evidenceStatus}</small></div><div><span>売上 {money(row.grossMinor,row.currency)}</span><span>原価 {money(row.costMinor,row.currency)}</span><strong>純額 {money(row.netMinor,row.currency)}</strong><small>{new Date(row.verifiedAt).toLocaleDateString("ja-JP")}</small></div></div>)}</section>
  </main>;
}
