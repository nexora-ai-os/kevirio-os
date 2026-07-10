import React, { memo } from "react";
import { Button, Card, GlassPanel, SectionTitle, StatusBadge } from "./shared/UIComponents";
import EventLedgerPanel from "./EventLedgerPanel";

function OperationCommandCenter({ tasks = [], integrations = [], workflows = [], setPage }) {
  return (
    <div className="operator-overview">
      <GlassPanel className="overview-hero">
        <div>
          <p className="eyebrow">AUTOMATION ENGINE</p>
          <h1>AI社員が仕事を進める標準フローへ。</h1>
          <p className="lead">営業AI・調査AI・提案AI・デザインAI・管理AIが連携し、ユーザーは承認だけに集中できます。</p>
          <div className="actions">
            <Button onClick={() => setPage("workflow")}>自動化フローを見る</Button>
            <Button onClick={() => setPage("approval")}>承認待ちへ</Button>
          </div>
        </div>
      </GlassPanel>

      <div className="overview-grid overview-grid--wide">
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="WORKFLOWS" title="標準自動化フロー" />
          <div className="workflow-list">
            {workflows.map((workflow) => (
              <div className="workflow-item" key={workflow.id}>
                <strong>{workflow.title}</strong>
                <p>{workflow.summary}</p>
                <StatusBadge status={workflow.status} />
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="INTEGRATIONS" title="接続基盤" />
          <div className="integration-list">
            {integrations.map((item) => (
              <div className="integration-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="overview-grid overview-grid--wide">
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="TASKS" title="次の実行候補" />
          <div className="workflow-list">
            {tasks.map((task) => (
              <div className="workflow-item" key={task.id}>
                <strong>{task.title}</strong>
                <p>{task.note}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="overview-panel">
          <SectionTitle eyebrow="COST" title="コスト最適化" />
          <Card className="kpi-card">
            <p className="eyebrow">AUTO-SAVE</p>
            <h3>Mini / Nanoへ自動切替</h3>
            <p>高額モデルの使用を抑え、コストと品質のバランスを保ちます。</p>
          </Card>
        </GlassPanel>
      </div>

      <EventLedgerPanel />
    </div>
  );
}

export default memo(OperationCommandCenter);
