import { ARTIFACT_CATEGORIES } from "../data/revenuePackageSchema";
import {
  getArtifactsByCategory,
  getPackageAssignmentSummary,
  getPackageStatusSummary,
} from "../services/revenuePackageService";

export default function RevenuePackageViewer({ packageDraft }) {
  if (!packageDraft) return null;

  const statusSummary = getPackageStatusSummary(packageDraft);
  const assignmentSummary = getPackageAssignmentSummary(packageDraft);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">P0-005 Revenue MVP Package</p>
          <h2>下書きPackage</h2>
        </div>
        <span className="badge">Mock / 下書き / 未公開 / 未承認</span>
      </div>

      <div className="grid">
        <div className="card">
          <span className="badge">確認ポイント</span>
          <h3>Legal確認前 / Brand確認前の内容を見る</h3>
          <p>{packageDraft.packageSummary.nextBestAction}</p>
        </div>
        <div className="card">
          <span className="badge">下書き</span>
          <ul>
            <li>テーマ: {packageDraft.theme}</li>
            <li>対象者: {packageDraft.targetAudience}</li>
            <li>主チャネル: {packageDraft.primaryChannels.join(" / ")}</li>
            <li>状態: 下書き</li>
          </ul>
        </div>
        <div className="card">
          <span className="badge">状態</span>
          <ul>
            <li>モックのみ</li>
            <li>未公開</li>
            <li>未承認</li>
            <li>外部通信なし</li>
            <li>実売上ではありません</li>
          </ul>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span>成果物</span>
          <strong>{statusSummary.artifactCount} / 16</strong>
          <small>Mock drafts</small>
        </div>
        <div className="kpi-card">
          <span>AI社員</span>
          <strong>{assignmentSummary.aiEmployeeCount}</strong>
          <small>MVP15 assignments</small>
        </div>
        <div className="kpi-card">
          <span>Legal / Brand</span>
          <strong>{statusSummary.legalStatus}</strong>
          <small>{statusSummary.brandStatus} / 未完了</small>
        </div>
        <div className="kpi-card">
          <span>Event Candidate</span>
          <strong>{statusSummary.eventCandidateCount}</strong>
          <small>未発生 / append不可</small>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <span className="badge">Owner確認</span>
          <h3>{packageDraft.approvalSummary.status}</h3>
          <p>{packageDraft.approvalSummary.message}</p>
          <p>approvalDecision: {String(packageDraft.approvalSummary.approvalDecision)}</p>
        </div>
        <div className="card">
          <span className="badge">収益</span>
          <h3>実売上: {packageDraft.packageSummary.actualRevenue}</h3>
          <p>Forecast: {packageDraft.packageSummary.forecastRevenue}</p>
          <p>Mock: {packageDraft.packageSummary.mockRevenue}</p>
        </div>
      </div>

      <details className="tech-details">
        <summary>技術情報を見る</summary>
        <div className="mission-list tech-list">
          <div>packageId: {packageDraft.packageId}</div>
          <div>campaignId: {packageDraft.campaignId}</div>
          <div>correlationId: {packageDraft.correlationId}</div>
          <div>status: {packageDraft.status} / valueType: {packageDraft.valueType} / mockOnly: {String(packageDraft.mockOnly)}</div>
          <div>Event Candidate: {packageDraft.eventCandidates.map((candidate) => `${candidate.candidateId}:${candidate.eventName}(${candidate.candidateStatus})`).join(" / ")}</div>
          <div>notOccurred: true / appendable: false / occurredAt: null / recordedAt: null</div>
          <div>artifactId: {packageDraft.artifacts.map((artifact) => `${artifact.artifactType}:${artifact.artifactId}`).join(" / ")}</div>
          <div>assignmentId: {packageDraft.assignments.map((assignment) => `${assignment.artifactType}:${assignment.assignmentId}`).join(" / ")}</div>
        </div>
      </details>

      <div className="mission-list">
        {Object.values(ARTIFACT_CATEGORIES).map((category) => {
          const artifacts = getArtifactsByCategory(packageDraft, category);
          return (
            <details key={category}>
              <summary>{category} / {artifacts.length}件</summary>
              <div className="grid">
                {artifacts.map((artifact) => (
                  <div className="card" key={artifact.artifactId}>
                    <span className="badge">{artifact.status}</span>
                    <h3>{artifact.title}</h3>
                    <p>{artifact.artifactType}</p>
                    <ul>
                      <li>primary: {artifact.primaryOwnerEmployeeId}</li>
                      <li>reviewer: {artifact.reviewerEmployeeId}</li>
                      <li>backup: {artifact.backupEmployeeId}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      <div className="mission-list">
        <div>Legal: {packageDraft.legalSummary.riskItems.join(" / ")} / 未完了</div>
        <div>Brand: {packageDraft.brandSummary.brandChecks.join(" / ")} / 未完了</div>
        <div>Publish: {packageDraft.publishPreparation.checklist.join(" / ")} / 未公開</div>
      </div>
    </section>
  );
}
