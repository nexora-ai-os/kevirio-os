export const aiDepartments = [
  { id: "executive", name: "Executive Office", mission: "経営判断・今日の優先順位・最終提案", agents: ["AI CEO", "AI COO", "AI CFO", "AI CTO"] },
  { id: "revenue", name: "Revenue Division", mission: "案件・ASP・売上・ROI・広告収益", agents: ["Opportunity Agent", "Affiliate Agent", "Ads Agent", "Global Affiliate Agent"] },
  { id: "marketing", name: "Marketing Division", mission: "SNS・SEO・広告・キャンペーン設計", agents: ["AI CMO", "Social Agent", "Growth Agent", "SEO Agent"] },
  { id: "creative", name: "Creative Studio", mission: "投稿・画像・動画・LP・多言語制作", agents: ["Content Agent", "Creative Agent", "Video Agent", "Translator Agent"] },
  { id: "quality", name: "Legal & Quality", mission: "法務・規約・ブランド・品質保証", agents: ["AI Legal", "AI Brand", "Reviewer Agent", "Risk Monitor"] },
  { id: "data", name: "Analytics & Memory", mission: "分析・学習・A/Bテスト・改善", agents: ["Analytics Agent", "Memory Agent", "Experiment Agent", "Research Agent"] },
  { id: "community", name: "Community Operations", mission: "コメント・DM・フォロワー・顧客対応", agents: ["Community Agent", "Support Agent", "CRM Agent", "Publisher Agent"] },
];
export function buildAgentCompanySummary() { const agents = aiDepartments.flatMap((d) => d.agents); return { departments: aiDepartments.length, agents: agents.length, uniqueAgents: [...new Set(agents)].length, principle: "AI社員は裏側で増やす。UIは増やさない。", ownerRule: "最終決裁は必ずオーナー。" }; }
export function buildAgentActionMap() { return [
  { action: "1テーマから投稿作成", agents: ["Research Agent", "Trend Agent", "Content Agent", "Translator Agent", "Legal Agent"], visiblePage: "Campaign" },
  { action: "予約投稿準備", agents: ["Publisher Agent", "Social Agent", "Reviewer Agent"], visiblePage: "Approval" },
  { action: "SNS収益化", agents: ["Affiliate Agent", "Social Agent", "Growth Agent", "Analytics Agent"], visiblePage: "Analytics" },
  { action: "海外展開", agents: ["Global Affiliate Agent", "Translator Agent", "Research Agent", "SEO Agent"], visiblePage: "Campaign" },
  { action: "経営判断", agents: ["AI CEO", "AI CFO", "AI Legal", "AI Brand"], visiblePage: "Home" },
]; }
