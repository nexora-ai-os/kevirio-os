import { useMemo, useState } from "react";
import RevenuePackageViewer from "./RevenuePackageViewer";
import { generateRevenuePackage, validateRevenuePackage } from "../services/revenuePackageService";

const campaignTypeLabels = {
  CORE_MEDIA: "本命事業",
  SHORT_TERM_SERVICE: "短期収益",
};

export default function RevenuePackageGenerator({ campaigns = [], budget, setPage }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaigns[0]?.campaignId || "");
  const [packageDraft, setPackageDraft] = useState(null);
  const [errors, setErrors] = useState([]);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.campaignId === selectedCampaignId) || campaigns[0] || null,
    [campaigns, selectedCampaignId],
  );

  const selectedPackageValidation = useMemo(
    () => (packageDraft ? validateRevenuePackage(packageDraft) : null),
    [packageDraft],
  );

  const createPackage = () => {
    if (!selectedCampaign) {
      setErrors([{ code: "CAMPAIGN_NOT_SELECTED", message: "Mock Campaignを選択してください。" }]);
      setPackageDraft(null);
      return;
    }

    const result = generateRevenuePackage(selectedCampaign, { budget });
    if (!result.ok) {
      setErrors(result.errors);
      setPackageDraft(null);
      return;
    }
    setPackageDraft(result.packageDraft);
    setErrors([]);
  };

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">P0-005 / Revenue MVP Package Generator</p>
          <h2>収益パッケージ作成</h2>
        </div>
        <span className="badge">開発モード / モックのみ / Production無効</span>
      </div>

      <div className="grid">
        <div className="card">
          <span className="badge">次にやること</span>
          <h3>Mock収益パッケージを作る</h3>
          <p>16成果物、AI担当、Legal / Brand / Owner確認材料をローカルstateだけで作成します。</p>
        </div>
        <div className="card">
          <span className="badge">状態</span>
          <ul>
            <li>外部APIなし</li>
            <li>Event Candidateは未発生</li>
            <li>未公開 / 未承認</li>
            <li>Actual Revenue: 未接続</li>
          </ul>
        </div>
      </div>

      <div className="toolbar">
        <select
          className="search small"
          value={selectedCampaign?.campaignId || ""}
          onChange={(event) => {
            setSelectedCampaignId(event.target.value);
            setPackageDraft(null);
            setErrors([]);
          }}
        >
          {campaigns.length === 0 && <option value="">Mock Campaignなし</option>}
          {campaigns.map((campaign) => (
            <option key={campaign.campaignId} value={campaign.campaignId}>
              {campaign.theme} / {campaignTypeLabels[campaign.campaignType] || campaign.campaignType}
            </option>
          ))}
        </select>
      </div>

      {selectedCampaign && (
        <div className="mission-list">
          <div>キャンペーン種別: {campaignTypeLabels[selectedCampaign.campaignType] || selectedCampaign.campaignType}</div>
          <div>テーマ: {selectedCampaign.theme}</div>
          <div>対象者: {selectedCampaign.targetAudience}</div>
          <div>主チャネル: {selectedCampaign.primaryChannels?.join(" / ")}</div>
        </div>
      )}
      {selectedCampaign && (
        <details className="tech-details">
          <summary>技術情報を見る</summary>
          <div className="mission-list tech-list">
            <div>campaignId: {selectedCampaign.campaignId}</div>
            <div>correlationId: {selectedCampaign.correlationId}</div>
            <div>requestedArtifacts: {selectedCampaign.revenuePackageInput?.requestedArtifacts?.length || 0}件</div>
            <div>valueType: {selectedCampaign.valueType} / mockOnly: {String(selectedCampaign.mockOnly)}</div>
          </div>
        </details>
      )}

      {errors.length > 0 && (
        <div className="success-message">
          {errors.map((item) => (
            <div key={`${item.code}-${item.field || item.artifactType || item.assignmentId || item.message}`}>{item.code}: {item.message}</div>
          ))}
        </div>
      )}

      <div className="actions">
        <button onClick={createPackage}>Mock Revenue Packageを作成</button>
        <button onClick={() => packageDraft && setErrors(selectedPackageValidation?.errors || [])} disabled={!packageDraft}>
          内容を確認する
        </button>
        <button onClick={() => setPage?.("campaign")}>Campaignへ戻る</button>
      </div>

      {packageDraft && <RevenuePackageViewer packageDraft={packageDraft} />}
    </section>
  );
}
