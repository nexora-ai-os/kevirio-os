import { useMemo } from "react";
import { Badge, Card, SectionHeader } from "../design-system/index.js";
import { buildCompanyCycle } from "../domain/companyOperatingSystem.js";

const LABELS = Object.freeze({
  opportunity: "\u5546\u6a5f", offer: "\u30aa\u30d5\u30a1\u30fc", market_intelligence: "\u5e02\u5834\u5206\u6790",
  audience_intelligence: "\u9867\u5ba2\u5206\u6790", competitor_intelligence: "\u7af6\u5408\u5206\u6790", trend_intelligence: "\u30c8\u30ec\u30f3\u30c9\u5206\u6790",
  strategy: "\u6226\u7565", planning: "\u8a08\u753b", content: "\u30b3\u30f3\u30c6\u30f3\u30c4", quality_review: "\u54c1\u8cea\u30ec\u30d3\u30e5\u30fc",
  owner_approval: "Owner\u627f\u8a8d", schedule: "\u914d\u4fe1\u8a08\u753b", manual_or_approved_execution: "\u624b\u52d5\u307e\u305f\u306f\u627f\u8a8d\u6e08\u307f\u5b9f\u884c",
  performance: "\u6210\u679c\u8a08\u6e2c", evidence: "Evidence\u691c\u8a3c", verified_revenue: "\u691c\u8a3c\u6e08\u307f\u58f2\u4e0a",
  actual_cost: "\u5b9f\u30b3\u30b9\u30c8", net_profit: "\u7d14\u5229\u76ca", learning: "\u5b66\u7fd2", optimization: "\u6700\u9069\u5316", reallocation: "\u518d\u914d\u5206",
});

const STATE_LABELS = Object.freeze({
  not_started: "未着手", ready: "準備完了", waiting: "待機中", in_progress: "進行中",
  blocked: "ブロック", awaiting_approval: "承認待ち", manually_executed: "Owner実行済み",
  evidence_pending: "Evidence待ち", completed: "確認済み", failed: "失敗",
  cancelled: "キャンセル", unknown: "Unknown",
});
export default function CompanyOperatingCycle({ operation, revenue, operations }) {
  const stages = useMemo(() => buildCompanyCycle({
    operation,
    approvals: revenue?.approvals || [], evidence: revenue?.evidence || revenue?.evidenceCandidates || [],
    revenue: revenue?.revenue || [], costs: operations?.costs || [], learnings: operations?.learnings || [],
    performance: operations?.performance || [], dataAvailable: Boolean(revenue && operations),
  }), [operation, revenue, operations]);

  return <section aria-labelledby="company-cycle-title"><Card>
    <SectionHeader title="Company Operating Cycle" description="\u5546\u6a5f\u304b\u3089\u5229\u76ca\u306e\u518d\u914d\u5206\u307e\u3067\u3092\u3001Production Repository\u306e\u6839\u62e0\u3060\u3051\u3067\u8868\u793a\u3057\u307e\u3059\u3002" />
    <ol className="kv-company-cycle" id="company-cycle-title">
      {stages.map((stage) => <li key={stage.id} className="kv-company-cycle__stage">
        <span className="kv-company-cycle__order">{stage.order}</span><span>{LABELS[stage.id]}</span>
        <Badge state={stage.state} label={STATE_LABELS[stage.state] || "Unknown"} />
      </li>)}
    </ol>
    <p className="kv-data-note">{"Unknown\u306f0\u4ef6\u3084\u672a\u5b8c\u4e86\u3092\u610f\u5473\u3057\u307e\u305b\u3093\u3002\u6839\u62e0\u304c\u53d6\u5f97\u3067\u304d\u306a\u3044\u72b6\u614b\u3067\u3059\u3002"}</p>
  </Card></section>;
}