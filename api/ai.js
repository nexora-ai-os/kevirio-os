function buildMockReply(message, context = {}) {
  const mode = context.mode || "general";
  return [
    "KEVIRIO Sprint1 Mock AIです。",
    "外部API、fetch、Production実行は行いません。",
    `依頼: ${message}`,
    `モード: ${mode}`,
    "次の一手: Ownerは成果物を確認し、OK / 修正する / あとで のどれかを選んでください。",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, context = {} } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required." });
  }

  return res.status(200).json({
    text: buildMockReply(message, context),
    provider: "local-mock",
    mockOnly: true,
    externalExecution: false,
    productionExecution: false,
    approvalConfirmed: false,
  });
}
