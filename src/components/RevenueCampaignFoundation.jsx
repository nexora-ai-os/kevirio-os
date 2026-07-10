import { useMemo, useState } from "react";
import {
  CAMPAIGN_TYPES,
  CHANNEL_OPTIONS,
  LANGUAGE_OPTIONS,
  REQUESTED_ARTIFACTS,
  buildMockRevenueCampaign,
  getDefaultRevenueCampaignInput,
  getRevenueGoalOptions,
} from "../services/revenueCampaignService";
import RevenuePackageGenerator from "./RevenuePackageGenerator";

const campaignTypeLabels = {
  [CAMPAIGN_TYPES.CORE_MEDIA]: "本命事業",
  [CAMPAIGN_TYPES.SHORT_TERM_SERVICE]: "短期収益",
};

const goalLabels = {
  AFFILIATE_REVENUE: "アフィリエイト収益",
  AD_REVENUE: "広告収益",
  PRODUCT_REVENUE: "商品収益",
  SERVICE_LEAD: "サービス相談",
  BRAND_GROWTH: "ブランド成長",
  SERVICE_REVENUE: "サービス収益",
  LEAD_GENERATION: "見込み客獲得",
  ORDER_ACQUISITION: "受注獲得",
  REPEAT_ORDER: "継続受注",
  PORTFOLIO_BUILDING: "実績づくり",
};

export default function RevenueCampaignFoundation({ budget, revenueCampaigns = [], setRevenueCampaigns, setPage }) {
  const [form, setForm] = useState(() => getDefaultRevenueCampaignInput());
  const [errors, setErrors] = useState({});
  const [latest, setLatest] = useState(null);
  const goalOptions = useMemo(() => getRevenueGoalOptions(form.campaignType), [form.campaignType]);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  };

  const switchType = (campaignType) => {
    const goals = getRevenueGoalOptions(campaignType);
    updateForm({
      campaignType,
      revenueGoal: goals[0],
      primaryChannels: campaignType === CAMPAIGN_TYPES.CORE_MEDIA ? ["Threads", "Instagram", "Blog"] : ["CrowdWorks", "Lancers", "Coconala"],
    });
  };

  const toggleChannel = (channel) => {
    setForm((prev) => {
      const exists = prev.primaryChannels.includes(channel);
      return {
        ...prev,
        primaryChannels: exists ? prev.primaryChannels.filter((item) => item !== channel) : [...prev.primaryChannels, channel],
      };
    });
    setErrors({});
  };

  const saveCampaign = () => {
    const result = buildMockRevenueCampaign(form, budget);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setRevenueCampaigns((prev) => [result.campaign, ...prev]);
    setLatest(result.campaign);
    setErrors({});
  };

  const resetForm = () => {
    setForm(getDefaultRevenueCampaignInput());
    setErrors({});
    setLatest(null);
  };

  const preview = latest || {
    campaignId: "保存時に生成",
    correlationId: "保存時に生成",
    opportunityId: "保存時に生成",
    ...form,
    valueType: "MOCK",
    status: "DRAFT",
    mockOnly: true,
    externalExecutionAllowed: false,
    revenuePackageInput: {
      requestedArtifacts: REQUESTED_ARTIFACTS,
    },
  };

  return (
    <section>
      <section className="hero v5-hero p0-005-compact-hero">
        <p className="eyebrow">P0-001 / Revenue Campaign Foundation</p>
        <h1>収益キャンペーン作成</h1>
        <p className="lead">
          開発モードのモック下書きです。外部通信なし、実売上ではありません。
        </p>
        <div className="connection-flow">
          <span>開発モード</span>
          <span>モックのみ</span>
          <span>外部通信なし</span>
          <span>実売上ではありません</span>
        </div>
      </section>

      <RevenuePackageGenerator campaigns={revenueCampaigns} budget={budget} setPage={setPage} />

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">キャンペーン入力</p>
            <h2>6項目でモックキャンペーンを作成</h2>
          </div>
          <span className="badge">モック / 下書き</span>
        </div>

        <div className="v5-picker">
          {Object.values(CAMPAIGN_TYPES).map((type) => (
            <button key={type} className={form.campaignType === type ? "wide-btn active" : "wide-btn"} onClick={() => switchType(type)}>
              <strong>{campaignTypeLabels[type]}</strong>
              <span>{type === CAMPAIGN_TYPES.CORE_MEDIA ? "SNS / Blog / SEO / Affiliate / 自社商品・サービス" : "SNS投稿作成 / Blog記事作成 / Canva制作 / AI導入支援"}</span>
            </button>
          ))}
        </div>
        {errors.campaignType && <p className="success-message">{errors.campaignType}</p>}

        <div className="work-form">
          <input
            className="search"
            maxLength={120}
            placeholder="収益テーマ（例: AI副業・AI業務効率化）"
            value={form.theme}
            onChange={(event) => updateForm({ theme: event.target.value })}
          />
          {errors.theme && <p className="success-message">{errors.theme}</p>}

          <textarea
            className="prompt-box textarea compact"
            maxLength={240}
            placeholder="対象者（例: AI初心者・個人・小規模事業者）"
            value={form.targetAudience}
            onChange={(event) => updateForm({ targetAudience: event.target.value })}
          />
          {errors.targetAudience && <p className="success-message">{errors.targetAudience}</p>}

          <div className="toolbar">
            <select className="search small" value={form.revenueGoal} onChange={(event) => updateForm({ revenueGoal: event.target.value })}>
              {goalOptions.map((goal) => (
                <option key={goal} value={goal}>{goalLabels[goal] || goal}</option>
              ))}
            </select>
            <select className="search small" value={form.language} onChange={(event) => updateForm({ language: event.target.value })}>
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
          </div>
          {errors.revenueGoal && <p className="success-message">{errors.revenueGoal}</p>}
          {errors.language && <p className="success-message">{errors.language}</p>}
        </div>

        <div className="v5-picker">
          <div>
            <h3>主チャネル</h3>
            <div className="pill-list">
              {CHANNEL_OPTIONS.map((channel) => (
                <button key={channel} className={form.primaryChannels.includes(channel) ? "active" : ""} onClick={() => toggleChannel(channel)}>
                  {channel}
                </button>
              ))}
            </div>
            {errors.primaryChannels && <p className="success-message">{errors.primaryChannels}</p>}
          </div>
          <div>
            <h3>入力検証</h3>
            <div className="mission-list">
              <div>種別: {campaignTypeLabels[form.campaignType]}</div>
              <div>下書き / モックのみ</div>
              <div>未公開 / 未承認</div>
              <div>外部通信なし</div>
            </div>
          </div>
        </div>

        {errors.guard && <p className="success-message">{errors.guard}</p>}
        <div className="actions">
          <button onClick={saveCampaign}>モックキャンペーンを作成</button>
          <button onClick={resetForm}>入力をリセット</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">保存内容の確認</p>
            <h2>Ownerが最初に見る内容</h2>
          </div>
          <span className="badge">成果物 {REQUESTED_ARTIFACTS.length}件</span>
        </div>
        <div className="grid">
          <div className="card">
            <span className="badge">{campaignTypeLabels[preview.campaignType] || preview.campaignType}</span>
            <h2>{preview.theme || "テーマ未入力"}</h2>
            <p>{preview.targetAudience || "対象者未入力"}</p>
          </div>
          <div className="card">
            <span className="badge">目的</span>
            <ul>
              <li>収益目的: {goalLabels[preview.revenueGoal] || preview.revenueGoal}</li>
              <li>主チャネル: {preview.primaryChannels?.join(" / ")}</li>
              <li>言語: {preview.language}</li>
            </ul>
          </div>
          <div className="card">
            <span className="badge">状態</span>
            <ul>
              <li>下書き</li>
              <li>未公開</li>
              <li>未承認</li>
              <li>外部通信なし</li>
              <li>実売上ではありません</li>
            </ul>
          </div>
        </div>
        <div className="mission-list">
          {latest && <div>次工程: 収益パッケージ作成へ進む</div>}
        </div>
        <details className="tech-details">
          <summary>技術情報を見る</summary>
          <div className="mission-list tech-list">
            <div>campaignId: {preview.campaignId}</div>
            <div>correlationId: {preview.correlationId}</div>
            <div>opportunityId: {preview.opportunityId}</div>
            <div>status: {preview.status}</div>
            <div>valueType: {preview.valueType}</div>
            <div>mockOnly: {String(preview.mockOnly)}</div>
            <div>requestedArtifacts: {preview.revenuePackageInput?.requestedArtifacts?.join(" / ")}</div>
          </div>
        </details>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">保存済みモックキャンペーン</p>
            <h2>保存済みキャンペーン</h2>
          </div>
          <span className="badge">{revenueCampaigns.length}件</span>
        </div>
        <div className="mission-list">
          {revenueCampaigns.length === 0 && <div>まだモックキャンペーンはありません。</div>}
          {revenueCampaigns.map((campaign) => (
            <div key={campaign.campaignId}>
              {campaignTypeLabels[campaign.campaignType] || campaign.campaignType} / {campaign.theme} / {campaign.targetAudience}
            </div>
          ))}
        </div>
        <details className="tech-details">
          <summary>技術情報を見る</summary>
          <div className="mission-list tech-list">
            <div>LocalStorageキー: kevirio.revenueCampaigns.v1</div>
            {revenueCampaigns.map((campaign) => (
              <div key={`${campaign.campaignId}-tech`}>
                {campaign.campaignId} / {campaign.campaignType} / {campaign.status} / {campaign.valueType}
              </div>
            ))}
          </div>
        </details>
      </section>
    </section>
  );
}
