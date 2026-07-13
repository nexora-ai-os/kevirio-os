import { useMemo, useState } from "react";
import { buildMockRevenueCampaign, getDefaultRevenueCampaignInput } from "../services/revenueCampaignService";
import { generateRevenuePackage } from "../services/revenuePackageService";
import { getEmployeeById } from "../services/aiWorkforceService";

const reviewArtifactTypes = [
  "JP_SNS_POST",
  "GLOBAL_SNS_POST",
  "BLOG_ARTICLE",
  "SEO_TITLE",
  "META_DESCRIPTION",
  "CANVA_INSTRUCTION",
  "CTA",
  "OWNER_APPROVAL_PACKAGE",
];

const statusLabels = {
  MOCK_DRAFT_READY: "確認待ち",
  REVIEW_REQUIRED: "確認待ち",
  BLOCKED: "要確認",
  NOT_STARTED: "未着手",
};

function summarizeDraft(artifact) {
  const draft = artifact?.draft || {};
  const post = draft.posts?.[0];
  const bodySections = draft.bodySections?.map((section) => `${section.heading}: ${section.body}`).join("\n");
  return {
    title: draft.title || draft.primaryTitle || artifact?.title || "タイトル未設定",
    body: draft.body || post?.body || draft.introduction || bodySections || draft.copy || draft.recommendation || "本文はMock下書きです。詳細確認が必要です。",
    seo: draft.seoTitle || draft.primaryKeyword || draft.targetKeyword || draft.searchIntent || "SEO項目は要確認",
    cta: draft.CTA || draft.primaryCTA || post?.CTA || "CTAは要確認",
  };
}

function createReviewCandidate(artifact, action) {
  return {
    candidateId: `review_candidate_${artifact.artifactId}_${action}`,
    eventName: "quality.reviewed",
    candidateStatus: "PLANNED",
    notOccurred: true,
    appendable: false,
    valueType: "MOCK",
    mockOnly: true,
    note: "Owner Review Workspace内の未発生Event Candidate。Ledgerへappendしない。",
  };
}

export default function OwnerReviewWorkspace({ revenueCampaigns = [], budget }) {
  const [openArtifactType, setOpenArtifactType] = useState("");
  const [reviewState, setReviewState] = useState({});
  const [revisionText, setRevisionText] = useState("");

  const packageDraft = useMemo(() => {
    const campaign = revenueCampaigns[0] || buildMockRevenueCampaign(getDefaultRevenueCampaignInput(), budget).campaign;
    const result = campaign ? generateRevenuePackage(campaign, { budget }) : null;
    return result?.ok ? result.packageDraft : null;
  }, [budget, revenueCampaigns]);

  const reviewItems = useMemo(() => {
    if (!packageDraft?.artifacts) return [];
    return reviewArtifactTypes
      .map((artifactType) => packageDraft.artifacts.find((artifact) => artifact.artifactType === artifactType))
      .filter(Boolean);
  }, [packageDraft]);

  const remainingCount = reviewItems.filter((artifact) => reviewState[artifact.artifactType]?.status !== "OK").length;
  const selectedArtifact = reviewItems.find((artifact) => artifact.artifactType === openArtifactType) || null;
  const selectedDraft = summarizeDraft(selectedArtifact);
  const selectedEmployee = selectedArtifact ? getEmployeeById(selectedArtifact.primaryOwnerEmployeeId) : null;
  const selectedReview = selectedArtifact ? reviewState[selectedArtifact.artifactType] : null;

  const updateReview = (artifact, status, note = "") => {
    setReviewState((prev) => ({
      ...prev,
      [artifact.artifactType]: {
        status,
        note,
        eventCandidate: createReviewCandidate(artifact, status),
      },
    }));
  };

  const submitRevision = () => {
    if (!selectedArtifact) return;
    updateReview(selectedArtifact, "修正メモあり", revisionText.trim());
  };

  return (
    <main className="content">
      <section className="owner-review-workspace">
        <section className="review-top panel">
          <div>
            <p className="eyebrow">P0-006 Owner Review Workspace</p>
            <h1>成果物レビュー</h1>
            <p>開発モード / モックのみ。承認確定、公開、外部API、Ledger追記は行いません。</p>
          </div>
          <div className="review-count">
            <span>あと</span>
            <strong>{remainingCount}</strong>
            <span>件</span>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">今日確認する成果物</p>
              <h2>確認待ち成果物一覧</h2>
            </div>
            <span className="badge">残りレビュー {remainingCount}件</span>
          </div>

          <div className="review-list">
            {reviewItems.map((artifact) => {
              const employee = getEmployeeById(artifact.primaryOwnerEmployeeId);
              const localStatus = reviewState[artifact.artifactType]?.status;
              const isOpen = artifact.artifactType === openArtifactType;
              return (
                <div className="review-card" key={artifact.artifactId}>
                  <div>
                    <strong>{artifact.title}</strong>
                    <p>担当AI: {employee?.displayName || artifact.primaryOwnerEmployeeId}</p>
                  </div>
                  <span className="badge">{localStatus || statusLabels[artifact.status] || "確認待ち"}</span>
                  <button onClick={() => setOpenArtifactType(isOpen ? "" : artifact.artifactType)}>
                    確認する
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {selectedArtifact && (
          <section className="panel review-detail">
            <div className="section-head">
              <div>
                <p className="eyebrow">詳細表示</p>
                <h2>{selectedArtifact.title}</h2>
              </div>
              <span className="badge">Mock / 未承認 / 未公開</span>
            </div>

            <div className="review-detail-grid">
              <div className="review-main-text">
                <h3>{selectedDraft.title}</h3>
                <p>{selectedDraft.body}</p>
              </div>
              <div className="review-side">
                <div>SEO: {selectedDraft.seo}</div>
                <div>CTA: {selectedDraft.cta}</div>
                <div>担当AI: {selectedEmployee?.displayName || selectedArtifact.primaryOwnerEmployeeId}</div>
                <div>生成日時(Mock): {selectedArtifact.createdAt}</div>
              </div>
            </div>

            <label className="review-note">
              <span>AIへの修正内容</span>
              <textarea
                className="prompt-box textarea compact"
                value={revisionText}
                onChange={(event) => setRevisionText(event.target.value)}
                placeholder="例: 冒頭をもっと短く。CTAを相談導線に寄せる。"
              />
            </label>

            <div className="actions review-actions">
              <button onClick={submitRevision}>修正する</button>
              <button onClick={() => updateReview(selectedArtifact, "OK")}>OK</button>
              <button onClick={() => updateReview(selectedArtifact, "後で見る")}>後で見る</button>
            </div>

            {selectedReview && (
              <details className="tech-details">
                <summary>Event Candidateを見る</summary>
                <div className="mission-list tech-list">
                  <div>eventName: {selectedReview.eventCandidate.eventName}</div>
                  <div>candidateStatus: {selectedReview.eventCandidate.candidateStatus}</div>
                  <div>notOccurred: true / appendable: false / mockOnly: true</div>
                  <div>修正メモ: {selectedReview.note || "なし"}</div>
                </div>
              </details>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
