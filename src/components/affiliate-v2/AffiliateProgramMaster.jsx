import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
  SectionHeader,
  Select,
} from "../../design-system/index.js";
import { listingComplianceLabel } from "../../domain/affiliateProgramMaster.js";
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
const missing = (p) =>
  [
    !p.rewardSummary && "報酬概要",
    p.epc == null && "EPC",
    p.approvalRate == null && "承認率",
    !p.conversionConditions && "成果条件",
    !p.rejectionConditions && "否認条件",
    p.listingVerificationStatus !== "CONFIRMED" && "掲載条件の確認",
    !p.sourceVerifiedAt && "情報の確認日時",
  ].filter(Boolean);

export default function AffiliateProgramMaster(props) {
  const { programs = [], available = true } = props;
  const [selectedId, setSelectedId] = useState(null),
    [query, setQuery] = useState(""),
    [state, setState] = useState("ALL"),
    [registering, setRegistering] = useState(false);
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
        onClose={() => setSelectedId(null)}
      />
    );
  return (
    <section className="av2-program-master">
      <div className="av2-program-master__heading">
        <SectionHeader
          title="Affiliate Programs"
          description="提携案件を探す・整える・次の行動へ進めるProgram Master"
        />
        <Button onClick={() => setRegistering((v) => !v)}>
          {registering ? "登録を閉じる" : "＋ 新しいProgram"}
        </Button>
      </div>
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
            onClick={() => setSelectedId(p.id)}
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
      k === "promotion_channels"
        ? e.target.value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : k === "priority"
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
        <FormField label="推奨チャネル（カンマ区切り）">
          <Input
            value={form.promotion_channels.join(", ")}
            onChange={change("promotion_channels")}
          />
        </FormField>
        <FormField label="優先度 1–5">
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
  onUpdate,
  onUpdatePractical,
  onDeleteSafe,
  onLoadDraft,
  onSaveDraft,
  onUpdateOperational,
}) {
  const [tab, setTab] = useState("overview"),
    [notice, setNotice] = useState(null),
    [url, setUrl] = useState(program.affiliateUrl || ""),
    [linkStatus, setLinkStatus] = useState(
      program.affiliateLinkStatus === "NOT_REGISTERED"
        ? "ACTIVE"
        : program.affiliateLinkStatus,
    );
  const [edit, setEdit] = useState(
    Object.fromEntries([
      ["aspName", program.aspName],
      ["programId", program.programId],
      ["programName", program.programName],
      ["advertiserName", program.advertiserName],
      ["category", program.category || ""],
      ["rewardType", program.rewardType || "UNKNOWN"],
      ["rewardSummary", program.rewardSummary || ""],
      ["rewardDetails", program.rewardDetails ? JSON.stringify(program.rewardDetails) : ""],
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
      const changes={...edit,rewardDetails:edit.rewardDetails?JSON.parse(edit.rewardDetails):null,epc:edit.epc===""?null:Number(edit.epc),approvalRate:edit.approvalRate===""?null:Number(edit.approvalRate),revisitWindowDays:edit.revisitWindowDays===""?null:Number(edit.revisitWindowDays),confirmationDays:edit.confirmationDays===""?null:Number(edit.confirmationDays),listingNgWords:edit.listingVerificationStatus==="NOT_CONFIRMED"?null:edit.listingNgWords.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),sourceVerifiedAt:edit.sourceVerifiedAt?new Date(edit.sourceVerifiedAt).toISOString():null};
      await onUpdatePractical(program.id,{expectedUpdatedAt:program.updatedAt,expectedBusinessVersion:program.businessVersion,changes});
      setNotice("全項目をcanonical保存しました。再読み込み後も維持されます");
    } catch { setNotice("入力形式、競合、または保存に失敗しました。再読み込みしてください"); }
  };
  const remove = async () => {
    if(!confirm("依存履歴がない場合だけ完全に削除します。続けますか？"))return;
    try{const result=await onDeleteSafe(program.id,{expectedUpdatedAt:program.updatedAt,expectedBusinessVersion:program.businessVersion,idempotencyKey:`affiliate:delete:${program.id}:v${program.businessVersion}`});if(result?.deleted)onClose();else setNotice(`削除不可: ${result?.classification||"PROTECTED_HISTORY"}`)}catch{setNotice("削除判定に失敗しました。データは変更されていません")}
  };
  const miss = missing(program);
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
      <div className="av2-readiness">
        <strong>情報充足度 {completeness(program)}%</strong>
        <span>
          Research readiness: {miss.length ? `${miss.length}項目不足` : "READY"}
        </span>
        {miss.length ? <small>不足: {miss.join("、")}</small> : null}
      </div>
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
                  rewardDetails: "報酬詳細（JSON）",
                  epc: "EPC",
                  approvalRate: "承認率 %",
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
                  <FormField key={k} label={l}>
                    <Input
                      value={edit[k]}
                      onChange={(e) =>
                        setEdit((v) => ({ ...v, [k]: e.target.value }))
                      }
                    />
                  </FormField>
                ))}
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
        </Card>
      ) : null}
      {tab === "content" ? (
        <Card>
          <SectionHeader
            title="Content plan"
            description="外部公開は自動実行しません。"
          />
          <p>{program.contentPlan || "コンテンツ計画が未設定です。"}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await onSaveLink(program.id, { affiliateUrl: url, linkStatus });
                setNotice("Affiliate URLを保存しました");
              } catch {
                setNotice("Affiliate URLを保存できません");
              }
            }}
          >
            <div className="av2-data-grid">
              <FormField label="Affiliate URL">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </FormField>
              <FormField label="URL状態">
                <Select
                  value={linkStatus}
                  onChange={(e) => setLinkStatus(e.target.value)}
                >
                  <option>ACTIVE</option>
                  <option>PAUSED</option>
                  <option>EXPIRED</option>
                </Select>
              </FormField>
            </div>
            <Button type="submit">Affiliate URLを保存</Button>
          </form>
        </Card>
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
function Data({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value == null || value === "" ? "未設定" : String(value)}</dd>
    </div>
  );
}
