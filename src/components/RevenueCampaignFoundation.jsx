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

const campaignTypeLabels = {
  [CAMPAIGN_TYPES.CORE_MEDIA]: "CORE MEDIA",
  [CAMPAIGN_TYPES.SHORT_TERM_SERVICE]: "SHORT-TERM SERVICE",
};

const goalLabels = {
  AFFILIATE_REVENUE: "Affiliate revenue",
  AD_REVENUE: "Ad revenue",
  PRODUCT_REVENUE: "Product revenue",
  SERVICE_LEAD: "Service lead",
  BRAND_GROWTH: "Brand growth",
  SERVICE_REVENUE: "Service revenue",
  LEAD_GENERATION: "Lead generation",
  ORDER_ACQUISITION: "Order acquisition",
  REPEAT_ORDER: "Repeat order",
  PORTFOLIO_BUILDING: "Portfolio building",
};

export default function RevenueCampaignFoundation({ budget, revenueCampaigns = [], setRevenueCampaigns }) {
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
      <section className="hero v5-hero">
        <p className="eyebrow">P0-001 Revenue Campaign Foundation</p>
        <h1>Revenue Campaign Foundation</h1>
        <p className="lead">
          Development Mode / Mock Only。外部通信なし、実売上ではないMock Draftとして、6項目以内の入力からCampaign基礎データを保存します。
        </p>
        <div className="connection-flow">
          <span>Development Mode</span>
          <span>Mock Only</span>
          <span>外部通信なし</span>
          <span>実売上ではありません</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">OWNER INPUT</p>
            <h2>6項目でMock Campaignを作成</h2>
          </div>
          <span className="badge">MOCK / DRAFT 固定</span>
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
              <div>Campaign type: {form.campaignType}</div>
              <div>Value type: MOCK固定</div>
              <div>Status: DRAFT固定</div>
              <div>External execution: false</div>
            </div>
          </div>
        </div>

        {errors.guard && <p className="success-message">{errors.guard}</p>}
        <div className="actions">
          <button onClick={saveCampaign}>Mock Campaignを作成</button>
          <button onClick={resetForm}>入力をリセット</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">CAMPAIGN PREVIEW</p>
            <h2>保存されるMock Draft</h2>
          </div>
          <span className="badge">requestedArtifacts {REQUESTED_ARTIFACTS.length}件</span>
        </div>
        <div className="grid">
          <div className="card">
            <span className="badge">{preview.campaignType}</span>
            <h2>{preview.theme || "テーマ未入力"}</h2>
            <p>{preview.targetAudience || "対象者未入力"}</p>
          </div>
          <div className="card">
            <span className="badge">IDs</span>
            <ul>
              <li>campaignId: {preview.campaignId}</li>
              <li>correlationId: {preview.correlationId}</li>
              <li>opportunityId: {preview.opportunityId}</li>
            </ul>
          </div>
          <div className="card">
            <span className="badge">Safety</span>
            <ul>
              <li>mockOnly: true</li>
              <li>externalExecutionAllowed: false</li>
              <li>ownerApprovalRequired: false</li>
              <li>valueType: MOCK</li>
              <li>status: DRAFT</li>
            </ul>
          </div>
        </div>
        <div className="mission-list">
          <div>Revenue MVP Package Input: {preview.revenuePackageInput?.requestedArtifacts?.join(" / ")}</div>
          {latest && <div>Mock Campaign作成完了。外部通信は行われていません。次工程: Revenue MVP Package Generator</div>}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">SAVED MOCK CAMPAIGNS</p>
            <h2>LocalStorage: kevirio.revenueCampaigns.v1</h2>
          </div>
          <span className="badge">{revenueCampaigns.length}件</span>
        </div>
        <div className="mission-list">
          {revenueCampaigns.length === 0 && <div>まだMock Campaignはありません。</div>}
          {revenueCampaigns.map((campaign) => (
            <div key={campaign.campaignId}>
              {campaign.campaignId} / {campaign.campaignType} / {campaign.theme} / {campaign.status} / {campaign.valueType}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
