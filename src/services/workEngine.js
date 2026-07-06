export function analyzeWorkItems(workItems = []) {
  return workItems
    .map((item) => {
      const reward = Number(item.reward || 0);
      const hours = Number(item.estimatedHours || 1);
      const roiPerHour = Math.round(reward / Math.max(hours, 0.25));
      const difficultyPenalty = Number(item.difficulty || 1) * 7;
      const compliancePenalty = Number(item.complianceRisk || 1) * 5;
      const urgencyScore = Number(item.urgency || 1) * 10;
      const fitScore = Number(item.strategicFit || 1) * 12;
      const rewardScore = Math.min(40, Math.round(reward / 350));

      const score = Math.max(
        0,
        Math.min(100, rewardScore + urgencyScore + fitScore - difficultyPenalty - compliancePenalty)
      );

      return {
        ...item,
        roiPerHour,
        score,
        priority: score >= 75 ? "high" : score >= 55 ? "medium" : "low",
        decision: buildDecision(score, item.complianceRisk),
        nextActions: buildNextActions(item),
        generatedTasks: buildGeneratedTasks(item),
        riskComment: buildRiskComment(item),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildDecision(score, complianceRisk) {
  if (complianceRisk >= 4) return "要確認。法務・表現チェック後に進行";
  if (score >= 75) return "優先実行";
  if (score >= 55) return "今日中に着手";
  return "後回し";
}

function buildNextActions(item) {
  if (item.type === "affiliate") {
    return [
      "記事テーマを1つ決める",
      "A8案件の訴求軸を整理する",
      "Content Studioで記事・SNS案を生成する",
      "Approval Centerで表現チェックする",
    ];
  }

  if (item.type === "sales") {
    return [
      "応募文の型を作る",
      "報酬・納期・作業範囲の確認文を作る",
      "案件別に調整して送信する",
    ];
  }

  return ["作業内容を分解する", "優先順位を決める", "最初の成果物を作る"];
}

function buildGeneratedTasks(item) {
  return (item.recommendedOutputs || []).map((output, index) => ({
    id: `${item.id}-${index}`,
    title: `${item.title}｜${output}を作る`,
    category: item.category,
    value: Math.round((item.reward || 0) / Math.max((item.recommendedOutputs || []).length, 1)),
    priority: index === 0 ? "high" : "medium",
  }));
}

function buildRiskComment(item) {
  if (item.complianceRisk >= 4) return "広告表現・法務チェックを必ず挟んでください。";
  if (item.complianceRisk >= 3) return "効果保証や誇大表現に注意してください。";
  return "大きな法務リスクは低めですが、公開前チェックは必要です。";
}
