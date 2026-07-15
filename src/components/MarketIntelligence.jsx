import { useMemo, useState } from "react";
import "./MarketIntelligence.css";
import { mockMarketSignals } from "../data/mockMarketSignals";
import {
  getDecisionStorageKey,
  getMarketDecisionForOpportunity,
  loadMarketDecisions,
  saveMarketDecision,
} from "../services/marketDecisionService";
import {
  getOwnerReviewCandidateForDecision,
  loadOwnerReviewCandidates,
  markOwnerReviewCandidateSuperseded,
  saveRevenueDecisionVerticalSlice,
} from "../services/ownerReviewCandidateAdapter";
import { buildMarketIntelligenceFoundation } from "../services/marketIntelligenceEngine";
import { buildMarketIntelligenceViewModel } from "../services/marketIntelligenceAdapter";

const SANDBOX_EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const SANDBOX_EVALUATION_TIMESTAMP = Date.parse(SANDBOX_EVALUATION_TIME);
const STORAGE_CORRUPTED_COPY = "判断データを確認できないため、安全のため未選択として表示しています。";

const HOLD_REASON_OPTIONS = [
  { value: "NEEDS_MORE_EVIDENCE", label: "根拠を追加確認" },
  { value: "REVIEW_LATER", label: "後でもう一度確認" },
  { value: "BUDGET_REVIEW", label: "費用条件を確認" },
];

const REJECT_REASON_OPTIONS = [
  { value: "NOT_STRATEGIC_FIT", label: "現在の方針に合わない" },
  { value: "OWNER_EFFORT_TOO_HIGH", label: "Owner負荷が大きい" },
  { value: "REVENUE_PATH_WEAK", label: "収益化経路が弱い" },
];

function formatSnapshotDate(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function laneLabel(lane) {
  return lane === "asset" ? "資産形成" : "短期収益";
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getDecisionStatusCopy(decision, storageStatus, saveFailure, reviewCandidate, verticalFailure) {
  if (storageStatus === "corrupted") {
    return {
      label: "判断データ破損",
      detail: STORAGE_CORRUPTED_COPY,
    };
  }
  if (verticalFailure) {
    return {
      label: "レビュー待ち登録失敗",
      detail: "判断は保存しましたが、下流候補の保存は安全のため停止しました。",
    };
  }
  if (saveFailure) {
    return {
      label: "保存失敗",
      detail: "保存できませんでした。現在の判断は変更されていません。",
    };
  }
  if (!decision) {
    return {
      label: "未選択",
      detail: "進める・保留・却下のいずれかを選択してください。",
    };
  }
  if (decision.decision === "approved") {
    if (reviewCandidate) {
      return {
        label: "選択済み: 進める",
        detail: "AI社員がMock Campaign案とContent Briefを作成し、レビュー待ちへ送りました。",
      };
    }
    return {
      label: "選択済み: 進める",
      detail: "Mock Campaign案の作成候補です。",
    };
  }
  if (decision.decision === "hold") {
    return {
      label: "保留",
      detail: decision.reasonLabel,
    };
  }
  return {
    label: "却下",
    detail: decision.reasonLabel,
  };
}

function buildDecisionNextAction(recommendations, decisionState) {
  if (decisionState.storageStatus === "corrupted") {
    return {
      label: "判断データ確認",
      title: STORAGE_CORRUPTED_COPY,
    };
  }

  const workspace = decisionState.workspace;
  const undecided = recommendations.find((recommendation) => (
    !getMarketDecisionForOpportunity(workspace, recommendation.opportunityId, recommendation.opportunityVersion)
  ));
  if (undecided) {
    return {
      label: `次の判断: ${undecided.rank}位`,
      title: undecided.primary.title,
    };
  }

  const held = recommendations.find((recommendation) => (
    getMarketDecisionForOpportunity(workspace, recommendation.opportunityId, recommendation.opportunityVersion)?.decision === "hold"
  ));
  if (held) {
    return {
      label: "保留中",
      title: `${held.primary.title}を後で再確認します`,
    };
  }

  return {
    label: "判断完了",
    title: "市場候補3件の判断が完了しました",
  };
}

function buildReviewQueueCount(reviewWorkspace) {
  if (!reviewWorkspace?.reviewCandidatesById) return 0;
  return Object.values(reviewWorkspace.reviewCandidatesById).filter((candidate) => candidate.status === "reviewPending").length;
}

function StatusPanel({ viewModel }) {
  if (viewModel.status === "ready") return null;

  const statusCopy = {
    empty: {
      title: "現在表示できるSandbox候補はありません",
      body: "Mock Signalから再構築できる候補がない状態です。",
    },
    hold: {
      title: "市場候補の再確認が必要です",
      body: "安全に表示できる条件を満たさない候補があります。",
    },
    rejected: {
      title: "安全条件を満たさないため表示を停止しました",
      body: "Mock Only境界、評価時刻、またはRevenue境界を確認してください。",
    },
  };

  const copy = statusCopy[viewModel.status] || statusCopy.rejected;

  return (
    <section className="mi-panel mi-status-panel" aria-live="polite">
      <p className="eyebrow">状態</p>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      {viewModel.blocked.reasonSummary.length > 0 && (
        <div className="mi-reason-list">
          {viewModel.blocked.reasonSummary.map((reason) => (
            <div key={reason.reasonCode}>
              <strong>{reason.ownerMessage}</strong>
              <span>{reason.count}件</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  recommendation,
  decision,
  storageStatus,
  saveFailure,
  reasonSelection,
  reviewCandidate,
  onReasonChange,
  onDecision,
}) {
  const [open, setOpen] = useState(false);
  const detailId = `market-detail-${recommendation.opportunityId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const decisionKey = getDecisionStorageKey(recommendation.opportunityId, recommendation.opportunityVersion);
  const detail = recommendation.details;
  const forecast = recommendation.primary.forecastRange;
  const activeDecision = storageStatus === "corrupted" ? null : decision;
  const statusCopy = getDecisionStatusCopy(activeDecision, storageStatus, saveFailure, reviewCandidate, saveFailure === "vertical");
  const isDecisionDisabled = storageStatus === "corrupted";
  const holdReason = reasonSelection?.hold || "REVIEW_LATER";
  const rejectReason = reasonSelection?.rejected || "NOT_STRATEGIC_FIT";

  return (
    <article className="mi-card">
      <div className="mi-card__head">
        <span className="mi-rank">#{recommendation.rank}</span>
        <span className={`mi-lane mi-lane--${recommendation.lane}`}>{laneLabel(recommendation.lane)}</span>
      </div>

      <h2>{recommendation.primary.title}</h2>
      <div className="mi-primary-list">
        <div>
          <span>推定売上 Low〜Base</span>
          <strong>{recommendation.primary.forecastLabel}</strong>
        </div>
        <div>
          <span>信頼度</span>
          <strong>{recommendation.primary.confidenceLabel}</strong>
        </div>
        <div>
          <span>次の行動</span>
          <strong>{recommendation.primary.nextAction}</strong>
        </div>
        <div>
          <span>主なリスク</span>
          <strong>{recommendation.primary.mainRisk}</strong>
        </div>
      </div>

      <section className="mi-decision-panel" aria-live="polite">
        <div className="mi-decision-status">
          <span>Owner判断</span>
          <strong>{statusCopy.label}</strong>
          <small>{statusCopy.detail}</small>
        </div>

        {saveFailure && (
          <p className="mi-decision-alert" role="alert">
            {saveFailure === "vertical"
              ? "判断は保存済みです。Review Queue登録は安全境界で停止しました。"
              : "保存できませんでした。外部送信やCampaign作成は行っていません。"}
          </p>
        )}
        {storageStatus === "corrupted" && (
          <p className="mi-decision-alert" role="alert">
            {STORAGE_CORRUPTED_COPY}
          </p>
        )}

        <div className="mi-decision-buttons" aria-label={`${recommendation.primary.title}のOwner判断`}>
          <button
            type="button"
            aria-pressed={activeDecision?.decision === "approved"}
            disabled={isDecisionDisabled}
            title={isDecisionDisabled ? "判断データ破損のため保存できません" : "Mock Campaign案の作成候補として選択"}
            onClick={() => onDecision(recommendation, "approved", "OWNER_SELECTED_FOR_MOCK_CAMPAIGN")}
          >
            進める
          </button>
          <button
            type="button"
            aria-pressed={activeDecision?.decision === "hold"}
            disabled={isDecisionDisabled}
            title={isDecisionDisabled ? "判断データ破損のため保存できません" : "後で再確認する"}
            onClick={() => onDecision(recommendation, "hold", holdReason)}
          >
            保留
          </button>
          <button
            type="button"
            aria-pressed={activeDecision?.decision === "rejected"}
            disabled={isDecisionDisabled}
            title={isDecisionDisabled ? "判断データ破損のため保存できません" : "このOpportunity Versionを進めない"}
            onClick={() => onDecision(recommendation, "rejected", rejectReason)}
          >
            却下
          </button>
        </div>

        <div className="mi-reason-controls">
          <label>
            <span>保留理由</span>
            <select
              value={holdReason}
              disabled={isDecisionDisabled}
              onChange={(event) => onReasonChange(decisionKey, "hold", event.target.value)}
            >
              {HOLD_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>却下理由</span>
            <select
              value={rejectReason}
              disabled={isDecisionDisabled}
              onChange={(event) => onReasonChange(decisionKey, "rejected", event.target.value)}
            >
              {REJECT_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <button
        className="mi-detail-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((value) => !value)}
      >
        根拠を見る
      </button>

      <div id={detailId} className="mi-details" hidden={!open}>
        <div className="mi-detail-section">
          <h3>市場概要</h3>
          <dl>
            <div><dt>顧客課題</dt><dd>{detail.customerProblem}</dd></div>
            <div><dt>対象者</dt><dd>{detail.targetAudience}</dd></div>
            <div><dt>収益モデル</dt><dd>{detail.revenueModel}</dd></div>
            <div><dt>推奨チャネル</dt><dd>{detail.recommendedChannel}</dd></div>
          </dl>
        </div>

        <div className="mi-detail-section">
          <h3>評価</h3>
          <dl className="mi-metric-list">
            <div><dt>総合スコア</dt><dd>{detail.finalScore}</dd></div>
            <div><dt>基礎スコア</dt><dd>{detail.baseScore}</dd></div>
            <div><dt>減点</dt><dd>{detail.totalPenalty}</dd></div>
            <div><dt>初売上目安</dt><dd>{detail.estimatedTimeToRevenue}日</dd></div>
          </dl>
        </div>

        <div className="mi-detail-section">
          <h3>収益予測</h3>
          <dl className="mi-metric-list">
            <div><dt>Low</dt><dd>¥{forecast.low.toLocaleString()}</dd></div>
            <div><dt>Base</dt><dd>¥{forecast.base.toLocaleString()}</dd></div>
            <div><dt>High</dt><dd>¥{forecast.high.toLocaleString()}</dd></div>
            <div><dt>期間</dt><dd>{forecast.periodDays}日</dd></div>
          </dl>
        </div>

        <div className="mi-detail-section">
          <h3>根拠</h3>
          <dl className="mi-metric-list">
            <div><dt>シグナル</dt><dd>{detail.supportingSignalCount}件</dd></div>
            <div><dt>情報源</dt><dd>{detail.sourceTypeCount}種類</dd></div>
            <div><dt>有効期限</dt><dd>{recommendation.primary.expiresAt}</dd></div>
          </dl>
        </div>

        <div className="mi-detail-group">
          <strong>予測の前提</strong>
          <ul>{detail.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="mi-detail-group">
          <strong>収益化の根拠</strong>
          <ul>{detail.monetizationEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="mi-detail-group">
          <strong>リスク</strong>
          <ul>{detail.riskFlags.length ? detail.riskFlags.map((item) => <li key={item}>{item}</li>) : <li>重大なリスクは検出されていません</li>}</ul>
        </div>
        <div className="mi-detail-group">
          <strong>情報源</strong>
          <ul>{detail.provenanceSummary.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    </article>
  );
}

export default function MarketIntelligence() {
  const [decisionState, setDecisionState] = useState(() => loadMarketDecisions(getBrowserStorage()));
  const [reviewState, setReviewState] = useState(() => loadOwnerReviewCandidates(getBrowserStorage()));
  const [reasonSelections, setReasonSelections] = useState({});
  const [saveFailures, setSaveFailures] = useState({});
  const viewModel = useMemo(() => {
    const foundation = buildMarketIntelligenceFoundation(mockMarketSignals, SANDBOX_EVALUATION_TIMESTAMP);
    return buildMarketIntelligenceViewModel(foundation, SANDBOX_EVALUATION_TIME);
  }, []);

  const snapshotDate = formatSnapshotDate(SANDBOX_EVALUATION_TIME);
  const decisionNextAction = buildDecisionNextAction(viewModel.recommendations, decisionState);

  function handleReasonChange(decisionKey, type, value) {
    setReasonSelections((current) => ({
      ...current,
      [decisionKey]: {
        ...current[decisionKey],
        [type]: value,
      },
    }));
  }

  function handleDecision(recommendation, decision, reasonCode) {
    const decisionKey = getDecisionStorageKey(recommendation.opportunityId, recommendation.opportunityVersion);
    const result = saveMarketDecision(getBrowserStorage(), {
      opportunityId: recommendation.opportunityId,
      opportunityVersion: recommendation.opportunityVersion,
      marketId: recommendation.marketId,
      correlationId: recommendation.correlationId,
      decision,
      reasonCode,
      decidedAt: new Date().toISOString(),
    });

    if (result.ok) {
      setDecisionState(result);
      if (decision === "approved") {
        const verticalResult = saveRevenueDecisionVerticalSlice(getBrowserStorage(), {
          recommendation,
          ownerDecision: result.decision,
          createdAt: result.decision.decidedAt,
        });
        if (verticalResult.ok) {
          setReviewState(loadOwnerReviewCandidates(getBrowserStorage()));
        } else {
          setSaveFailures((current) => ({ ...current, [decisionKey]: "vertical" }));
          return;
        }
      } else {
        markOwnerReviewCandidateSuperseded(
          getBrowserStorage(),
          result.decision.decisionId,
          result.decision.decidedAt,
          "owner_decision_changed"
        );
        setReviewState(loadOwnerReviewCandidates(getBrowserStorage()));
      }
      setSaveFailures((current) => {
        const next = { ...current };
        delete next[decisionKey];
        return next;
      });
      return;
    }

    setSaveFailures((current) => ({ ...current, [decisionKey]: true }));
    if (result.storageStatus === "corrupted") {
      setDecisionState(result);
    }
  }

  return (
    <main className="content market-intelligence">
      <section className="mi-panel mi-briefing">
        <div>
          <h1>市場インテリジェンス</h1>
          <p className="lead">{viewModel.briefing.summary}</p>
        </div>
        <div className="mi-briefing__side" aria-label="Sandbox safety summary">
          <strong>Sandbox候補 {viewModel.briefing.recommendationCount}件</strong>
          <small>実売上未接続 / 基準日: {snapshotDate}</small>
        </div>
      </section>

      <section className="mi-panel mi-next-action">
        <div>
          <span>{decisionNextAction.label}</span>
          <strong>{decisionNextAction.title || "表示できる候補はありません"}</strong>
        </div>
      </section>

      <section className="mi-safety-strip" aria-label="Safety summary">
        <span>Sandbox模擬データ / 外部通信なし / Productionなし / 実売上未接続 / Mock Handoffのみ / Review QueueはWorkspace保存</span>
      </section>

      <section className="mi-panel mi-review-queue-status" aria-live="polite">
        <span>Owner Review Queue</span>
        <strong>{buildReviewQueueCount(reviewState.workspace)}件レビュー待ち</strong>
        <small>Mock Campaign案 / Content Brief / Draft Candidateのみ。公開・外部送信は行いません。</small>
      </section>

      <StatusPanel viewModel={viewModel} />

      {viewModel.status === "ready" && (
        <section className="mi-recommendations" aria-label="Sandbox推薦市場">
          {viewModel.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.opportunityId}
              recommendation={recommendation}
              decision={getMarketDecisionForOpportunity(decisionState.workspace, recommendation.opportunityId, recommendation.opportunityVersion)}
              storageStatus={decisionState.storageStatus}
              saveFailure={saveFailures[getDecisionStorageKey(recommendation.opportunityId, recommendation.opportunityVersion)]}
              reasonSelection={reasonSelections[getDecisionStorageKey(recommendation.opportunityId, recommendation.opportunityVersion)]}
              reviewCandidate={getOwnerReviewCandidateForDecision(
                reviewState.workspace,
                getMarketDecisionForOpportunity(decisionState.workspace, recommendation.opportunityId, recommendation.opportunityVersion)?.decisionId
              )}
              onReasonChange={handleReasonChange}
              onDecision={handleDecision}
            />
          ))}
        </section>
      )}

      <section className="mi-panel mi-blocked">
        <div className="section-head">
          <div>
            <p className="eyebrow">保留</p>
            <h2>表示しなかった候補</h2>
          </div>
          <span className="badge">{viewModel.blocked.holdCount + viewModel.blocked.rejectedCount}件</span>
        </div>
        <div className="mi-reason-list">
          {viewModel.blocked.reasonSummary.length ? (
            viewModel.blocked.reasonSummary.map((reason) => (
              <div key={reason.reasonCode}>
                <strong>{reason.ownerMessage}</strong>
                <span>{reason.count}件</span>
              </div>
            ))
          ) : (
            <div>
              <strong>追加確認が必要な候補はありません。</strong>
              <span>Mock評価</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
