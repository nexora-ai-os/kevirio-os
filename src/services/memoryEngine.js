export const initialDecisionJournal = [
  {
    id: 1,
    date: new Date().toISOString(),
    title: "KEVIRIO v4.0 初期意思決定",
    aiProposal: "Opportunity / Workflow / AI CEOをつなぎ、Business Memoryを追加する",
    ownerDecision: "承認",
    outcome: "学習基盤を作成",
    impact: 82,
    lesson: "画面追加よりも、判断と結果を蓄積する方が長期価値が高い",
    category: "system",
  },
];

export const initialMemoryRecords = [
  {
    id: 1,
    date: new Date().toISOString(),
    type: "principle",
    title: "最終決裁はオーナー",
    insight: "AIは分析・提案・下書きまで。投稿・契約・送信・決済は自動実行しない。",
    scoreImpact: 100,
    source: "KEVIRIO Constitution",
  },
  {
    id: 2,
    date: new Date().toISOString(),
    type: "strategy",
    title: "収益化優先",
    insight: "新機能は売上・ROI・判断品質への貢献を説明できるものから実装する。",
    scoreImpact: 88,
    source: "Revenue First Rule",
  },
];

export function analyzeMemory({ memoryRecords = [], decisionJournal = [] }) {
  const totalMemory = memoryRecords.length;
  const totalDecisions = decisionJournal.length;
  const avgImpact = totalDecisions
    ? Math.round(decisionJournal.reduce((sum, item) => sum + Number(item.impact || 0), 0) / totalDecisions)
    : 0;

  const positiveDecisions = decisionJournal.filter((item) => Number(item.impact || 0) >= 70).length;
  const learningScore = Math.max(
    0,
    Math.min(100, 40 + Math.min(totalMemory, 20) * 2 + Math.min(totalDecisions, 20) * 2 + Math.round(avgImpact / 5))
  );

  const topLessons = [...decisionJournal]
    .sort((a, b) => Number(b.impact || 0) - Number(a.impact || 0))
    .slice(0, 5);

  return {
    totalMemory,
    totalDecisions,
    avgImpact,
    positiveDecisions,
    learningScore,
    topLessons,
    recommendation: buildMemoryRecommendation({ totalMemory, totalDecisions, avgImpact }),
  };
}

function buildMemoryRecommendation({ totalMemory, totalDecisions, avgImpact }) {
  if (totalDecisions === 0) return "まずAI提案とオーナー判断を1件記録してください。";
  if (totalMemory < 5) return "成功・失敗・判断理由をさらに記録し、AI CEOの判断材料を増やしてください。";
  if (avgImpact < 60) return "判断結果のImpactが低めです。やらないこと・リスク条件も記録してください。";
  return "Memoryは良好です。次は投稿結果・CTR・CV・売上を記録して精度を上げてください。";
}

export function buildMemoryRecordFromDecision(decision) {
  return {
    id: Date.now(),
    date: new Date().toISOString(),
    type: decision.category || "decision",
    title: decision.title,
    insight: `${decision.ownerDecision} / 結果: ${decision.outcome} / 学び: ${decision.lesson}`,
    scoreImpact: Number(decision.impact || 0),
    source: "AI Decision Journal",
  };
}

export function buildAIMemoryBrief({ memoryRecords = [], decisionJournal = [] }) {
  const analysis = analyzeMemory({ memoryRecords, decisionJournal });
  const lessons = analysis.topLessons.map((item, index) => `${index + 1}. ${item.title}: ${item.lesson}`).join("\\n");

  return `Business Memory Brief
Memory Records: ${analysis.totalMemory}
Decision Journal: ${analysis.totalDecisions}
Learning Score: ${analysis.learningScore}
Average Impact: ${analysis.avgImpact}

Top Lessons:
${lessons || "まだ十分な学習ログがありません。"}

Recommendation:
${analysis.recommendation}

原則:
AIは提案・分析・記録まで。最終決裁はオーナー。`;
}
