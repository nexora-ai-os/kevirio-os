import { AI_AREA_CAPABILITIES, AI_ROUTER_POLICY } from "../../services/aiRealOperations.js";
export default function AiCapabilityCard({ feature }) {
  const capability = AI_AREA_CAPABILITIES[feature]; if (!capability) return null;
  return <section className="next-card next-ai-capability"><header><h2>AIアシスト</h2><span className="next-state next-state--manual">FREE_ONLY</span></header><p>{capability}</p><dl><div><dt>Provider</dt><dd>Gemini · CONNECTED_FREE</dd></div><div><dt>Fallback</dt><dd>Local deterministic</dd></div><div><dt>Privacy</dt><dd>{AI_ROUTER_POLICY.privacy}</dd></div><div><dt>Truth</dt><dd>Unknown ≠ 0 · Forecast ≠ Actual · AI ≠ Evidence</dd></div><div><dt>External action</dt><dd>LOCKED</dd></div></dl><a className="next-link" href={`/assistant?feature=${encodeURIComponent(feature)}`}>AI秘書に相談</a></section>;
}
