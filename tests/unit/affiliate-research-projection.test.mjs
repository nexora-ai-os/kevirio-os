import test from "node:test";
import assert from "node:assert/strict";
import { projectAffiliateResearchFinding } from "../../src/components/affiliate-v2/affiliateResearchProjection.js";

test("projects stored M028 finding without inventing Research facts", () => {
  const result = projectAffiliateResearchFinding({
    id: "finding-1", research_domain: "AFFILIATE", retrieved_at: "2026-08-24T10:00:00Z",
    truth_class: "AI_RECOMMENDATION", confidence: 0.82,
    statement: "調査目的: RingConn案件の訴求を調べる\n市場ニーズ: 睡眠状態を把握したい需要\n競合: スマートウォッチ\n機会: 指輪型の装着性\nリスク: 医療効果の断定\n推奨訴求: 睡眠習慣の見直し\n推奨チャネル: 比較記事\n次の行動: Strategy候補をOwner確認",
    provenance: { source_url: "https://example.test/source", provider: "gemini" },
  });
  assert.equal(result.source, "https://example.test/source");
  assert.equal(result.marketNeed, "睡眠状態を把握したい需要");
  assert.equal(result.competitor, "スマートウォッチ");
  assert.equal(result.nextAction, "Strategy候補をOwner確認");
  assert.equal(result.factVsInference, "INFERENCE / AI OUTPUT · NOT EVIDENCE");
});

test("missing structured sections remain explicitly unrecorded", () => {
  const result = projectAffiliateResearchFinding({ statement: "保存された実Research本文", provenance: {} });
  assert.equal(result.findings, "保存された実Research本文");
  assert.equal(result.marketNeed, "未記録");
  assert.equal(result.opportunity, "未記録");
  assert.equal(result.source, "未記録");
});
