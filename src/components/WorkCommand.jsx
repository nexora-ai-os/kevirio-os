import { useState } from "react";
import TopBar from "./TopBar";
import { analyzeOpportunity, buildContentFromAnalysis } from "../services/workflowEngine";
import { runOneClickPipeline } from "../services/pipelineEngine";

export default function WorkCommand({
  opportunities,
  setOpportunities,
  pipelineRuns,
  setPipelineRuns,
  setDraft,
  setApprovals,
  setNotifications,
  setPage,
  savedAt,
}) {
  const [input, setInput] = useState("PLAUDを使って議事録作成を時短する投稿を作りたい");
  const [analysis, setAnalysis] = useState(null);
  const [resultMessage, setResultMessage] = useState("");

  const runAnalysis = () => {
    const result = analyzeOpportunity(input);
    setAnalysis(result);
    setOpportunities((prev) => [
      {
        id: Date.now(),
        title: result.title,
        source: "AI Command",
        description: input,
        status: "分析済み",
        priority: result.score >= 90 ? "高" : "中",
        score: result.score,
        estimate: result.estimate,
      },
      ...prev,
    ]);
    setResultMessage("分析が完了しました。次はContent Studioへ送れます。");
  };

  const sendToStudio = () => {
    if (!analysis) return;
    setDraft(buildContentFromAnalysis(analysis));
    setPage("content");
  };

  const runFullPipeline = () => {
    const { analysis: nextAnalysis, draft, approval, pipelineRun } = runOneClickPipeline(input);

    setAnalysis(nextAnalysis);
    setDraft(draft);
    setApprovals((prev) => [approval, ...prev]);
    setPipelineRuns((prev) => [pipelineRun, ...prev]);
    setOpportunities((prev) => [
      {
        id: Date.now() + 2,
        title: nextAnalysis.title,
        source: "One Click Pipeline",
        description: input,
        status: "承認待ち追加済み",
        priority: nextAnalysis.score >= 90 ? "高" : "中",
        score: nextAnalysis.score,
        estimate: nextAnalysis.estimate,
      },
      ...prev,
    ]);
    setNotifications((prev) => [
      {
        id: Date.now() + 3,
        type: "pipeline",
        title: `${nextAnalysis.title}を承認待ちへ追加しました`,
        read: false,
      },
      ...prev,
    ]);
    setResultMessage("分析・投稿生成・承認待ち追加まで完了しました。Approval Centerを確認してください。");
  };

  return (
    <main className="content">
      <TopBar savedAt={savedAt} />

      <div className="hero">
        <p className="eyebrow">KEVIRIO WORK COMMAND</p>
        <h1>案件・ネタ・指示を入れると、AIが仕事化します。</h1>
        <p className="lead">v1.9では、分析 → 投稿生成 → 承認待ち追加まで一括実行できます。</p>
      </div>

      <section className="panel">
        <h2>AIに仕事を渡す</h2>
        <textarea
          className="prompt-box textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例：PLAUDを使って議事録作成を時短する投稿を作りたい"
        />
        <div className="actions">
          <button onClick={runAnalysis}>🧠 分析する</button>
          <button onClick={sendToStudio} disabled={!analysis}>✍️ Content Studioへ送る</button>
          <button onClick={runFullPipeline}>🚀 一括で承認待ちへ送る</button>
          <button onClick={() => setPage("approval")}>✅ Approvalを見る</button>
        </div>
        {resultMessage && <p className="success-message">{resultMessage}</p>}
      </section>

      {analysis && (
        <section className="panel">
          <h2>分析結果</h2>
          <div className="stats">
            <div className="stat-card"><span>Revenue Score</span><strong>{analysis.score}</strong><p>{analysis.category}</p></div>
            <div className="stat-card"><span>予測価値</span><strong>{analysis.estimate.toLocaleString()}円</strong><p>仮推定</p></div>
            <div className="stat-card"><span>優先度</span><strong>{analysis.score >= 90 ? "高" : "中"}</strong><p>投稿候補</p></div>
            <div className="stat-card"><span>次アクション</span><strong>{analysis.nextActions.length}</strong><p>作業に分解済み</p></div>
          </div>

          <div className="mission-list">
            <div>{analysis.summary}</div>
            {analysis.nextActions.map((a) => <div key={a}>次：{a}</div>)}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Pipeline Runs</h2>
        <div className="grid">
          {pipelineRuns.map((run) => (
            <div className="card" key={run.id}>
              <span className="badge">{run.status}</span>
              <h2>{run.title}</h2>
              <p>Score：{run.score}</p>
              <p>予測：{run.estimate.toLocaleString()}円</p>
              <p>作成：{run.createdAt}</p>
              <ul>
                {run.steps.map((step) => <li key={step}>完了：{step}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Work Queue</h2>
        <div className="grid">
          {opportunities.map((item) => (
            <div className="card" key={item.id}>
              <span className="badge">{item.status}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <p>優先度：{item.priority}</p>
              <p>Score：{item.score}</p>
              <p>予測：{item.estimate.toLocaleString()}円</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
