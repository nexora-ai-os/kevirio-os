export function buildMissionSummary({ tasks = [], approvals = [], analytics = {}, pipelineRuns = [] }) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;
  const openTasks = tasks.filter((task) => task.status !== "done");
  const highTasks = openTasks.filter((task) => task.priority === "high");
  const projectedValue = openTasks.reduce((sum, task) => sum + (task.value || 0), 0);
  const revenue = analytics.revenue || 0;
  const monthlyGoal = 300000;
  const remaining = Math.max(monthlyGoal - revenue, 0);
  const progress = Math.min(100, Math.round((revenue / monthlyGoal) * 100));
  const focus = highTasks[0]?.title || (waiting > 0 ? "Approval Centerで承認待ちを処理する" : "Work Commandで新しい仕事を登録する");
  const riskLevel = waiting >= 3 || highTasks.length >= 3 ? "高" : waiting >= 1 || highTasks.length >= 1 ? "中" : "低";

  return { waiting, openTasksCount: openTasks.length, highTasksCount: highTasks.length, projectedValue, monthlyGoal, remaining, progress, focus, riskLevel, pipelineCount: pipelineRuns.length };
}

export function priorityLabel(priority) {
  if (priority === "high") return "最優先";
  if (priority === "medium") return "今日中";
  return "余力があれば";
}

export function priorityIcon(priority) {
  if (priority === "high") return "🔥";
  if (priority === "medium") return "⚡";
  return "🌱";
}
