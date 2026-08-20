const MODEL = "gemini-2.5-flash";
export async function dispatchGeminiFree(prompt, options = {}) {
  const transport = options.transport || fetch;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const response = await transport(endpoint, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": options.credential }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.2 } }), signal: AbortSignal.timeout(20_000) });
  if (response.status === 429) return { ok: false, quota: true };
  if (!response.ok) return { ok: false, quota: false };
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("").trim();
  return text ? { ok: true, text } : { ok: false, empty: true };
}
