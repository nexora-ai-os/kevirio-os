
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function buildSystemPrompt(mode = "general") {
  return `あなたはKEVIRIOのAI Orchestratorです。
必ず以下を守ってください。
- AIは分析・提案・下書きまで。
- 最終決裁は必ずオーナー。
- 事実・推測・意見・要確認を分ける。
- 法務・ブランド・コンプライアンス・長期価値を考慮する。
- 外部投稿・契約・送信・決済は自動実行しない。
mode: ${mode}`;
}

function chooseProvider({ provider = "auto", mode = "general" }) {
  if (provider && provider !== "auto") return provider;

  if (mode === "long" || mode === "summary" || mode === "backup") {
    return process.env.GEMINI_API_KEY ? "gemini" : "openai";
  }

  return process.env.OPENAI_API_KEY ? "openai" : "gemini";
}

async function callOpenAI({ message, mode }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(mode) },
        { role: "user", content: message },
      ],
      temperature: 0.4,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed");
  }

  return {
    provider: "openai",
    model,
    text: data.choices?.[0]?.message?.content || "",
  };
}

async function callGemini({ message, mode }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `${GEMINI_URL_BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${buildSystemPrompt(mode)}\n\n${message}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed");
  }

  return {
    provider: "gemini",
    model,
    text: data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") || "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, mode = "general", provider = "auto" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const selected = chooseProvider({ provider, mode });
  const tried = [];

  try {
    let result;

    if (selected === "gemini") {
      tried.push("gemini");
      result = await callGemini({ message, mode });
    } else {
      tried.push("openai");
      result = await callOpenAI({ message, mode });
    }

    return res.status(200).json({
      ok: true,
      mode,
      selected,
      fallbackUsed: false,
      tried,
      ...result,
      governance: {
        ownerFinalDecision: true,
        externalExecution: false,
        secretsExposed: false,
      },
    });
  } catch (primaryError) {
    try {
      const fallback = selected === "openai" ? "gemini" : "openai";
      tried.push(fallback);

      const result =
        fallback === "gemini"
          ? await callGemini({ message, mode })
          : await callOpenAI({ message, mode });

      return res.status(200).json({
        ok: true,
        mode,
        selected: fallback,
        fallbackUsed: true,
        tried,
        primaryError: primaryError.message,
        ...result,
        governance: {
          ownerFinalDecision: true,
          externalExecution: false,
          secretsExposed: false,
        },
      });
    } catch (fallbackError) {
      return res.status(500).json({
        ok: false,
        error: "AI Orchestrator failed",
        tried,
        primaryError: primaryError.message,
        fallbackError: fallbackError.message,
      });
    }
  }
}
