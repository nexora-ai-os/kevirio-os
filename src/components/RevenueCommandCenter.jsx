import { useEffect, useMemo, useState } from "react";
import { mvp15WorkforceRegistry } from "../data/aiWorkforceRegistry.js";
import { mockEventLedger } from "../data/mockEventLedger.js";
import { CAMPAIGN_TYPES } from "../services/revenueCampaignService";
import { validateEventLedger } from "../services/eventLedgerService.js";
import OwnerActionQueue from "./OwnerActionQueue";
import RevenueSummaryCards from "./RevenueSummaryCards";
import ProductionFoundationPanel from "./ProductionFoundationPanel";
import { createRevenueRepository } from "../repositories/revenueRepository.js";
import { buildCanonicalRevenueOverview } from "../domain/canonicalRevenueOverview.js";

const detailStages = ["Opportunity", "Campaign", "Package", "Approval", "Result", "Revenue"];
const priorityEmployeeIds = ["F01", "M26", "F24", "F04", "F16"];

function getCampaignTypeCount(campaigns, campaignType) {
  return campaigns.filter((campaign) => campaign.campaignType === campaignType).length;
}

function getPendingApprovals(approvals, approvalsOS) {
  return [...approvals, ...approvalsOS].filter((item) => String(item.status || "").includes("待") || String(item.status || "").includes("謇")).length;
}

function getForecastRevenue(forecasts) {
  return forecasts.find((item) => String(item.label || "").includes("Revenue") || String(item.label || "").includes("売上") || String(item.label || "").includes("螢"))?.value || 0;
}

function getMockRevenue(revenues) {
  return revenues.find((item) => String(item.label || "").includes("Mock"))?.value || revenues[0]?.value || 0;
}

function buildOwnerActions({ hasCampaigns, pendingApprovals, canonicalNextAction }) {
  return [
    {...canonicalNextAction,aiOwner:"Aegis / Revenue Operator"},
    {
      title: hasCampaigns ? "Revenue Packageを確認する" : "Campaignを作成する",
      reason: hasCampaigns ? "次の判断は、収益化パッケージの確認です。" : "収益化の起点になるMock Campaignが必要です。",
      nextScreen: "Campaign",
      page: "campaign",
      aiOwner: "Aegis / Ren",
    },
    {
      title: "Legal確認を進める",
      reason: "公開や外部意図の前に、Mockレビューが必要です。",
      nextScreen: "Operations",
      page: "operations",
      aiOwner: "Aoi",
    },
    {
      title: "Brand QAを見る",
      reason: "表現・導線・クリエイティブのズレを先に減らします。",
      nextScreen: "Campaign",
      page: "campaign",
      aiOwner: "Yui / Kana",
    },
    {
      title: "Performanceを確認する",
      reason: "Forecast、Mock、検証済みActualを分けて確認します。",
      nextScreen: "Analytics",
      page: "analytics",
      aiOwner: "Hana",
    },
  ].slice(0,5);
}

function ToggleButton({ open, onClick, children }) {
  return (
    <button className="detail-toggle" onClick={onClick} type="button">
      {open ? "閉じる" : children}
    </button>
  );
}

function PipelineSummary({ shortTermCount, coreMediaCount, expanded, onToggle }) {
  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Revenue Pipeline</p>
          <h2>収益パイプライン</h2>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>詳細を見る</ToggleButton>
      </div>
      <div className="pipeline-summary-grid">
        <div>
          <span>短期収益</span>
          <strong>進行中 {shortTermCount}件</strong>
          <p>SHORT_TERM_SERVICE</p>
        </div>
        <div>
          <span>本命事業</span>
          <strong>準備中 {coreMediaCount}件</strong>
          <p>CORE_MEDIA</p>
        </div>
      </div>
      {expanded && (
        <div className="pipeline-detail-flow">
          {detailStages.map((stage) => (
            <span key={stage}>{stage}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function AiSummary({ expanded, onToggle }) {
  const activeCount = mvp15WorkforceRegistry.filter((employee) => employee.runtimeStatus === "MOCK_READY").length;
  const priorityEmployees = priorityEmployeeIds.map((id) => mvp15WorkforceRegistry.find((employee) => employee.employeeId === id)).filter(Boolean);
  const employees = expanded ? mvp15WorkforceRegistry : priorityEmployees;

  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">AI Workforce</p>
          <h2>AI社員</h2>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>全員を見る</ToggleButton>
      </div>
      <div className="ai-summary-strip">
        <div><strong>{activeCount}名</strong><span>Mock稼働</span></div>
        <div><strong>0名</strong><span>要確認</span></div>
        <div><strong>0名</strong><span>停止中</span></div>
        <div><strong>無効</strong><span>外部実行</span></div>
      </div>
      <div className="workforce-summary-grid compact">
        {employees.map((employee) => (
          <div className="workforce-summary-card" key={employee.employeeId}>
            <span className="badge">{employee.employeeId}</span>
            <strong>{employee.displayName}</strong>
            <p>{employee.departmentName}</p>
            <ul>
              <li>担当: {employee.supportedArtifactTypes[0]}</li>
              <li>Mock稼働: true</li>
              <li>次の仕事: {employee.primaryResponsibilities[0]}</li>
              <li>停止理由: 外部実行無効</li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function EventSummary({ expanded, onToggle }) {
  const eventValidation = validateEventLedger(mockEventLedger);
  const events = [...mockEventLedger].sort((a, b) => b.sequenceNo - a.sequenceNo).slice(0, expanded ? 6 : 3);

  return (
    <section className="panel compact-command-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Event Summary</p>
          <h2>最新イベント履歴</h2>
          <p className="muted">Mock監査履歴 / 正式な監査証跡ではありません</p>
        </div>
        <ToggleButton open={expanded} onClick={onToggle}>履歴を見る</ToggleButton>
      </div>
      <div className="event-summary-list compact">
        {events.map((event) => (
          <div className="event-summary-item" key={event.eventId}>
            <span>{event.sequenceNo}</span>
            <strong>{event.eventName}</strong>
            <small>{event.actor.displayName} / {event.target.targetType}</small>
            <em>{event.occurredAt}</em>
          </div>
        ))}
      </div>
      <small className="command-note">Validation: {eventValidation.valid ? "OK" : "NG"} / Read only</small>
    </section>
  );
}

export default function RevenueCommandCenter({
  approvals = [],
  approvalsOS = [],
  forecasts = [],
  revenues = [],
  revenueCampaigns = [],
  campaigns = [],
  tasks = [],
  budget,
  setPage,
  ownerSession,
  ownerSupabaseClient,
}) {
  const [openPanel, setOpenPanel] = useState("");
  const repository=useMemo(()=>createRevenueRepository(ownerSupabaseClient),[ownerSupabaseClient]);
  const [canonical,setCanonical]=useState(null);
  useEffect(()=>{let active=true;(async()=>{try{const context=await repository.loadContext();const snapshot=await repository.loadSnapshot(context.workspace.id);if(active)setCanonical(buildCanonicalRevenueOverview(snapshot));}catch{if(active)setCanonical(null);}})();return()=>{active=false};},[repository]);
  const combinedCampaignCount = canonical?.campaignCount ?? revenueCampaigns.length + campaigns.length;
  const shortTermCount = getCampaignTypeCount(revenueCampaigns, CAMPAIGN_TYPES.SHORT_TERM_SERVICE);
  const coreMediaCount = getCampaignTypeCount(revenueCampaigns, CAMPAIGN_TYPES.CORE_MEDIA) + campaigns.length;
  const pendingApprovals = canonical?.pendingApprovals ?? getPendingApprovals(approvals, approvalsOS);
  const activeAi = mvp15WorkforceRegistry.filter((employee) => employee.runtimeStatus === "MOCK_READY").length;
  const openTasks = tasks.filter((task) => task.status !== "done").length;
  const forecastRevenue = getForecastRevenue(forecasts);
  const mockRevenue = getMockRevenue(revenues);
  const ownerActions = buildOwnerActions({ hasCampaigns: combinedCampaignCount > 0, pendingApprovals,canonicalNextAction:canonical?.nextAction || {title:"Remote Revenue状態を確認する",reason:"Supabase Repositoryを確認中です。",page:"production",nextScreen:"Production Revenue"} });
  const nextAction = ownerActions[0];

  const togglePanel = (panelName) => setOpenPanel((current) => (current === panelName ? "" : panelName));

  return (
    <main className="content revenue-command-center">
      <ProductionFoundationPanel ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient} />
      <section className="hero revenue-command-hero simplified">
        <div>
          <p className="eyebrow">売上司令室 / Revenue Command Center</p>
          <h1>おはようございます。今日の優先事項を確認しましょう。</h1>
          <p className="lead">
            SupabaseのCanonical Revenue状態から、Ownerが次に行う1件だけを提示します。外部実行は引き続き行いません。
          </p>
          <div className="connection-flow">
            <span>Owner認証済み</span>
            <span>Canonical Repository</span>
            <span>ActualはEvidence検証限定</span>
            <span>External LOCKED</span>
          </div>
        </div>
        <div className="today-focus-card">
          <p className="eyebrow">今日やること</p>
          <strong>{nextAction.title}</strong>
          <p>まずはこの1件を確認してください。</p>
          <button type="button" onClick={() => setPage(nextAction.page)}>確認先へ移動</button>
        </div>
      </section>

      <OwnerActionQueue actions={ownerActions} setPage={setPage} />

      <RevenueSummaryCards
        campaignCount={combinedCampaignCount}
        pendingApprovals={pendingApprovals}
        pipelineCount={openTasks}
        forecastRevenue={forecastRevenue}
        mockRevenue={mockRevenue}
        budgetRemaining={budget?.monthlyRemaining || 0}
        activeAi={activeAi}
        eventCount={mockEventLedger.length}
        actualRevenue={canonical?.netActualMinor || 0}
        actualConnected={Boolean(canonical)}
        expanded={openPanel === "kpi"}
      />

      <section className="command-collapse-row">
        <ToggleButton open={openPanel === "kpi"} onClick={() => togglePanel("kpi")}>補助KPIを見る</ToggleButton>
        <ToggleButton open={openPanel === "pipeline"} onClick={() => togglePanel("pipeline")}>Pipeline詳細</ToggleButton>
        <ToggleButton open={openPanel === "ai"} onClick={() => togglePanel("ai")}>AI社員詳細</ToggleButton>
        <ToggleButton open={openPanel === "events"} onClick={() => togglePanel("events")}>Event履歴</ToggleButton>
      </section>

      <PipelineSummary
        shortTermCount={shortTermCount}
        coreMediaCount={coreMediaCount}
        expanded={openPanel === "pipeline"}
        onToggle={() => togglePanel("pipeline")}
      />

      <AiSummary expanded={openPanel === "ai"} onToggle={() => togglePanel("ai")} />

      <EventSummary expanded={openPanel === "events"} onToggle={() => togglePanel("events")} />
    </main>
  );
}
