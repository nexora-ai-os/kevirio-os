const MODEL = "gemini-2.5-flash";
export const GEMINI_FREE_MAX_OUTPUT_TOKENS = 8192;
export async function dispatchGeminiFree(prompt, options = {}) {
  const transport = options.transport || fetch;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const response = await transport(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": options.credential }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: GEMINI_FREE_MAX_OUTPUT_TOKENS, temperature: 0.2 } }), signal: AbortSignal.timeout(45_000) });
  if (response.status === 429) return { ok: false, reasonCode: "GEMINI_QUOTA_EXHAUSTED", httpStatus: 429 };
  if (response.status === 404) return { ok: false, reasonCode: "GEMINI_MODEL_UNAVAILABLE", httpStatus: 404 };
  if (!response.ok) return { ok: false, reasonCode: "GEMINI_PROVIDER_ERROR", httpStatus: response.status };
  const payload = await response.json();
  const candidate = payload?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part?.text || "").join("").trim();
  const finishReason = String(candidate?.finishReason || "UNKNOWN");
  return text ? { ok: true, text, rawLength: text.length, finishReason, modelOutputLimited: finishReason === "MAX_TOKENS", httpStatus: 200 } : { ok: false, reasonCode: "GEMINI_EMPTY_RESPONSE", finishReason, httpStatus: 200 };
}
