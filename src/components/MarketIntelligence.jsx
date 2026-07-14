import { useMemo, useState } from "react";
import "./MarketIntelligence.css";
import { mockMarketSignals } from "../data/mockMarketSignals";
import { buildMarketIntelligenceFoundation } from "../services/marketIntelligenceEngine";
import { buildMarketIntelligenceViewModel } from "../services/marketIntelligenceAdapter";

const SANDBOX_EVALUATION_TIME = "2026-07-14T12:00:00.000Z";
const SANDBOX_EVALUATION_TIMESTAMP = Date.parse(SANDBOX_EVALUATION_TIME);

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

function RecommendationCard({ recommendation }) {
  const [open, setOpen] = useState(false);
  const detailId = `market-detail-${recommendation.opportunityId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const detail = recommendation.details;
  const forecast = recommendation.primary.forecastRange;

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
  const viewModel = useMemo(() => {
    const foundation = buildMarketIntelligenceFoundation(mockMarketSignals, SANDBOX_EVALUATION_TIMESTAMP);
    return buildMarketIntelligenceViewModel(foundation, SANDBOX_EVALUATION_TIME);
  }, []);

  const snapshotDate = formatSnapshotDate(SANDBOX_EVALUATION_TIME);

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
          <span>次に見る候補: 1位</span>
          <strong>{viewModel.recommendations[0]?.primary.title || "表示できる候補はありません"}</strong>
        </div>
      </section>

      <section className="mi-safety-strip" aria-label="Safety summary">
        <span>Sandbox模擬データ / 外部通信なし / Productionなし / 実売上未接続 / 判断機能未接続</span>
      </section>

      <StatusPanel viewModel={viewModel} />

      {viewModel.status === "ready" && (
        <section className="mi-recommendations" aria-label="Sandbox推薦市場">
          {viewModel.recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.opportunityId} recommendation={recommendation} />
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
