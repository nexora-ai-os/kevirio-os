export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not set in Vercel Environment Variables.",
    });
  }

  try {
    const { message, context = {} } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required." });
    }

    const systemPrompt = `
あなたは KEVIRIO AI Companion です。
KEVIRIOは、健さんが日常的に仕事を進めて収益化するためのAI Business Operating Systemです。

必ず守ること:
- 日本語で返答する
- 事実・推測・意見を分ける
- 不確かな部分は「要確認」と書く
- 仕事が前に進む具体的な次アクションを出す
- 文章作成、営業、応募文、SNS、アフィリエイト、業務改善、タスク整理を実務目線で支援する
- 冷たくならず、でも甘くしすぎない
- KEVIRIOのブランド感: 明るい、自然、上質、少し神秘的、人間中心
`;

    const userContext = `
現在のKEVIRIO状況:
- 月間売上目標: ${context.monthlyGoal ?? 300000}円
- 現在売上: ${context.revenue ?? 0}円
- 承認待ち: ${context.waitingApprovals ?? 0}件
- Pipeline: ${context.pipelineRuns ?? 0}件
- 今日のTodo: ${(context.todos || []).join(" / ")}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userContext}\n\n依頼:\n${message}` },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API error",
      });
    }

    const text =
      data.output_text ||
      data.output?.flatMap((item) => item.content || [])
        ?.map((part) => part.text || "")
        ?.join("\n")
        ?.trim() ||
      "回答を生成できませんでした。";

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Unexpected server error",
    });
  }
}
