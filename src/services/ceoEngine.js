export function buildCEOBrief({
  workItems = [],
  missionTasks = [],
  approvals = [],
  analytics = {},
  pipelineRuns = [],
}) {
  const monthlyGoal = 300000;
  const revenue = analytics.revenue || 0;
  const remaining = Math.max(monthlyGoal - revenue, 0);

  const openTasks = missionTasks.filter((task) => task.status !== "done");
  const waitingApprovals = approvals.filter((item) => item.status === "承認待ち");
  const activeWork = workItems.filter((item) => item.status !== "done");

  const rankedWork = activeWork
    .map((item) => {
      const reward = Number(item.reward || 0);
      const hours = Number(item.estimatedHours || 1);
      const roiPerHour = Math.round(reward / Math.max(hours, 0.25));
      const score =
        Math.min(45, Math.round(reward / 350)) +
        Number(item.urgency || 1) * 9 +
        Number(item.strategicFit || 1) * 11 -
        Number(item.difficulty || 1) * 6 -
        Number(item.complianceRisk || 1) * 5;

      return {
        ...item,
        roiPerHour,
        ceoScore: Math.max(0, Math.min(100, score)),
        reason: buildReason(item, roiPerHour),
      };
    })
    .sort((a, b) => b.ceoScore - a.ceoScore);

  const topWork = rankedWork[0] || null;
  const todayExpectedRevenue = rankedWork.slice(0, 3).reduce((sum, item) => sum + Number(item.reward || 0), 0);

  const executionScore = openTasks.length > 0 ? 22 : 8;
  const revenueScore = Math.min(30, Math.round((revenue / monthlyGoal) * 30));
  const pipelineScore = Math.min(18, pipelineRuns.length * 9);
  const approvalPenalty = Math.min(14, waitingApprovals.length * 4);
  const workScore = rankedWork.length > 0 ? 24 : 8;

  const ceoScore = Math.max(
    0,
    Math.min(100, 25 + revenueScore + pipelineScore + executionScore + workScore - approvalPenalty)
  );

  return {
    monthlyGoal,
    revenue,
    remaining,
    openTasks,
    waitingApprovals,
    rankedWork,
    topWork,
    todayExpectedRevenue,
    ceoScore,
    pipelineCount: pipelineRuns.length,
    diagnosis: buildDiagnosis({ remaining, rankedWork, waitingApprovals, openTasks }),
    risks: buildRisks({ remaining, rankedWork, waitingApprovals, openTasks }),
    orders: buildOrders({ topWork, rankedWork, waitingApprovals, openTasks }),
  };
}

function buildReason(item, roiPerHour) {
  const reasons = [];
  if (roiPerHour >= 10000) reasons.push("時間あたり収益が高い");
  if (Number(item.urgency || 0) >= 4) reasons.push("緊急度が高い");
  if (Number(item.strategicFit || 0) >= 4) reasons.push("KEVIRIOの方向性と相性が良い");
  if (item.type === "affiliate") reasons.push("収益導線に直結する");
  if (Number(item.complianceRisk || 0) >= 3) reasons.push("公開前チェックが必要");
  return reasons.join(" / ") || "登録済み仕事として処理対象";
}

function buildDiagnosis({ remaining, rankedWork, waitingApprovals, openTasks }) {
  if (rankedWork.length === 0) return "仕事候補が不足しています。Work Engineに案件・作業を登録してください。";
  if (waitingApprovals.length > 0) return "承認待ちが残っています。売上化の前に承認フローを止めないことが重要です。";
  if (remaining > 200000) return "月間目標との差が大きいため、今日は売上に直結する作業を優先してください。";
  if (openTasks.length >= 5) return "タスク数が多く分散しています。今日は上位3件に絞るべきです。";
  return "現状は実行フェーズです。優先順位に沿って処理すれば前進できます。";
}

function buildRisks({ remaining, rankedWork, waitingApprovals, openTasks }) {
  const risks = [];
  if (remaining > 0) risks.push(`月間目標まで${remaining.toLocaleString()}円不足`);
  if (waitingApprovals.length > 0) risks.push(`承認待ち${waitingApprovals.length}件が停滞リスク`);
  if (rankedWork.some((item) => Number(item.complianceRisk || 0) >= 4)) risks.push("コンプライアンス高リスク案件あり");
  if (openTasks.length >= 8) risks.push("タスク過多による実行力低下");
  if (rankedWork.length === 0) risks.push("新規案件・仕事候補不足");
  return risks;
}

function buildOrders({ topWork, rankedWork, waitingApprovals, openTasks }) {
  const orders = [];

  if (topWork) {
    orders.push(`最初に「${topWork.title}」を処理してください。理由：${topWork.reason}`);
  }

  if (waitingApprovals.length > 0) {
    orders.push(`Approval Centerで承認待ち${waitingApprovals.length}件を処理してください。`);
  }

  if (rankedWork[1]) {
    orders.push(`次に「${rankedWork[1].title}」へ進んでください。`);
  }

  if (openTasks.length > 0) {
    orders.push("Mission Controlで未完了タスクを上から順に完了してください。");
  }

  if (orders.length === 0) {
    orders.push("Work Engineに今日の案件を登録してください。");
  }

  return orders.slice(0, 4);
}
