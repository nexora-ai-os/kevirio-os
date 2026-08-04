import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createOfferOperationsRepository } from "../repositories/offerOperationsRepository.js";
import { createAffiliateIntelligenceRepository } from "../repositories/affiliateIntelligenceRepository.js";
import { PREPARATION_STEPS, deriveNextOwnerAction, normalizeAffiliateProgram, preparationProgress, validateAffiliateProgram } from "../domain/affiliateIntelligence.js";
import { Card, EmptyState, EnvironmentBadge, KpiCard, PageHeader, SectionHeader } from "../design-system/index.js";
import "./ProductionScreens.css";
import "./AffiliateIntelligence.css";

const initialProgram = normalizeAffiliateProgram({ currency: "JPY", commissionType: "percentage" });
const fieldLabels = {
  aspName: "ASP", advertiserName: "広告主", programName: "プログラム名", programCode: "プログラムID（任意）",
  officialProductUrl: "公式Product URL（任意）", advertiserProgramUrl: "Advertiser Program URL（任意）", aspManagementUrl: "ASP Management URL（任意・非公開参照）",
  commissionRate: "報酬率（%）", conversionConditions: "成果条件", rejectionConditions: "否認条件（任意）",
  listingRestrictions: "掲載禁止事項（任意）", disclosureRequirements: "広告開示要件", prohibitedClaims: "禁止表現",
  targetAudience: "対象Audience", claimPlan: "訴求案", plannedChannels: "予定Channel", evidencePlan: "Evidence収集計画",
};

function fromRow(row, offer) {
  if (!row) return normalizeAffiliateProgram({ advertiserName: offer?.advertiser, programName: offer?.title, currency: offer?.currency });
  return normalizeAffiliateProgram({
    aspName: row.asp_name, advertiserName: row.advertiser_name, programName: row.program_name, programCode: row.program_code,
    officialProductUrl: row.official_product_url, advertiserProgramUrl: row.advertiser_program_url, aspManagementUrl: row.asp_management_url,
    commissionType: row.commission_type, commissionRate: row.commission_rate, currency: row.currency,
    conversionConditions: row.conversion_conditions, rejectionConditions: row.rejection_conditions, listingRestrictions: row.listing_restrictions,
    disclosureRequirements: row.disclosure_requirements, prohibitedClaims: row.prohibited_claims, targetAudience: row.target_audience,
    claimPlan: row.claim_plan, plannedChannels: row.planned_channels, evidencePlan: row.evidence_plan, ownerConfirmed: row.owner_confirmed,
  });
}

function Field({ name, value, setValue, multiline = false, type = "text" }) {
  const control = multiline
    ? <textarea id={`affiliate-${name}`} value={value ?? ""} onChange={(event) => setValue(name, event.target.value)} />
    : <input id={`affiliate-${name}`} type={type} value={value ?? ""} onChange={(event) => setValue(name, event.target.value)} />;
  return <label htmlFor={`affiliate-${name}`}>{fieldLabels[name]}{control}</label>;
}

const detailTabs = ["概要","条件","規約・禁止事項","素材","コンテンツ","掲載","Evidence","成果","学習"];
function AffiliateProgramDetail({ program, offer, snapshot, activeTab, setActiveTab, navigate }) {
  const values = {
    "概要": [["ASP",program.asp_name],["広告主",program.advertiser_name],["Program",program.program_name],["Status",program.status]],
    "条件": [["Commission",program.commission_rate==null?"Unknown":`${program.commission_rate}% ${program.currency}`],["成果条件",program.conversion_conditions],["否認条件",program.rejection_conditions]],
    "規約・禁止事項": [["掲載制限",program.listing_restrictions],["開示",program.disclosure_requirements],["禁止表現",program.prohibited_claims]],
    "素材": [["登録数",snapshot.materials.filter((item)=>item.affiliate_program_id===program.id).length],["取扱", "Tracking URL / HTMLは公開表示しません"]],
    "コンテンツ": [["計画",program.claim_plan],["対象",program.target_audience]],
    "掲載": [["Channel",program.planned_channels],["登録数",snapshot.publications.filter((item)=>item.affiliate_program_id===program.id).length]],
    "Evidence": [["収集計画",program.evidence_plan],["正本","evidence_candidates"]],
    "成果": [["Actual records",snapshot.affiliatePerformance.filter((item)=>item.affiliate_program_id===program.id).length],["Actual Revenue正本","revenue_records"]],
    "学習": [["Truth class",program.truth_class || "Unknown"],["判定","Actual / Forecast / Inference / Unknownを分離"]],
  };
  return <main className="content kv-production-screen affiliate-intelligence"><PageHeader eyebrow="AFFILIATE PROGRAM" title={program.program_name} description={`${program.asp_name} · ${program.advertiser_name}`} actions={<EnvironmentBadge environment="locked" />} />
    <button className="production-secondary" onClick={()=>navigate("/affiliate-intelligence")}>← 案件一覧へ</button>
    <Card variant="decision"><strong>External Execution: LOCKED</strong><p>Owner Manual Executionのみ。Provider自動操作はありません。</p></Card>
    <div className="affiliate-detail-tabs" role="tablist" aria-label="Affiliate案件詳細">{detailTabs.map((tab)=><button key={tab} role="tab" aria-selected={activeTab===tab} onClick={()=>setActiveTab(tab)}>{tab}</button>)}</div>
    <Card role="tabpanel"><SectionHeader title={activeTab} description={offer?.title} />{values[activeTab].map(([label,value])=><div className="workflow-row" key={label}><span>{label}</span><strong>{value || "Unknown"}</strong></div>)}
      {activeTab==="概要"&&<button className="production-primary" onClick={()=>navigate(`/operations/offers/${offer.id}/preparation`)}>運用準備を編集</button>}
    </Card>
  </main>;
}

export default function AffiliateIntelligenceWorkspace({ ownerSupabaseClient, ownerSession }) {
  const navigate = useNavigate();
  const location = useLocation();
  const operationsRepository = useMemo(() => createOfferOperationsRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const repository = useMemo(() => createAffiliateIntelligenceRepository(ownerSupabaseClient), [ownerSupabaseClient]);
  const [snapshot, setSnapshot] = useState(null);
  const [context, setContext] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialProgram);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [detailTab, setDetailTab] = useState("概要");
  const match = location.pathname.match(/^\/operations\/offers\/([^/]+)\/preparation$/);
  const offerId = match?.[1] || null;
  const programMatch = location.pathname.match(/^\/affiliate-intelligence\/([^/]+)$/);
  const programId = programMatch?.[1] || null;

  const refresh = useCallback(async () => {
    try {
      const nextContext = await operationsRepository.loadContext(ownerSession);
      const nextSnapshot = await operationsRepository.loadSnapshot(nextContext.workspace.id);
      setContext(nextContext); setSnapshot(nextSnapshot); setError("");
      if (offerId) {
        const offer = nextSnapshot.offers.find((item) => item.id === offerId);
        if (!offer) throw new Error("OFFER_NOT_FOUND");
        const program = nextSnapshot.programs.find((item) => item.offer_id === offerId);
        setForm(fromRow(program, offer)); setStep(Math.max(0, Math.min(9, (program?.preparation_step || 1) - 1)));
      }
    } catch { setError("Affiliate Intelligenceを取得できませんでした。Owner権限とMigration 014の適用状態を確認してください。"); }
  }, [offerId, operationsRepository, ownerSession]);
  useEffect(() => { refresh(); }, [refresh]);

  const setValue = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const offer = snapshot?.offers.find((item) => item.id === offerId);
  const program = snapshot?.programs.find((item) => item.offer_id === offerId);
  const operation = snapshot?.operations.find((item) => item.offer_id === offerId);
  const nextAction = snapshot ? deriveNextOwnerAction(snapshot) : null;

  const save = async (targetStep, complete = false) => {
    const checked = validateAffiliateProgram(form, complete ? 8 : Math.max(0, targetStep - 1));
    if (!checked.valid) {
      setError(checked.errors[0] || `${checked.missing[0]?.label}の必須項目を入力してください。`);
      return false;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      await repository.saveProgram(offerId, checked.normalized, targetStep + 1, `affiliate-program:${offerId}:v1`);
      if (complete && !operation) await operationsRepository.prepareOperation(offerId, `operation:${offerId}:v1`);
      setNotice(complete ? "運用準備を完了し、Owner承認待ちへ進みました。" : "Draftを保存しました。");
      await refresh(); return true;
    } catch { setError("保存を安全に停止しました。Migration 014、必須項目、Workspace境界を確認してください。"); return false; }
    finally { setBusy(false); }
  };

  if (programId && snapshot) {
    const detailProgram=snapshot.programs.find((item)=>item.id===programId);
    const detailOffer=snapshot.offers.find((item)=>item.id===detailProgram?.offer_id);
    if (detailProgram&&detailOffer) return <AffiliateProgramDetail program={detailProgram} offer={detailOffer} snapshot={snapshot} activeTab={detailTab} setActiveTab={setDetailTab} navigate={navigate}/>;
  }

  if (!offerId) return <main className="content kv-production-screen affiliate-intelligence">
    <PageHeader eyebrow="AFFILIATE INTELLIGENCE" title="アフィリエイト案件管理" description="OfferからManual Execution、Evidence、Actual、Learningまでを一つの運用境界で管理します。" actions={<EnvironmentBadge environment={context ? "production" : "locked"} />} />
    <Card variant="decision"><strong>External Execution: LOCKED</strong><p>A8.netへのログイン、スクレイピング、投稿、外部送信は実行しません。</p></Card>
    {error && <p className="production-alert danger" role="alert">{error}</p>}
    <section className="kv-kpi-grid" aria-label="Affiliate summary"><KpiCard label="Programs" value={snapshot?.programs.length ?? null} state="actual" /><KpiCard label="Publications" value={snapshot?.publications.length ?? null} state="actual" /><KpiCard label="Conversions" value={snapshot?.affiliatePerformance.reduce((sum, item) => sum + Number(item.conversions || 0), 0) ?? null} state="actual" /><KpiCard label="Next Action" value={nextAction?.title || null} state="pending" /></section>
    <section><SectionHeader title="案件一覧" description="未準備の既存Offerも失わず表示します。" />
      {!snapshot?.offers.length ? <EmptyState title="Offerがありません" message="Operationsで実Offerを登録してください。" /> : snapshot.offers.map((item) => {
        const itemProgram = snapshot.programs.find((candidate) => candidate.offer_id === item.id);
        const itemOperation = snapshot.operations.find((candidate) => candidate.offer_id === item.id);
        const action = deriveNextOwnerAction({ ...snapshot, offers: [item] });
        return <article className="production-panel affiliate-program-row" key={item.id}><div><span className="eyebrow">{itemProgram?.asp_name || "ASP 未設定"}</span><h2>{item.title}</h2><p>{item.advertiser} · {itemProgram?.commission_rate != null ? `${itemProgram.commission_rate}%` : item.commission_summary}</p></div><div><strong>{action.title}</strong><p>Compliance: {itemProgram ? "設定中" : "未確認"} · Progress {preparationProgress(itemProgram)}%</p>{itemProgram&&<button onClick={()=>navigate(`/affiliate-intelligence/${itemProgram.id}`)}>詳細</button>}<button className="production-primary" onClick={() => navigate(`/operations/offers/${item.id}/preparation`)}>{itemProgram || itemOperation ? "運用準備を再開" : "運用準備"}</button></div></article>;
      })}
    </section>
  </main>;

  const current = PREPARATION_STEPS[step];
  return <main className="content kv-production-screen affiliate-intelligence">
    <PageHeader eyebrow="OPERATION PREPARATION" title={offer?.title || "運用準備"} description="入力はDraft保存され、再読み込み・戻る・deep linkから再開できます。" actions={<EnvironmentBadge environment="locked" />} />
    <button className="production-secondary" onClick={() => navigate("/affiliate-intelligence")}>← 案件一覧へ</button>
    <ol className="affiliate-wizard-steps" aria-label="運用準備の進捗">{PREPARATION_STEPS.map((item, index) => <li key={item.key} className={index === step ? "is-current" : index < step ? "is-complete" : ""}><button onClick={() => setStep(index)} aria-current={index === step ? "step" : undefined}><span>{index + 1}</span>{item.label}</button></li>)}</ol>
    {notice && <p className="production-alert success" role="status">{notice}</p>}{error && <p className="production-alert danger" role="alert">{error}</p>}
    <Card className="affiliate-wizard-panel"><SectionHeader title={`${step + 1}. ${current.label}`} description={current.required.length ? "必須項目を入力してください。" : "任意項目を確認してください。"} />
      {step === 0 && <><Field name="aspName" value={form.aspName} setValue={setValue} /><Field name="advertiserName" value={form.advertiserName} setValue={setValue} /><Field name="programName" value={form.programName} setValue={setValue} /><Field name="programCode" value={form.programCode} setValue={setValue} /><Field name="officialProductUrl" value={form.officialProductUrl} setValue={setValue} /><Field name="advertiserProgramUrl" value={form.advertiserProgramUrl} setValue={setValue} /><Field name="aspManagementUrl" value={form.aspManagementUrl} setValue={setValue} /></>}
      {step === 1 && <><Field name="commissionRate" type="number" value={form.commissionRate ?? ""} setValue={setValue} /><Field name="conversionConditions" multiline value={form.conversionConditions} setValue={setValue} /><Field name="rejectionConditions" multiline value={form.rejectionConditions} setValue={setValue} /></>}
      {step === 2 && <><Field name="listingRestrictions" multiline value={form.listingRestrictions} setValue={setValue} /><Field name="disclosureRequirements" multiline value={form.disclosureRequirements} setValue={setValue} /><Field name="prohibitedClaims" multiline value={form.prohibitedClaims} setValue={setValue} /></>}
      {step === 3 && <p>素材はMigration 014のaffiliate_materialsに安全な参照として追加できます。追跡URLやHTMLは公開表示しません。</p>}
      {step === 4 && <Field name="targetAudience" multiline value={form.targetAudience} setValue={setValue} />}
      {step === 5 && <Field name="claimPlan" multiline value={form.claimPlan} setValue={setValue} />}
      {step === 6 && <Field name="plannedChannels" multiline value={form.plannedChannels} setValue={setValue} />}
      {step === 7 && <Field name="evidencePlan" multiline value={form.evidencePlan} setValue={setValue} />}
      {step === 8 && <label className="check-line"><input type="checkbox" checked={form.ownerConfirmed} onChange={(event) => setValue("ownerConfirmed", event.target.checked)} />条件・Compliance・Manual Execution境界をOwnerとして確認しました。</label>}
      {step === 9 && <div><h3>運用準備の確認</h3><p>ASP: {form.aspName || "未入力"}</p><p>報酬: {form.commissionRate ?? "未入力"}% {form.currency}</p><p>External ExecutionはLOCKEDのままです。</p><p>完了後は既存のApproval / Manual Execution Packageフローへ接続します。</p></div>}
      <div className="affiliate-wizard-actions"><button disabled={busy || step === 0} onClick={() => setStep((value) => value - 1)}>戻る</button><button disabled={busy} onClick={() => save(step)}>Draft保存</button>{step < 9 ? <button className="production-primary" disabled={busy} onClick={async () => { if (await save(step + 1)) setStep((value) => value + 1); }}>次へ</button> : <button className="production-primary" disabled={busy} onClick={() => save(9, true)}>確認して運用準備を完了</button>}</div>
    </Card>
  </main>;
}
