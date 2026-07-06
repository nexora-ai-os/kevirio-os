import { useState } from "react";
import { analyzeWorkItems } from "../services/workEngine";

export default function WorkEngine({
  workItems,
  setWorkItems,
  setMissionTasks,
  setPage,
}) {
  const [draft, setDraft] = useState({
    title: "",
    source: "Manual",
    type: "sales",
    category: "営業",
    reward: 5000,
    difficulty: 2,
    estimatedHours: 1,
    urgency: 3,
    strategicFit: 4,
    complianceRisk: 2,
    description: "",
  });

  const [loadingId, setLoadingId] = useState(null);
  const analyzed = analyzeWorkItems(workItems);
  const top = analyzed[0];

  const addWorkItem = () => {
    if (!draft.title.trim()) return;

    setWorkItems((prev) => [
      {
        ...draft,
        id: Date.now(),
        reward: Number(draft.reward || 0),
        difficulty: Number(draft.difficulty || 1),
        estimatedHours: Number(draft.estimatedHours || 1),
        urgency: Number(draft.urgency || 1),
        strategicFit: Number(draft.strategicFit || 1),
        complianceRisk: Number(draft.complianceRisk || 1),
        status: "analysis",
        aiReport: "",
        recommendedOutputs:
          draft.type === "affiliate"
            ? ["SEO記事", "SNS投稿", "比較記事"]
            : ["応募文", "営業文", "質問テンプレート"],
      },
      ...prev,
    ]);

    setDraft((prev) => ({ ...prev, title: "", description: "" }));
  };

  const pushToMission = (item) => {
    const tasks = item.generatedTasks.map((task) => ({
      id: Date.now() + Math.random(),
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: "todo",
      due: "今日",
      value: task.value,
      note: `Work Engineから生成 / ROI ${item.roiPerHour.toLocaleString()}円/h`,
    }));

    setMissionTasks((prev) => [...tasks, ...prev]);
    setPage("dashboard");
  };

  const sendToAI = (item) => {
    const message = `次の仕事を実行計画にしてください。\n\nタイトル:${item.title}\n内容:${item.description}\n報酬:${item.reward}円\nROI:${item.roiPerHour}円/h\n判断:${item.decision}\nリスク:${item.riskComment}\n\n出力は「事実」「推測」「意見」「実行手順」「作るべき文章」に分けてください。`;
    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  const analyzeWithAI = async (item) => {
    setLoadingId(item.id);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `次の仕事をKEVIRIO Work Engineとして分析してください。\n\n仕事名:${item.title}\n種類:${item.type}\nカテゴリ:${item.category}\n内容:${item.description}\n報酬:${item.reward}円\n想定時間:${item.estimatedHours}時間\nROI:${item.roiPerHour}円/h\nスコア:${item.score}\nリスク:${item.riskComment}\n\n必ず以下の形式で返してください。\n【事実】\n【推測】\n【意見】\n【優先順位】\n【法務・コンプラ注意】\n【今日やる作業3つ】`,
          context: {
            provider: "auto",
            mode: "work-engine",
            revenue: 0,
            monthlyGoal: 300000,
            todos: [item.title],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed.");

      setWorkItems((prev) =>
        prev.map((work) =>
          work.id === item.id
            ? { ...work, aiReport: data.text, aiProvider: data.provider || "auto" }
            : work
        )
      );
    } catch (error) {
      setWorkItems((prev) =>
        prev.map((work) =>
          work.id === item.id
            ? {
                ...work,
                aiReport:
                  "AI解析に失敗しました。\n要確認: OPENAI_API_KEY / GEMINI_API_KEY / GEMINI_MODEL の設定とRedeploy状況を確認してください。\n詳細: " +
                  error.message,
                aiProvider: "error",
              }
            : work
        )
      );
    } finally {
      setLoadingId(null);
    }
  };

  const removeWorkItem = (id) => {
    if (!window.confirm("この仕事を削除しますか？")) return;
    setWorkItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <main className="content">
      <section className="hero">
        <p className="eyebrow">AI WORK ENGINE v2.6</p>
        <h1>仕事を入れる。AIが分析する。</h1>
        <p className="lead">
          案件・A8・営業タスクを登録すると、ROI・優先順位・リスクに加えて、AIが実行計画まで作成します。
        </p>
      </section>

      <div className="stats">
        <div className="stat-card"><span>登録仕事</span><strong>{workItems.length}件</strong><p>解析対象</p></div>
        <div className="stat-card"><span>最優先</span><strong>{top ? top.score : 0}</strong><p>{top ? top.title : "未登録"}</p></div>
        <div className="stat-card"><span>最大ROI</span><strong>{top ? top.roiPerHour.toLocaleString() : 0}円/h</strong><p>時間効率</p></div>
        <div className="stat-card"><span>判断</span><strong>{top ? top.decision : "-"}</strong><p>Work Engine判定</p></div>
      </div>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ADD WORK</p>
            <h2>仕事を登録</h2>
          </div>
          <button onClick={addWorkItem}>解析に追加</button>
        </div>

        <div className="work-form">
          <input className="search" placeholder="仕事名 / 案件名" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea className="prompt-box textarea compact" placeholder="内容メモ" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="toolbar">
            <select className="search small" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
              <option value="sales">営業</option>
              <option value="affiliate">アフィリエイト</option>
              <option value="content">コンテンツ</option>
            </select>
            <input className="search small" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="カテゴリ" />
            <input className="search small" type="number" value={draft.reward} onChange={(e) => setDraft({ ...draft, reward: e.target.value })} placeholder="報酬" />
            <input className="search small" type="number" step="0.25" value={draft.estimatedHours} onChange={(e) => setDraft({ ...draft, estimatedHours: e.target.value })} placeholder="時間" />
            <input className="search small" type="number" min="1" max="5" value={draft.urgency} onChange={(e) => setDraft({ ...draft, urgency: e.target.value })} placeholder="緊急度" />
            <input className="search small" type="number" min="1" max="5" value={draft.strategicFit} onChange={(e) => setDraft({ ...draft, strategicFit: e.target.value })} placeholder="相性" />
            <input className="search small" type="number" min="1" max="5" value={draft.complianceRisk} onChange={(e) => setDraft({ ...draft, complianceRisk: e.target.value })} placeholder="リスク" />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">ANALYSIS QUEUE</p>
            <h2>Work Engine判断</h2>
          </div>
          <span className="badge">ROI + AI</span>
        </div>

        <div className="grid">
          {analyzed.map((item) => (
            <div className="card work-card" key={item.id}>
              <div className="card-header">
                <span className="badge">Score {item.score}</span>
                <span className="badge">{item.decision}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <ul>
                <li>報酬：{item.reward.toLocaleString()}円</li>
                <li>想定時間：{item.estimatedHours}h</li>
                <li>ROI：{item.roiPerHour.toLocaleString()}円/h</li>
                <li>リスク：{item.riskComment}</li>
              </ul>

              <div className="mission-list">
                {item.nextActions.map((action) => <div key={action}>{action}</div>)}
              </div>

              {item.aiReport && (
                <div className="ai-report">
                  <strong>AI解析結果（{item.aiProvider || "auto"}）</strong>
                  <p>{item.aiReport}</p>
                </div>
              )}

              <div className="actions">
                <button onClick={() => analyzeWithAI(item)} disabled={loadingId === item.id}>
                  {loadingId === item.id ? "AI解析中..." : "AI解析"}
                </button>
                <button onClick={() => pushToMission(item)}>Missionへ送る</button>
                <button onClick={() => sendToAI(item)}>AIに実行計画</button>
                <button onClick={() => removeWorkItem(item.id)}>削除</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
