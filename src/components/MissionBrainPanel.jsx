import { analyzeMission } from "../services/missionBrain";

export default function MissionBrainPanel({
  tasks,
  approvals,
  analytics,
  pipelineRuns,
  setPage,
}) {
  const brain = analyzeMission({ tasks, approvals, analytics, pipelineRuns });

  const sendToAI = () => {
    const taskLines = brain.rankedTasks
      .slice(0, 5)
      .map((task, index) => `${index + 1}. ${task.title} / score:${task.score} / ROI:${task.roiPerHour}円/h / 理由:${task.reason}`)
      .join("\n");

    const affiliateLines = brain.recommendedPrograms
      .map((program) => `${program.name} / 報酬:${program.reward}円〜${program.maxReward}円 / 提案:${program.recommendation}`)
      .join("\n");

    const message = `Mission Brainの分析をもとに、今日の実行計画を作ってください。\n\nBusiness Confidence Score:${brain.confidenceScore}\n残り目標:${brain.remaining}円\n承認待ち:${brain.waitingApprovals}件\n\n優先タスク:\n${taskLines}\n\nA8候補:\n${affiliateLines}\n\n出力は「事実」「推測」「意見」「今すぐやる1つ」「今日中にやる3つ」でお願いします。`;

    localStorage.setItem("kevirio-pending-ai-message", message);
    setPage("assistant");
  };

  return (
    <section className="panel brain-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">MISSION BRAIN</p>
          <h2>AIによる経営判断</h2>
        </div>
        <button onClick={sendToAI}>AIに作戦化させる</button>
      </div>

      <div className="brain-grid">
        <div className="brain-score">
          <span>{brain.confidenceScore}</span>
          <p>Business Confidence Score</p>
        </div>

        <div className="mission-list">
          <div>最優先｜{brain.topTask ? brain.topTask.title : "新しい仕事を登録してください"}</div>
          <div>理由｜{brain.topTask ? brain.topTask.reason : "未完了タスクが不足しています"}</div>
          <div>残り目標｜{brain.remaining.toLocaleString()}円</div>
        </div>
      </div>

      <div className="grid brain-cards">
        {brain.rankedTasks.slice(0, 3).map((task) => (
          <div className="card" key={task.id}>
            <span className="badge">Score {task.score}</span>
            <h2>{task.title}</h2>
            <p>{task.reason}</p>
            <ul>
              <li>期待価値：{task.expectedImpact.toLocaleString()}円</li>
              <li>想定時間：{task.estimatedMinutes}分</li>
              <li>ROI：{task.roiPerHour.toLocaleString()}円/h</li>
            </ul>
          </div>
        ))}
      </div>

      <div className="mission-list">
        <div><strong>リスク</strong>｜{brain.risks.join(" / ") || "大きなリスクは検出されていません。"}</div>
        <div><strong>次の行動</strong>｜{brain.nextActions.join(" / ")}</div>
      </div>

      <div className="grid brain-cards">
        {brain.recommendedPrograms.slice(0, 2).map((program) => (
          <div className="card" key={program.id}>
            <span className="badge">A8 Score {program.score}</span>
            <h2>{program.name}</h2>
            <p>{program.recommendation}</p>
            <ul>
              <li>カテゴリ：{program.category}</li>
              <li>報酬：{program.reward.toLocaleString()}円〜{program.maxReward.toLocaleString()}円</li>
              <li>注意：{program.risk}</li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
