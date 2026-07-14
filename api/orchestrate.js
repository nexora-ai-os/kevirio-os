function buildMockOrchestration({ message, mode }) {
  return [
    "KEVIRIO Sprint1 Mock Orchestrator",
    `mode: ${mode}`,
    `request: ${message}`,
    "AI社員は対象成果物だけを修正し、Content Pipelineへ戻します。",
    "外部送信、公開、承認確定、Production実行は行いません。",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode = "general", provider = "local-mock" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  return res.status(200).json({
    ok: true,
    mode,
    selected: "local-mock",
    requestedProvider: provider,
    fallbackUsed: false,
    tried: ["local-mock"],
    provider: "local-mock",
    model: "sprint1-mock",
    text: buildMockOrchestration({ message, mode }),
    governance: {
      ownerFinalDecision: true,
      externalExecution: false,
      secretsExposed: false,
      productionExecution: false,
      approvalConfirmed: false,
    },
  });
}
