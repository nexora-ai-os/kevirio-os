import { useEffect, useMemo, useState } from "react";
import { restoreAffiliateProposedChanges } from "./affiliateDraftRestore.js";
import { projectAffiliateResearchFinding } from "./affiliateResearchProjection.js";
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  SectionHeader,
  Select,
  Textarea,
} from "../../design-system/index.js";
import { listingComplianceLabel, normalizeAffiliateApprovalRate } from "../../domain/affiliateProgramMaster.js";
import { AFFILIATE_FIELD_GUIDANCE, OWNER_LABELS, fieldDescription, fieldLabel } from "../../domain/affiliateFieldGuidance.js";
import { OWNER_SAVE_STATE, SaveState, useOwnerEditGuard } from "../../app/ownerEditGuard.jsx";
import "./AffiliateProgramMaster.css";

const ASP = [
  "A8.net",
  "もしもアフィリエイト",
  "afb",
  "バリューコマース",
  "アクセストレード",
  "レントラックス",
  "JANet",
  "Link-A",
  "楽天アフィリエイト",
  "Amazonアソシエイト",
  "その他",
];
const STATES = ["ALL", "ACTIVE", "PAUSED", "ARCHIVED", "EXPIRED", "UNKNOWN"];
const filled = (p, k) => p[k] != null && String(p[k]).trim() !== "";
const completeness = (p) =>
  Math.round(
    ([
      "programName",
      "advertiserName",
      "aspName",
      "programId",
      "category",
      "rewardSummary",
      "conversionConditions",
      "rejectionConditions",
      "businessGoal",
      "targetAudience",
      "contentPlan",
      "nextAction",
    ].filter((k) => filled(p, k)).length /
      12) *
      100,
  );
export const missingResearchRequired = (p) =>
  [
    !p.rewardSummary && "報酬概要",
    !p.conversionConditions && "成果条件",
    !p.rejectionConditions && "否認条件",
    p.listingVerificationStatus !== "CONFIRMED" && "掲載条件の確認",
    !p.sourceVerifiedAt && "情報の確認日時",
  ].filter(Boolean);
export const missingResearchRecommended = (p) =>
  [p.epc == null && "EPC", p.approvalRate == null && "承認率"].filter(Boolean);

export default function AffiliateProgramMaster(props) {
  const { programs = [], available = true, selectedProgramId = null, onSelectedProgramChange } = props;
  const routeSelectedProgramId = selectedProgramId || new URLSearchParams(window.location.search).get("programId");
  const [selectedId, setSelectedId] = useState(routeSelectedProgramId),
    [query, setQuery] = useState(""),
    [state, setState] = useState("ALL"),
    [registering, setRegistering] = useState(false),
    [helpOpen,setHelpOpen]=useState(false);
  useEffect(() => setSelectedId(routeSelectedProgramId), [routeSelectedProgramId]);
  const selectProgram = (id) => {
    setSelectedId(id);
    if (onSelectedProgramChange) return onSelectedProgramChange(id);
    const url = id ? `/affiliate-intelligence?programId=${encodeURIComponent(id)}` : "/affiliate-intelligence";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const selected = programs.find((p) => p.id === selectedId);
  const rows = useMemo(
    () =>
      programs.filter(
        (p) =>
          (state === "ALL" || p.programStatus === state) &&
          `${p.programName} ${p.advertiserName} ${p.aspName} ${p.programId} ${p.category || ""}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [programs, state, query],
  );
  if (selected)
    return (
      <Detail
        {...props}
        program={selected}
        onClose={() => selectProgram(null)}
      />
    );
  return (
    <section className="av2-program-master">
      <div className="av2-program-master__heading">
        <SectionHeader
          title="Affiliate Programs"
          description="提携案件を探す・整える・次の行動へ進めるProgram Master"
        />
        <div className="av2-action-row"><Button variant="secondary" onClick={()=>setHelpOpen(v=>!v)}>この画面の使い方</Button><Button onClick={() => setRegistering((v) => !v)}>{registering ? "登録を閉じる" : "＋ 新しいProgram"}</Button></div>
      </div>
      {helpOpen?<Card className="av2-page-help"><h3>Affiliate Programの進め方</h3><p>登録 → 条件確認 → 不足確認 → Research readiness → Research の順に進めます。未確認は推測で埋めず、資料またはOwner入力で確認してください。</p><p>AIの抽出結果は候補です。Draftへ適用後、Ownerが明示保存するまでcanonical factにはなりません。</p></Card>:null}
      <p className="av2-boundary">
        Owner Personal Workspace · External Execution LOCKED · Browser direct
        DML 0
      </p>
      <div className="av2-program-stats">
        {STATES.slice(0, 4).map((s) => (
          <button
            key={s}
            aria-pressed={state === s}
            onClick={() => setState(s)}
          >
            <strong>
              {available
                ? s === "ALL"
                  ? programs.length
                  : programs.filter((p) => p.programStatus === s).length
                : "—"}
            </strong>
            <span>{s === "ALL" ? "すべて" : s}</span>
          </button>
        ))}
      </div>
      {registering ? (
        <Registration
          onRegister={props.onRegister}
          onDone={() => setRegistering(false)}
        />
      ) : null}
      <div className="av2-program-tools">
        <FormField label="Programを検索">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Program名・広告主・ASP・ID"
          />
        </FormField>
        <FormField label="状態">
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="av2-program-card-grid">
        {rows.map((p) => (
          <button
            className="av2-program-card"
            key={p.id}
            onClick={() => selectProgram(p.id)}
          >
            <span className="av2-program-card__top">
              <Badge
                label={p.programStatus}
                state={p.programStatus === "ACTIVE" ? "actual" : "pending"}
              />
              <small>
                {p.aspName} · {p.programId}
              </small>
            </span>
            <strong>{p.programName}</strong>
            <span>{p.advertiserName}</span>
            <span className="av2-program-card__meter">
              <i style={{ width: `${completeness(p)}%` }} />
              <small>情報充足度 {completeness(p)}%</small>
            </span>
            <span className="av2-program-card__footer">
              <span>{p.nextAction || "次の行動が未設定"}</span>
              <b>詳細 →</b>
            </span>
          </button>
        ))}
      </div>
      {!rows.length ? (
        <Card>
          <h3>
            {available
              ? "条件に合うProgramはありません"
              : "Program Masterを確認できません"}
          </h3>
          <p>
            {available
              ? "検索条件を変えるか、新規登録してください。"
              : "未取得をゼロとは扱いません。"}
          </p>
        </Card>
      ) : null}
    </section>
  );
}

function Registration({ onRegister, onDone }) {
  const initial = {
    aspName: "A8.net",
    programId: "",
    advertiserName: "",
    programName: "",
    category: "",
    sourceNotes: "",
  };
  const [form, setForm] = useState(initial),
    [custom, setCustom] = useState(""),
    [step, setStep] = useState(1),
    [save, setSave] = useState({ pending: false, error: null });
  const change = (k) => (e) => setForm((v) => ({ ...v, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setSave({ pending: true, error: null });
    try {
      await onRegister({
        ...form,
        aspName: form.aspName === "その他" ? custom.trim() : form.aspName,
      });
      onDone();
    } catch (x) {
      setSave({ pending: false, error: x?.code || "登録できません" });
    }
  };
  return (
    <Card className="av2-registration">
      <SectionHeader
        title="新しいProgramを登録"
        description={`Step ${step}/4 · 必須情報から始め、詳細は後で補完できます。`}
      />
      <div className="av2-stepper">
        {["識別", "案件", "出典", "確認"].map((x, i) => (
          <span key={x} aria-current={step === i + 1 ? "step" : undefined}>
            {i + 1}. {x}
          </span>
        ))}
      </div>
      <form onSubmit={submit}>
        {step === 1 ? (
          <div className="av2-data-grid">
            <FormField label="ASP（必須）">
              <Select value={form.aspName} onChange={change("aspName")}>
                {ASP.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
              {form.aspName === "その他" ? (
                <Input
                  aria-label="ASP名"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  required
                />
              ) : null}
            </FormField>
            <FormField label="Program ID（必須）">
              <Input
                value={form.programId}
                onChange={change("programId")}
                required
              />
            </FormField>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="av2-data-grid">
            <FormField label="広告主名（必須）">
              <Input
                value={form.advertiserName}
                onChange={change("advertiserName")}
                required
              />
            </FormField>
            <FormField label="Program名（必須）">
              <Input
                value={form.programName}
                onChange={change("programName")}
                required
              />
            </FormField>
            <FormField label="カテゴリ（推奨）">
              <Input value={form.category} onChange={change("category")} />
            </FormField>
          </div>
        ) : null}
        {step === 3 ? (
          <FormField label="情報源メモ（推奨）" error={save.error}>
            <Input
              value={form.sourceNotes}
              onChange={change("sourceNotes")}
              placeholder="公式ページ等。秘密情報は保存しない"
            />
          </FormField>
        ) : null}
        {step === 4 ? (
          <dl className="av2-data-grid">
            <Data
              label="ASP / ID"
              value={`${form.aspName === "その他" ? custom : form.aspName} / ${form.programId}`}
            />
            <Data label="Program" value={form.programName} />
            <Data label="広告主" value={form.advertiserName} />
            <Data
              label="保存境界"
              value="Owner-only · External Execution LOCKED"
            />
          </dl>
        ) : null}
        <div className="av2-action-row">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((x) => x - 1)}
            >
              戻る
            </Button>
          ) : null}
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((x) => x + 1)}
              disabled={
                (step === 1 &&
                  (!form.programId ||
                    (form.aspName === "その他" && !custom))) ||
                (step === 2 && (!form.advertiserName || !form.programName))
              }
            >
              次へ
            </Button>
          ) : (
            <Button type="submit" pending={save.pending}>
              Programを登録
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function Operational({
  program,
  onLoadDraft,
  onSaveDraft,
  onUpdateOperational,
}) {
  const canonical = {
    business_goal: program.businessGoal || "",
    target_audience: program.targetAudience || "",
    promotion_channels: program.promotionChannels || [],
    content_plan: program.contentPlan || "",
    compliance_checklist: program.complianceChecklist || {},
    priority: program.priority,
    next_action: program.nextAction || "",
    next_action_due_at: program.nextActionDueAt || "",
    publication_status: program.publicationStatus || "NOT_PUBLISHED",
    publication_url: program.publicationUrl || "",
  };
  const [form, setForm] = useState(canonical),
    [version, setVersion] = useState(0),
    [dirty, setDirty] = useState(false),
    [status, setStatus] = useState("読み込み中");
  useEffect(() => {
    let active = true;
    onLoadDraft(program.id)
      .then((d) => {
        if (active && d) {
          setForm({ ...canonical, ...d.draft_payload });
          setVersion(d.draft_version);
          setStatus("下書きを復元しました");
        } else if (active) setStatus("保存済み");
      })
      .catch(() => active && setStatus("下書きを確認できません"));
    return () => {
      active = false;
    };
  }, [program.id]);
  useEffect(() => {
    if (!dirty) return;
    setStatus("下書き保存中");
    const t = setTimeout(
      () =>
        onSaveDraft(program.id, {
          expectedDraftVersion: version,
          baseProgramUpdatedAt: program.updatedAt,
          draftPayload: form,
        })
          .then((v) => {
            setVersion(v);
            setDirty(false);
            setStatus("下書き保存済み");
          })
          .catch(() => setStatus("下書き保存に失敗")),
      800,
    );
    return () => clearTimeout(t);
  }, [dirty, form, version, program.id, program.updatedAt, onSaveDraft]);
  const change = (k) => (e) => {
    const value =
      k === "priority"
          ? e.target.value
            ? Number(e.target.value)
            : null
          : e.target.value;
    setForm((v) => ({ ...v, [k]: value }));
    setDirty(true);
  };
  const save = async () => {
    setStatus("保存中");
    try {
      await onUpdateOperational(program.id, {
        expectedBusinessVersion: program.businessVersion,
        changes: form,
      });
      setDirty(false);
      setStatus("保存済み");
    } catch {
      setStatus("競合または保存失敗。再読み込みしてください");
    }
  };
  return (
    <>
      <p role="status">
        <Badge
          label={status}
          state={status.includes("失敗") ? "pending" : "actual"}
        />
      </p>
      <div className="av2-data-grid">
        {[
          ["business_goal", "事業目標"],
          ["target_audience", "対象ユーザー"],
          ["content_plan", "コンテンツ計画"],
          ["next_action", "次の行動"],
        ].map(([k, l]) => (
          <FormField key={k} label={l}>
            <Input value={form[k]} onChange={change(k)} />
          </FormField>
        ))}
        <FormField label="推奨チャネル" description={fieldDescription("promotionChannels")}><div className="av2-channel-options">{["ブログ","note","Instagram","Threads","X","YouTube","メール"].map(channel=><label key={channel}><input type="checkbox" checked={form.promotion_channels.includes(channel)} onChange={e=>{setForm(v=>({...v,promotion_channels:e.target.checked?[...new Set([...v.promotion_channels,channel])]:v.promotion_channels.filter(x=>x!==channel)}));setDirty(true)}}/>{channel}</label>)}</div></FormField>
        <FormField label="優先度" description={fieldDescription("priority")}>
          <Input
            type="number"
            min="1"
            max="5"
            value={form.priority ?? ""}
            onChange={change("priority")}
          />
        </FormField>
        <FormField label="期限">
          <Input
            type="datetime-local"
            value={
              form.next_action_due_at
                ? String(form.next_action_due_at).slice(0, 16)
                : ""
            }
            onChange={change("next_action_due_at")}
          />
        </FormField>
        <FormField label="公開状態">
          <Select
            value={form.publication_status}
            onChange={change("publication_status")}
          >
            <option>NOT_PUBLISHED</option>
            <option>DRAFT</option>
            <option>PUBLISHED</option>
            <option>PAUSED</option>
            <option>ARCHIVED</option>
          </Select>
        </FormField>
        <FormField label="公開URL">
          <Input
            type="url"
            value={form.publication_url}
            onChange={change("publication_url")}
          />
        </FormField>
      </div>
      <Button onClick={save}>実務情報を保存</Button>
      <p className="av2-boundary">
        AI提案はDRAFT。Actual Revenue / Evidenceは作成しません。
      </p>
    </>
  );
}

function Detail({
  program,
  onClose,
  onSaveLink,
  onRefresh,
  onUpdate,
  onUpdatePractical,
  onDeleteSafe,
  onLoadDraft,
  onSaveDraft,
  onUpdateOperational,
  onExtractAttachments,
  onStartResearch,
  onPrepareStrategy,
  onReviewStrategy,
  onConfirmStrategy,
  onLoadResearch,
  onPrepareContent,
  onLoadContent,
  onSaveContent,
  revenueCycle,
}) {
  const [tab, setTab] = useState("overview"),
    [notice, setNotice] = useState(null),
    [url, setUrl] = useState(program.affiliateUrl || ""),
    [linkDirty, setLinkDirty] = useState(false),
    [linkSaving, setLinkSaving] = useState(false),
    [linkSaveOutcome, setLinkSaveOutcome] = useState(OWNER_SAVE_STATE.SAVED),
    [linkStatus, setLinkStatus] = useState(
      program.affiliateLinkStatus === "NOT_REGISTERED"
        ? "ACTIVE"
        : program.affiliateLinkStatus,
    ),[intakeOpen,setIntakeOpen]=useState(false),
    [researchState,setResearchState]=useState({status:"idle",persisted:null}),
    [selectedResearchId,setSelectedResearchId]=useState(null),
    [strategyState,setStrategyState]=useState({status:"idle",draft:null,record:null,error:null}),
    [selectedStrategyId,setSelectedStrategyId]=useState(null);
  const linkSaveState = linkSaving ? OWNER_SAVE_STATE.SAVING : linkSaveOutcome;
  useOwnerEditGuard(`affiliate-link-${program.id}`, linkSaveState);
  useEffect(() => {
    if (linkDirty || linkSaving) return;
    setUrl(program.affiliateUrl || "");
    setLinkStatus(program.affiliateLinkStatus === "NOT_REGISTERED" ? "ACTIVE" : program.affiliateLinkStatus);
  }, [program.id, program.affiliateUrl, program.affiliateLinkStatus, linkDirty, linkSaving]);
  const [edit, setEdit] = useState(
    Object.fromEntries([
      ["aspName", program.aspName],
      ["programId", program.programId],
      ["programName", program.programName],
      ["advertiserName", program.advertiserName],
      ["category", program.category || ""],
      ["rewardType", program.rewardType || "UNKNOWN"],
      ["rewardSummary", program.rewardSummary || ""],
      ["rewardAmount", program.rewardDetails?.amount ?? ""],
      ["rewardCurrency", program.rewardDetails?.currency || "JPY"],
      ["rewardRate", program.rewardDetails?.rate ?? ""],
      ["rewardNotes", program.rewardDetails?.notes || ""],
      ["epc", program.epc ?? ""],
      ["approvalRate", program.approvalRate ?? ""],
      ["revisitWindowDays", program.revisitWindowDays ?? ""],
      ["confirmationDays", program.confirmationDays ?? ""],
      ["conversionConditions", program.conversionConditions || ""],
      ["rejectionConditions", program.rejectionConditions || ""],
      ["prPoints", program.prPoints || ""],
      ["listingPolicy", program.listingPolicy || "UNKNOWN"],
      ["listingNgWords", (program.listingNgWords || []).join("\n")],
      ["listingNgWordsRaw", program.listingNgWordsRaw || ""],
      ["listingVerificationStatus", program.listingVerificationStatus || "UNKNOWN"],
      ["complianceNotes", program.complianceNotes || ""],
      ["sourceType", program.sourceType || "OWNER_MANUAL"],
      ["sourceVerifiedAt", program.sourceVerifiedAt ? String(program.sourceVerifiedAt).slice(0,16) : ""],
      ["sourceNotes", program.sourceNotes || ""],
      ["ownerNotes", program.ownerNotes || ""],
    ]),
  );
  useEffect(() => {
    let active = true;
    onLoadDraft(program.id)
      .then((draft) => {
        const restored = restoreAffiliateProposedChanges(draft?.draft_payload);
        if (active && restored) setEdit((current) => ({ ...current, ...restored }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [program.id]);
  const update = async (changes) => {
    setNotice("保存中…");
    try {
      await onUpdate(program.id, {
        expectedUpdatedAt: program.updatedAt,
        changes,
      });
      setNotice("保存しました。再読み込み後も維持されます");
    } catch {
      setNotice("競合または保存失敗。再読み込みしてください");
    }
  };
  const savePractical = async (event) => {
    event.preventDefault(); setNotice("保存中…");
    try {
      const {rewardAmount,rewardCurrency,rewardRate,rewardNotes,...base}=edit;
      const rewardDetails=rewardAmount!==""||rewardRate!==""||rewardNotes?{amount:rewardAmount===""?null:Number(rewardAmount),currency:rewardCurrency||"JPY",rate:rewardRate===""?null:Number(rewardRate),notes:rewardNotes||null}:null;
      const changes={...base,rewardDetails,epc:edit.epc===""?null:Number(edit.epc),approvalRate:normalizeAffiliateApprovalRate(edit.approvalRate),revisitWindowDays:edit.revisitWindowDays===""?null:Number(edit.revisitWindowDays),confirmationDays:edit.confirmationDays===""?null:Number(edit.confirmationDays),listingNgWords:edit.listingVerificationStatus==="NOT_CONFIRMED"?null:edit.listingNgWords.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),sourceVerifiedAt:edit.sourceVerifiedAt?new Date(edit.sourceVerifiedAt).toISOString():null};
      await onUpdatePractical(program.id,{expectedUpdatedAt:program.updatedAt,expectedBusinessVersion:program.businessVersion,changes});
      setNotice("全項目をcanonical保存しました。再読み込み後も維持されます");
    } catch { setNotice("入力形式、競合、または保存に失敗しました。再読み込みしてください"); }
  };
  const remove = async () => {
    if(!confirm("依存履歴がない場合だけ完全に削除します。続けますか？"))return;
    try{const result=await onDeleteSafe(program.id,{expectedUpdatedAt:program.updatedAt,expectedBusinessVersion:program.businessVersion,idempotencyKey:`affiliate:delete:${program.id}:v${program.businessVersion}`});if(result?.deleted)onClose();else setNotice(`削除不可: ${result?.classification||"PROTECTED_HISTORY"}`)}catch{setNotice("削除判定に失敗しました。データは変更されていません")}
  };
  const miss = missingResearchRequired(program);
  const recommendedMiss = missingResearchRecommended(program);
  const researchResults=(researchState.persisted?.results||[]).map(projectAffiliateResearchFinding),selectedResearch=researchResults.find(item=>item.id===selectedResearchId)||null;
  const strategies=researchState.persisted?.strategies||[],selectedStrategy=strategies.find(item=>item.id===selectedStrategyId)||null;
  useEffect(() => {
    const progress = { overview: "Program確認", edit: "条件編集", research: "Research", content: "Content・公開準備", performance: "実績確認" }[tab] || "Program確認";
    const strategyConfirmed = strategies.some((item) => item.status === "CONFIRMED");
    const completed = ["Program登録", miss.length === 0 && "Research必須情報確認", researchResults.length > 0 && "Research", strategyConfirmed && "Strategy"].filter(Boolean);
    const next = linkDirty ? "Affiliate URLを保存" : strategyConfirmed ? "Contentと手動公開準備を確認" : researchResults.length > 0 ? "ResearchからStrategyを確認" : miss.length === 0 ? "AIでResearchを開始" : "Research必須情報を確認";
    window.dispatchEvent(new CustomEvent("kevirio:active-work", { detail: { title: program.programName, state: `Affiliate Program / ${tab}`, progress, completed: completed.join(" → "), next, blocker: linkDirty ? "未保存のAffiliate URL" : miss.length ? `Research必須情報 ${miss.length}件` : "なし", objectId: program.id } }));
  }, [program.id, program.programName, tab, linkDirty, miss.length, researchResults.length, strategies]);
  useEffect(()=>{let active=true;if(!onLoadResearch)return()=>{};onLoadResearch(program.id).then(persisted=>{if(active)setResearchState({status:"idle",persisted})}).catch(()=>{});return()=>{active=false}},[program.id,onLoadResearch]);
  const startResearch=async()=>{setResearchState(current=>({...current,status:"running",error:null}));try{const result=await onStartResearch(program);const persisted=await onLoadResearch(program.id);setResearchState({status:"complete",result,persisted})}catch(error){setResearchState(current=>({...current,status:"failed",error:error?.message||"RESEARCH_EXECUTION_FAILED"}))}};
  const prepareStrategy=async()=>{setStrategyState({status:"preparing",draft:null,record:null,error:null});try{const result=await onPrepareStrategy(program,selectedResearch.id);setStrategyState({status:"review",draft:result.draft,record:result.strategy,error:null})}catch(error){setStrategyState({status:"failed",draft:null,record:null,error:error?.message||"AFFILIATE_STRATEGY_PREPARE_FAILED"})}};
  const confirmStrategy=async()=>{setStrategyState(current=>({...current,status:"saving",error:null}));try{const reviewed=await onReviewStrategy(strategyState.record.strategy_id,strategyState.record.strategy_version,strategyState.draft);await onConfirmStrategy(strategyState.record.strategy_id,reviewed.strategy_version);const persisted=await onLoadResearch(program.id);setResearchState(current=>({...current,persisted}));setSelectedStrategyId(strategyState.record.strategy_id);setStrategyState(current=>({...current,status:"saved"}))}catch(error){setStrategyState(current=>({...current,status:"failed",error:error?.message||"AFFILIATE_STRATEGY_SAVE_FAILED"}))}};
  return (
    <section className="av2-program-detail">
      <div className="av2-program-detail__header">
        <div>
          <button className="av2-back" onClick={onClose}>
            ← Programs
          </button>
          <p className="eyebrow">PROGRAM DETAIL</p>
          <h2>{program.programName}</h2>
          <p>
            {program.advertiserName} · {program.aspName} · {program.programId}
          </p>
        </div>
        <div className="av2-action-row">
          <Badge label={program.programStatus} />
          <Button variant="secondary" onClick={()=>setIntakeOpen(v=>!v)}>資料から入力</Button>
          <Button
            variant="secondary"
            onClick={() =>
              update({
                programStatus:
                  program.programStatus === "PAUSED" ? "ACTIVE" : "PAUSED",
              })
            }
          >
            {program.programStatus === "PAUSED" ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              confirm("Archiveしますか？") &&
              update({ programStatus: "ARCHIVED" })
            }
          >
            Archive
          </Button>
          <Button variant="secondary" onClick={remove}>Delete</Button>
        </div>
      </div>
      {intakeOpen?<AffiliateAttachmentIntake program={program} onExtract={onExtractAttachments} onLoadDraft={onLoadDraft} onSaveDraft={onSaveDraft} onApplyToForm={(values)=>setEdit(v=>({...v,...values}))}/>:null}
      <div className="av2-readiness">
        <strong>情報充足度 {completeness(program)}%</strong>
        <span>
          Research Ready: {miss.length ? "NO" : "YES"}
        </span>
        {miss.length ? <small>必須情報 {miss.length}件未確認: {miss.join("、")}</small> : null}
        {recommendedMiss.length ? <small>任意情報 {recommendedMiss.length}件未確認: {recommendedMiss.join("、")}。未確認のため分析精度が下がる可能性があります</small> : null}
      </div>
      <p><a className="next-link" href={`/assistant?feature=affiliate&programId=${encodeURIComponent(program.id)}&prompt=${encodeURIComponent("この案件でResearch開始前に足りない項目だけ教えて")}`}>AI秘書にこの案件について聞く</a></p>
      <nav className="av2-tabs">
        {[
          ["overview", "概要"],
          ["edit", "編集"],
          ["research", "Research"],
          ["content", "Content"],
          ["performance", "Performance"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            aria-current={tab === k ? "page" : undefined}
          >
            {l}
          </button>
        ))}
      </nav>
      {tab === "overview" ? (
        <Card>
          <dl className="av2-data-grid">
            {[
              ["報酬種別", program.rewardType],
              ["報酬概要", program.rewardSummary],
              ["EPC", program.epc],
              ["承認率", program.approvalRate],
              ["再訪問期間", program.revisitWindowDays],
              ["確定日数", program.confirmationDays],
              ["成果条件", program.conversionConditions],
              ["否認条件", program.rejectionConditions],
              ["次の行動", program.nextAction],
              ["External Execution", "LOCKED"],
            ].map(([l, v]) => (
              <Data key={l} label={l} value={v} />
            ))}
          </dl>
        </Card>
      ) : null}
      {tab === "edit" ? (
        <>
          <Card>
            <form onSubmit={savePractical}>
              <SectionHeader
                title="基本・条件情報"
                description="M026 optimistic concurrency。競合はfail-closedです。"
              />
              <div className="av2-data-grid">
                {Object.entries({
                  aspName: "ASP",
                  programId: "Program ID",
                  programName: "Program名",
                  advertiserName: "広告主名",
                  category: "カテゴリ",
                  rewardType: "報酬種別",
                  rewardSummary: "報酬概要",
                  epc: "EPC",
                  approvalRate: "承認率",
                  revisitWindowDays: "Cookie / 再訪問日数",
                  confirmationDays: "確定日数",
                  conversionConditions: "成果条件",
                  rejectionConditions: "否認条件",
                  prPoints: "PRポイント",
                  listingPolicy: "掲載ポリシー",
                  listingNgWords: "NGワード（1行1件）",
                  listingNgWordsRaw: "NGワード原文",
                  listingVerificationStatus: "掲載条件確認状態",
                  complianceNotes: "Complianceメモ",
                  sourceType: "情報源種別",
                  sourceVerifiedAt: "情報確認日時",
                  sourceNotes: "情報源メモ",
                  ownerNotes: "Ownerメモ",
                }).map(([k, l]) => (
                  <GuidedAffiliateField key={k} field={k} fallbackLabel={l} value={edit[k]} onChange={(value)=>setEdit(v=>({...v,[k]:value}))}/>
                ))}
                <fieldset className="av2-reward-details"><legend>報酬詳細 <small>任意 · 未確認でも保存可</small></legend><FormField label="報酬額" description="例: 3000 · 通貨単位"><Input type="number" min="0" value={edit.rewardAmount} onChange={e=>setEdit(v=>({...v,rewardAmount:e.target.value}))}/></FormField><FormField label="通貨"><Select value={edit.rewardCurrency} onChange={e=>setEdit(v=>({...v,rewardCurrency:e.target.value}))}><option value="JPY">日本円 (JPY)</option><option value="USD">米ドル (USD)</option><option value="OTHER">その他</option></Select></FormField><FormField label="報酬率" description="例: 10 · %"><Input type="number" min="0" max="100" value={edit.rewardRate} onChange={e=>setEdit(v=>({...v,rewardRate:e.target.value}))}/></FormField><FormField label="報酬備考"><Input value={edit.rewardNotes} onChange={e=>setEdit(v=>({...v,rewardNotes:e.target.value}))}/></FormField></fieldset>
              </div>
              <Button type="submit">変更を保存</Button>
            </form>
          </Card>
          <Card>
            <SectionHeader
              title="実務情報・下書き"
              description="入力は自動保存、明示保存でcanonical business stateになります。"
            />
            <Operational
              program={program}
              onLoadDraft={onLoadDraft}
              onSaveDraft={onSaveDraft}
              onUpdateOperational={onUpdateOperational}
            />
          </Card>
        </>
      ) : null}
      {tab === "research" ? (
        <Card>
          <SectionHeader
            title="Research readiness"
            description="確認済みと未確認を混同しません。"
          />
          <dl className="av2-data-grid">
            {[
              ["掲載ポリシー", program.listingPolicy],
              ["確認状態", listingComplianceLabel(program)],
              ["NGワード", program.listingNgWords?.join("、")],
              ["NGワード原文", program.listingNgWordsRaw],
              ["情報源", program.sourceType],
              ["確認日時", program.sourceVerifiedAt],
            ].map(([l, v]) => (
              <Data key={l} label={l} value={v} />
            ))}
          </dl>
          <p>
            {miss.length
              ? `Research開始前に確認: ${miss.join("、")}`
              : "RESEARCH READY"}
          </p>
          {recommendedMiss.length?<p>任意情報 {recommendedMiss.length}件未確認: {recommendedMiss.join("、")}。未確認のため分析精度が下がる可能性があります。</p>:null}
          <Button type="button" disabled={miss.length>0||researchState.status==="running"} onClick={startResearch}>{researchState.status==="running"?"Research実行中…":"AIでResearchを開始"}</Button>
          {researchState.status==="complete"?<p role="status">Research結果を保存し、このProgramへリンクしました。</p>:null}
          {researchState.status==="failed"?<p role="alert">Researchを開始できませんでした: {researchState.error}</p>:null}
          {researchState.persisted?.linkedCount>0?<p>保存済みResearch: {researchState.persisted.linkedCount}件 · reload後もProgram link維持</p>:null}
          {researchResults.length?<div className="av2-research-results"><h3>保存済みResearch</h3>{researchResults.map(item=><article key={item.id}><p><strong>{item.type}</strong> · {item.executedAt?new Date(item.executedAt).toLocaleString("ja-JP"):"日時未記録"}</p><p>Source: {item.source} · {item.truthClass} · Confidence: {item.confidence==null?"Unknown":`${Math.round(item.confidence*100)}%`}</p><p>{item.summary}</p><Button type="button" variant="secondary" onClick={()=>{setSelectedResearchId(item.id);setStrategyState({status:"idle",draft:null,record:null,error:null})}}>Researchを開く</Button></article>)}</div>:<p>保存済みResearchはありません。</p>}
          {selectedResearch?<article className="av2-research-detail"><h3>Research Detail</h3><dl className="av2-data-grid"><Data label="調査目的" value={selectedResearch.purpose}/><Data label="Findings" value={selectedResearch.findings}/><Data label="Target / Audience" value={selectedResearch.targetAudience}/><Data label="Market need" value={selectedResearch.marketNeed}/><Data label="Competitor" value={selectedResearch.competitor}/><Data label="Opportunity" value={selectedResearch.opportunity}/><Data label="Risks" value={selectedResearch.risks}/><Data label="Recommended angle" value={selectedResearch.recommendedAngle}/><Data label="Recommended channel" value={selectedResearch.recommendedChannel}/><Data label="Next action" value={selectedResearch.nextAction}/><Data label="Sources / Provenance" value={JSON.stringify(selectedResearch.provenance)}/><Data label="Fact vs inference" value={selectedResearch.factVsInference}/></dl><Button type="button" disabled={strategyState.status==="preparing"||strategyState.status==="saving"} onClick={prepareStrategy}>{strategyState.status==="preparing"?"Strategy draft生成中…":"このResearchから戦略を作る"}</Button></article>:null}
          {strategyState.draft?<article className="av2-research-detail"><h3>Strategy Draft · Owner Review</h3><StrategyData strategy={strategyState.draft}/><p>AI_INFERENCE · NOT_EVIDENCE · External Execution LOCKED</p><Button type="button" disabled={strategyState.status==="saving"} onClick={confirmStrategy}>{strategyState.status==="saving"?"canonical保存中…":"Owner確認してcanonical保存"}</Button></article>:null}
          {strategyState.error?<p role="alert">Strategy処理を完了できませんでした: {strategyState.error}</p>:null}
          {strategies.length?<div className="av2-research-results"><h3>保存済みStrategy</h3>{strategies.map(item=><article key={item.id}><p><strong>{item.status}</strong> · version {item.version}</p><Button type="button" variant="secondary" onClick={()=>setSelectedStrategyId(item.id)}>Strategyを開く</Button></article>)}</div>:null}
          {selectedStrategy?<article className="av2-research-detail"><h3>Canonical Strategy</h3><StrategyData strategy={{targetAudience:selectedStrategy.target_audience,corePositioning:selectedStrategy.core_positioning,valueProposition:selectedStrategy.value_proposition,keyPain:selectedStrategy.key_pain,keyMessage:selectedStrategy.key_message,recommendedAngle:selectedStrategy.recommended_angle,recommendedChannels:selectedStrategy.recommended_channels,contentDirection:selectedStrategy.content_direction,risks:selectedStrategy.risks,nextAction:selectedStrategy.next_action}}/><p>Program link: {selectedStrategy.affiliate_program_id===program.id?"exact":"INVALID"} · Research: {selectedStrategy.source_research_id}</p></article>:null}
        </Card>
      ) : null}
      {tab === "content" ? (
        <>
        <AffiliateContentCycle program={program} strategies={strategies} onPrepare={onPrepareContent} onLoad={onLoadContent} onSave={onSaveContent} revenueCycle={revenueCycle}/>
        {revenueCycle?<AffiliateRevenueClosure program={program} onLoadContent={onLoadContent} api={revenueCycle}/>:null}
        <Card>
          <SectionHeader title="Affiliate link" description="商品URLとAffiliate tracking URLを混同しません。"/>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (linkSaving) return;
              setLinkSaving(true);
              setLinkSaveOutcome(OWNER_SAVE_STATE.SAVING);
              try {
                const saved = await onSaveLink(program.id, {
                  affiliateUrl: url,
                  linkStatus,
                  expectedUpdatedAt: program.updatedAt,
                  expectedBusinessVersion: program.businessVersion,
                });
                setUrl(saved.affiliateUrl || "");
                setLinkStatus(saved.affiliateLinkStatus === "NOT_REGISTERED" ? "ACTIVE" : saved.affiliateLinkStatus);
                setLinkDirty(false);
                setLinkSaveOutcome(OWNER_SAVE_STATE.SAVED);
                setNotice("Affiliate URLを保存しました");
              } catch (error) {
                if (error?.code === "CONFLICT") {
                  setLinkSaveOutcome(OWNER_SAVE_STATE.CONFLICT);
                  setNotice("他の更新が先に保存されました。入力内容は保持しています。最新状態を確認して、もう一度保存してください。");
                  await onRefresh?.().catch(() => {});
                } else if (error?.code === "VALIDATION_FAILED") {
                  setLinkSaveOutcome(OWNER_SAVE_STATE.SAVE_FAILED);
                  setNotice("Affiliate tracking URLの形式またはURL状態を確認してください。入力内容は保持されています。");
                } else if (["AUTH_REQUIRED", "OWNER_REQUIRED", "WORKSPACE_FORBIDDEN"].includes(error?.code)) {
                  setLinkSaveOutcome(OWNER_SAVE_STATE.SAVE_FAILED);
                  setNotice("保存権限を確認できませんでした。入力内容は保持されています。再認証後にもう一度保存してください。");
                } else {
                  setLinkSaveOutcome(OWNER_SAVE_STATE.SAVE_FAILED);
                  setNotice("Affiliate URLを保存できませんでした。入力内容は保持されています。時間をおいて再試行してください。");
                }
              } finally {
                setLinkSaving(false);
              }
            }}
          >
            <div className="av2-data-grid">
              <FormField label="Affiliate URL">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setLinkDirty(true); setLinkSaveOutcome(OWNER_SAVE_STATE.UNSAVED); }}
                />
              </FormField>
              <FormField label="URL状態">
                <Select
                  value={linkStatus}
                  onChange={(e) => { setLinkStatus(e.target.value); setLinkDirty(true); setLinkSaveOutcome(OWNER_SAVE_STATE.UNSAVED); }}
                >
                  <option>ACTIVE</option>
                  <option>PAUSED</option>
                  <option>EXPIRED</option>
                </Select>
              </FormField>
            </div>
            <Button type="submit" disabled={linkSaving}>{linkSaving ? "保存中…" : "Affiliate URLを保存"}</Button>
            <SaveState state={linkSaveState} detail={linkDirty ? "入力内容は保存完了までこの画面で保持されます。" : ""}/>
          </form>
        </Card>
        </>
      ) : null}
      {tab === "performance" ? (
        <Card>
          <SectionHeader
            title="Performance"
            description="Forecast / Actual / Evidenceを分離します。"
          />
          <dl className="av2-data-grid">
            <Data label="EPC（参考値）" value={program.epc} />
            <Data label="承認率（参考値）" value={program.approvalRate} />
            <Data label="公開状態" value={program.publicationStatus} />
            <Data
              label="Actual Revenue"
              value="この画面では作成・変更しません"
            />
          </dl>
        </Card>
      ) : null}
      {notice ? (
        <p className="av2-save-notice" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
function StrategyData({strategy={}}){return <dl className="av2-data-grid">{[["Target audience",strategy.targetAudience],["Core positioning",strategy.corePositioning],["Value proposition",strategy.valueProposition],["Key pain",strategy.keyPain],["Key message",strategy.keyMessage],["Recommended angle",strategy.recommendedAngle],["Recommended channels",strategy.recommendedChannels],["Content direction",strategy.contentDirection],["Risks",strategy.risks],["Next action",strategy.nextAction]].map(([label,value])=><Data key={label} label={label} value={Array.isArray(value)?value.join(" / "):value}/>)}</dl>}
const CONTENT_TYPES=[["THREADS","Threads"],["INSTAGRAM_POST","Instagram投稿"],["CAROUSEL_CONCEPT","カルーセル案"],["NOTE_ARTICLE","note / 記事"],["SHORT_VIDEO_SCRIPT","ショート動画台本"],["GENERIC_SOCIAL","汎用SNS"]];
function AffiliateContentCycle({program,strategies,onPrepare,onLoad,onSave,revenueCycle}){
  const[records,setRecords]=useState([]),[record,setRecord]=useState(null),[contentType,setContentType]=useState("THREADS"),[draft,setDraft]=useState(null),[status,setStatus]=useState("idle");
  const confirmed=strategies.find(x=>x.status==="CONFIRMED")||null;
  useEffect(()=>{let active=true;onLoad?.(program.id).then(rows=>{if(!active)return;setRecords(rows);const latest=rows[0]||null;setRecord(latest);if(latest)setDraft(latest.payload)}).catch(()=>setStatus("load_failed"));return()=>{active=false}},[program.id,onLoad]);
  const prepare=async()=>{if(!confirmed)return;setStatus("generating");try{const result=await onPrepare(program,confirmed.id,contentType);setDraft({workflow:"AFFILIATE_REAL_CYCLE",title:result.draft.title,content_type:contentType,body:result.draft.body,cta:result.draft.cta,asset_checklist:result.draft.assetChecklist,recommended_timing:result.draft.recommendedTiming,execution_checklist:result.draft.executionChecklist,affiliate_program_id:program.id,affiliate_strategy_id:result.strategyId,affiliate_research_id:result.researchId,review_status:"OWNER_REVIEW",execution:{state:"DRAFT",platform:contentType,final_content:result.draft.body,cta:result.draft.cta,affiliate_destination_url:program.affiliateUrl||null,pr_disclosure_reminder:"広告・PR表記とASP規約をOwnerが公開前に確認",external_url:null,published_at:null},performance:{clicks:null,conversions:null,pending_reward:null,confirmed_reward:null,rejected_reward:null,truth_class:"UNKNOWN"},analytics:{recommendation:"WAITING_FOR_REAL_EXTERNAL_RESULT",truth_class:"AI_INFERENCE"},improvement:null,truth_class:"AI_OUTPUT",evidence_status:"NOT_EVIDENCE",paid_ai_jpy:0,external_execution:"LOCKED"});setStatus("review")}catch{setStatus("failed")}};
  const save=async(lifecycleStatus="DRAFT")=>{setStatus("saving");try{await onSave({record,payload:draft,lifecycleStatus});const rows=await onLoad(program.id);setRecords(rows);setRecord(rows[0]||null);setDraft(rows[0]?.payload||draft);setStatus("saved")}catch(error){setStatus(error?.message?.includes("stale")?"stale":"failed")}};
  const set=(key,value)=>setDraft(current=>({...current,[key]:value}));
  const setExecution=(key,value)=>setDraft(current=>({...current,execution:{...current.execution,[key]:value}}));
  const setPerformance=(key,value)=>setDraft(current=>({...current,performance:{...current.performance,[key]:value===""?null:Number(value)}}));
  return <Card className="av2-content-cycle"><SectionHeader title="Strategy → Content" description="CONFIRMED StrategyからOwner確認可能なcanonical Contentを作ります。外部公開は手動です。"/>{!confirmed?<p role="alert">CONFIRMED Strategyが必要です。</p>:<><FormField label="Content種別"><Select value={contentType} onChange={e=>setContentType(e.target.value)}>{CONTENT_TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></FormField><Button type="button" disabled={status==="generating"} onClick={prepare}>{status==="generating"?"生成中…":"コンテンツを作る"}</Button></>}{draft?<><p className="av2-boundary">AI_OUTPUT · NOT_EVIDENCE · Paid AI ¥0 · External Execution LOCKED</p><FormField label="タイトル"><Input value={draft.title||""} onChange={e=>set("title",e.target.value)}/></FormField><FormField label="本文"><Textarea rows={12} value={draft.body||""} onChange={e=>{set("body",e.target.value);setExecution("final_content",e.target.value)}}/></FormField><FormField label="CTA"><Input value={draft.cta||""} onChange={e=>{set("cta",e.target.value);setExecution("cta",e.target.value)}}/></FormField><div className="av2-action-row"><Button type="button" onClick={()=>save("DRAFT")}>Owner確認内容をcanonical保存</Button></div><hr/><SectionHeader title="公開準備" description="KEVIRIOは外部公開しません。Ownerが手動公開した事実だけを記録します。"/><div className="av2-data-grid"><FormField label="Platform"><Input value={draft.execution?.platform||""} onChange={e=>setExecution("platform",e.target.value)}/></FormField><FormField label="公開状態"><Select value={draft.execution?.state||"DRAFT"} onChange={e=>setExecution("state",e.target.value)}>{["DRAFT","READY_FOR_REVIEW","APPROVED_FOR_MANUAL_EXECUTION","EXECUTED_EXTERNALLY","FAILED","ARCHIVED"].map(x=><option key={x}>{x}</option>)}</Select></FormField><FormField label="手動公開URL"><Input type="url" value={draft.execution?.external_url||""} onChange={e=>setExecution("external_url",e.target.value||null)}/></FormField><FormField label="手動公開日時"><Input type="datetime-local" value={draft.execution?.published_at?String(draft.execution.published_at).slice(0,16):""} onChange={e=>setExecution("published_at",e.target.value?new Date(e.target.value).toISOString():null)}/></FormField></div><Button type="button" onClick={()=>save("ACTIVE")}>公開準備・手動実行記録を保存</Button><hr/><SectionHeader title="Performance" description="Unknownと0を区別し、Ownerが把握した値だけを記録します。"/><div className="av2-data-grid">{[["clicks","クリック"],["conversions","成果"],["pending_reward","未確定報酬"],["confirmed_reward","確定報酬"],["rejected_reward","否認報酬"]].map(([key,label])=><FormField key={key} label={label}><Input type="number" min="0" value={draft.performance?.[key]??""} onChange={e=>setPerformance(key,e.target.value)}/></FormField>)}</div><Button type="button" onClick={()=>save("ACTIVE")}>Performanceを保存</Button><p><strong>Revenue path:</strong> {draft.performance?.confirmed_reward==null?"WAITING_FOR_REAL_EXTERNAL_RESULT":"Revenue Candidate準備可能（Actualにはしません）"}</p><p><strong>改善:</strong> {draft.analytics?.recommendation||"未記録"} · AI inference</p><p>Exact links: Program {draft.affiliate_program_id===program.id?"PASS":"INVALID"} · Strategy {draft.affiliate_strategy_id} · Research {draft.affiliate_research_id}</p></>:null}{status==="failed"?<p role="alert">保存または生成に失敗しました。canonical dataは部分更新されていません。</p>:null}{status==="stale"?<p role="alert">別端末の更新を検出しました。再読み込みしてください。</p>:null}{records.length?<p>保存済みContent {records.length}件 · version {record?.version}</p>:null}</Card>
}
function AffiliateRevenueClosure({program,onLoadContent,api}){
  const[state,setState]=useState({status:"loading",data:null,content:null}),[form,setForm]=useState({clicks:"",conversions:"",pending:"",confirmed:"",rejected:"",currency:"JPY",reference:""});
  const reload=async()=>{try{const[cycle,contents]=await Promise.all([api.load(program.id),onLoadContent(program.id)]);setState({status:"ready",data:cycle,content:contents[0]||null})}catch(error){setState({status:"blocked",error,data:null,content:null})}};
  useEffect(()=>{reload()},[program.id]);
  const publication=state.data?.publications?.[0],performance=state.data?.performance?.[0],candidate=state.data?.candidates?.[0],evidence=state.data?.evidence?.find(x=>x.candidate_id===candidate?.id),actual=state.data?.revenue?.find(x=>x.candidate_id===candidate?.id),content=state.content,draft=content?.payload;
  const markPublished=async()=>{await api.savePublication({id:publication?.id,expectedVersion:publication?.version,programId:program.id,contentId:content.id,strategyId:draft.affiliate_strategy_id,researchId:draft.affiliate_research_id,platform:draft.execution?.platform||draft.content_type,externalUrl:draft.execution?.external_url,publishedAt:draft.execution?.published_at,status:"EXECUTED_EXTERNALLY",idempotencyKey:`m032:publication:${content.id}`});await reload()};
  const record=async()=>{await api.recordPerformance({publicationId:publication.id,expectedPublicationVersion:publication.version,observedAt:new Date().toISOString(),clicks:form.clicks===""?null:Number(form.clicks),conversions:form.conversions===""?null:Number(form.conversions),pendingRewardMinor:form.pending===""?null:Number(form.pending),confirmedRewardMinor:form.confirmed===""?null:Number(form.confirmed),rejectedRewardMinor:form.rejected===""?null:Number(form.rejected),currency:[form.pending,form.confirmed,form.rejected].some(x=>x!=="")?form.currency:null,source:"OWNER_MANUAL",idempotencyKey:`m032:performance:${publication.id}:${new Date().toISOString().slice(0,10)}`});await reload()};
  const makeCandidate=async()=>{await api.createCandidate({performanceId:performance.id,status:"CANDIDATE",amountMinor:Number(form.confirmed),currency:form.currency,rewardState:"CONFIRMED",source:"OWNER_MANUAL",confirmationAt:new Date().toISOString(),provenance:{source:"OWNER_MANUAL",truth_class:"OWNER_REPORTED",ai_output_is_evidence:false},idempotencyKey:`m032:candidate:${performance.id}:confirmed`});await reload()};
  const addEvidence=async()=>{await api.attachEvidence({candidateId:candidate.id,expectedVersion:candidate.version,type:"OWNER_VERIFIED_PROOF",reference:form.reference,amountMinor:candidate.amount_minor,currency:candidate.currency,occurredAt:new Date().toISOString(),provenance:{source:"OWNER_MANUAL",truth_class:"OWNER_REPORTED",ai_output_is_evidence:false},idempotencyKey:`m032:evidence:${candidate.id}`});await reload()};
  const confirmActual=async()=>{await api.confirmActual({candidateId:candidate.id,expectedVersion:candidate.version,evidenceId:evidence.id,idempotencyKey:`m032:actual:${candidate.id}`});await reload()};
  if(state.status==="blocked")return <Card><p role="status">Revenue CycleはM032 Production承認待ちです。既存Contentは変更されません。</p></Card>;
  if(!content)return null;
  return <Card className="av2-revenue-closure"><SectionHeader title="Revenue Cycle" description="手動公開 → 実績 → Revenue Candidate → Evidence → Owner確認 → Actual Revenue"/><p className="av2-boundary">Unknown ≠ 0 · AI output ≠ Evidence · External Execution LOCKED · Paid AI ¥0</p>{!publication?<Button type="button" disabled={!draft.execution?.external_url||!draft.execution?.published_at} onClick={markPublished}>手動公開済みとして記録</Button>:<p>Publication: {publication.execution_status} · v{publication.version}</p>}{publication?.execution_status==="EXECUTED_EXTERNALLY"&&!performance?<><div className="av2-data-grid">{[["clicks","クリック"],["conversions","成果"],["pending","未確定報酬"],["confirmed","確定報酬"],["rejected","否認報酬"]].map(([key,label])=><FormField key={key} label={label}><Input type="number" min="0" value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))}/></FormField>)}</div><Button type="button" onClick={record}>実Performanceを記録</Button></>:null}{performance&&!candidate&&performance.conversions>0&&performance.confirmed_reward_minor!=null?<Button type="button" onClick={makeCandidate}>確定報酬をRevenue Candidateにする</Button>:null}{candidate&&!evidence?<><FormField label="Evidence参照（秘密情報・認証情報は禁止）"><Input value={form.reference} onChange={e=>setForm(v=>({...v,reference:e.target.value}))}/></FormField><Button type="button" disabled={!form.reference.trim()} onClick={addEvidence}>Evidenceを添付</Button></>:null}{evidence&&!actual?<Button type="button" onClick={confirmActual}>Evidenceを確認してActual Revenueに確定</Button>:null}{actual?<p><strong>Actual Revenue:</strong> {actual.gross_amount_minor} {actual.currency} · Evidence verified</p>:null}</Card>;
}
function Data({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value == null || value === "" ? "未設定" : String(value)}</dd>
    </div>
  );
}

function GuidedAffiliateField({field,fallbackLabel,value,onChange}){
  const guide=AFFILIATE_FIELD_GUIDANCE[field],label=guide?.label||fallbackLabel,description=guide?fieldDescription(field):undefined;
  const choices=field==="rewardType"?["UNKNOWN","FIXED","PERCENTAGE","TIERED","OTHER"]:field==="listingPolicy"?["UNKNOWN","OK","PARTIAL","NG"]:field==="listingVerificationStatus"?["UNKNOWN","NOT_CONFIRMED","CONFIRMED","NONE_CONFIRMED"]:field==="sourceType"?["OWNER_MANUAL","ASP_SCREENSHOT","ASP_PDF","ASP_PAGE"]:null;
  const multiline=["conversionConditions","rejectionConditions","prPoints","listingNgWords","listingNgWordsRaw","complianceNotes","sourceNotes","ownerNotes"].includes(field);
  return <FormField label={label} description={description}>{choices?<Select value={value||"UNKNOWN"} onChange={e=>onChange(e.target.value)}>{choices.map(code=><option key={code} value={code}>{OWNER_LABELS[code]||({ASP_SCREENSHOT:"ASPスクリーンショット",ASP_PDF:"ASP PDF",ASP_PAGE:"ASP案件ページ"}[code])||code}</option>)}</Select>:multiline?<Textarea rows={field==="listingNgWords"?3:4} value={value||""} onChange={e=>onChange(e.target.value)}/>:<Input type={["epc","approvalRate","revisitWindowDays","confirmationDays"].includes(field)?"number":"text"} min={["epc","approvalRate","revisitWindowDays","confirmationDays"].includes(field)?"0":undefined} max={field==="approvalRate"?"100":undefined} step={field==="approvalRate"?"any":undefined} value={value??""} onChange={e=>onChange(e.target.value)}/>}</FormField>
}

const fileToInlineData=(file)=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("FILE_READ_FAILED"));reader.onload=()=>resolve({mimeType:file.type,data:String(reader.result).split(",")[1]||""});reader.readAsDataURL(file)});
const sameValue=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
function AffiliateAttachmentIntake({program,onExtract,onLoadDraft,onSaveDraft,onApplyToForm}){
  const[files,setFiles]=useState([]),[result,setResult]=useState(null),[selected,setSelected]=useState({}),[status,setStatus]=useState(""),[draftVersion,setDraftVersion]=useState(0);
  useEffect(()=>{let active=true;onLoadDraft(program.id).then(draft=>{if(!active||!draft)return;setDraftVersion(Number(draft.draft_version||0));const saved=draft.draft_payload?.affiliate_attachment_extraction;if(saved){setResult(saved);setSelected(Object.fromEntries((saved.fields||[]).filter(x=>!x.conflict).map(x=>[x.field,true])))}}).catch(()=>{});return()=>{active=false}},[program.id,onLoadDraft]);
  const extract=async()=>{setStatus("資料を安全に読み取っています…");try{const encoded=await Promise.all(files.map(fileToInlineData)),next=await onExtract({files:encoded,currentProgram:program});const fields=(next.fields||[]).map(item=>({...item,conflict:item.conflict||((program[item.field]!=null&&program[item.field]!=="")&&!sameValue(program[item.field],item.value))}));const normalized={...next,fields};setResult(normalized);setSelected(Object.fromEntries(fields.filter(x=>!x.conflict).map(x=>[x.field,true])));setStatus("抽出候補を確認してください。まだcanonical dataは変更されていません")}catch(error){setStatus(`読み取りを完了できませんでした: ${error.message}`)}};
  const applyDraft=async()=>{const values={};for(const item of result.fields||[])if(selected[item.field]&&!item.conflict)values[item.field]=item.field==="approvalRate"?normalizeAffiliateApprovalRate(item.value):item.value;if(values.rewardDetails){values.rewardAmount=values.rewardDetails.amount??"";values.rewardCurrency=values.rewardDetails.currency||"JPY";values.rewardRate=values.rewardDetails.rate??"";values.rewardNotes=values.rewardDetails.notes||"";delete values.rewardDetails}if(Array.isArray(values.listingNgWords))values.listingNgWords=values.listingNgWords.join("\n");const payload={affiliate_attachment_extraction:{...result,accepted_fields:Object.keys(values),accepted_at:new Date().toISOString(),canonicalApplied:false,raw_file_content_stored:false,paid_ai_jpy:0,external_execution:"LOCKED"},proposed_changes:values};const saved=await onSaveDraft(program.id,{expectedDraftVersion:draftVersion,baseProgramUpdatedAt:program.updatedAt,draftPayload:payload});setDraftVersion(Number(saved?.draft_version||draftVersion+1));onApplyToForm(values);setStatus("抽出候補をDraftへ保存し、編集フォームへ反映しました。canonical保存にはOwnerの「変更を保存」が必要です")};
  const extracted=result?.fields?.filter(x=>x.confidence==="HIGH"&&!x.conflict).length||0,review=result?.fields?.filter(x=>x.conflict||x.confidence!=="HIGH").length||0,missing=result?.missing?.length||0;
  return <Card className="av2-attachment-intake"><SectionHeader title="資料から入力" description="画像・スクリーンショット・PDFから見える事実だけを候補化します。AI output ≠ Evidence。"/><FormField label="Affiliate資料" description="PNG / JPEG / WebP / PDF、最大4件・各2.5MB"><Input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple onChange={e=>setFiles([...e.target.files].slice(0,4))}/></FormField><Button type="button" disabled={!files.length} onClick={extract}>AIで候補を抽出（FREE）</Button>{result?<><div className="av2-extraction-summary"><strong>抽出済み: {extracted}項目</strong><strong>要確認: {review}項目</strong><strong>未取得: {missing}項目</strong></div><div className="av2-extraction-list">{result.fields.map(item=><article key={item.field} className={item.conflict?"is-conflict":""}><header><strong>{fieldLabel(item.field)}</strong><Badge label={item.conflict?"CONFLICT DETECTED":item.confidence}/></header><p><span>現在:</span> {program[item.field]==null||program[item.field]===""?"未入力":String(program[item.field])}</p><p><span>候補:</span> {typeof item.value==="object"?JSON.stringify(item.value):String(item.value)}</p><small>Source: {item.sources?.join(" / ")||"資料"}</small><label><input type="checkbox" checked={Boolean(selected[item.field])} disabled={item.conflict} onChange={e=>setSelected(v=>({...v,[item.field]:e.target.checked}))}/> Draftへ適用</label>{item.conflict?<small>既存値と異なるため自動選択しません。Ownerが編集フォームで確認してください。</small>:null}</article>)}</div><div className="av2-action-row"><Button type="button" variant="secondary" onClick={()=>setSelected(Object.fromEntries(result.fields.filter(x=>!x.conflict).map(x=>[x.field,true])))}>競合なしをすべて選択</Button><Button type="button" onClick={applyDraft}>選択項目をDraftへ適用</Button></div></>:null}{status?<p role="status" className="av2-save-notice">{status}</p>:null}<p className="av2-boundary">Raw fileはKEVIRIO DBへ保存しません · Actual Revenue / Evidence / Conversionは作成しません · External Execution LOCKED</p></Card>
}
