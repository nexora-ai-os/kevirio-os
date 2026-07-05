export function analyzeOpportunity(text) {
  const raw = text.trim();
  const hasPlaud = raw.toLowerCase().includes("plaud") || raw.includes("議事録") || raw.includes("録音");
  const hasImage = raw.includes("画像") || raw.toLowerCase().includes("canvas");
  const score = hasPlaud ? 95 : hasImage ? 90 : 82;
  const estimate = hasPlaud ? 4500 : hasImage ? 3200 : 1800;
  const category = hasPlaud ? "AIボイスレコーダー" : hasImage ? "AI画像生成" : "AI効率化";

  return {
    title: hasPlaud ? "PLAUD収益化導線" : hasImage ? "AI画像生成収益化導線" : "AI効率化コンテンツ導線",
    category,
    score,
    estimate,
    summary: `入力内容を分析しました。テーマは「${category}」で、SNSとブログの両方に展開できます。`,
    risks: [
      "案件の報酬条件はASP管理画面で要確認",
      "過度な成果保証表現は避ける",
      "実体験または具体例を入れると信頼性が上がる",
    ],
    nextActions: [
      "投稿タイトルを3案作る",
      "Instagram構成を作る",
      "Threads投稿を作る",
      "Approval Centerへ送る",
    ],
  };
}

export function buildContentFromAnalysis(analysis) {
  return {
    title: `${analysis.title}：初心者向け投稿`,
    channel: "Instagram / Threads / Blog",
    asp: analysis.category,
    value: Math.round(analysis.estimate / 3),
    body: `テーマ：${analysis.title}

分析結果：
${analysis.summary}

Instagram構成：
1枚目：まだ手作業で時間を失っていませんか？
2枚目：${analysis.category}で解決できる課題
3枚目：初心者でも使いやすい理由
4枚目：副業・営業・ブログでの活用例
5枚目：注意点と選び方
6枚目：保存CTA

Threads投稿：
${analysis.category}は、作業時間を減らしながら収益導線を作れるテーマです。まずは1つの投稿から試すのが現実的です。

ブログ構成：
H2：${analysis.category}とは
H2：どんな課題を解決できるか
H2：副業・営業での使い方
H2：注意点
H2：まとめ

リスク確認：
${analysis.risks.map((r) => `・${r}`).join("\n")}`,
  };
}
