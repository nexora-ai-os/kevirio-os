const providerGroups = [
  { id: "ai", name: "AI Core", providers: [
    ["openai", "OpenAI", ["OPENAI_API_KEY"], process.env.OPENAI_MODEL || "gpt-4.1-mini", "文章生成・判断"],
    ["gemini", "Gemini", ["GEMINI_API_KEY"], process.env.GEMINI_MODEL || "gemini-2.5-flash", "長文・要約・バックアップ"],
    ["anthropic", "Claude / Anthropic", ["ANTHROPIC_API_KEY"], process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", "法務・長文レビュー・ブランド"],
    ["perplexity", "Perplexity", ["PERPLEXITY_API_KEY"], process.env.PERPLEXITY_MODEL || "sonar", "最新情報・競合調査"],
  ] },
  { id: "google", name: "Google / YouTube", providers: [
    ["google", "Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], "OAuth", "Drive / Docs / Sheets / Gmail / Calendar"],
    ["youtube", "YouTube", ["YOUTUBE_API_KEY"], "YouTube Data API", "動画・Shorts・コメント・分析"],
    ["analytics", "Google Analytics", ["GA_PROPERTY_ID"], "GA4", "サイト・流入・成果分析"],
  ] },
  { id: "creative", name: "Creative / Video", providers: [
    ["canva", "Canva", ["CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET"], "Connect API", "画像・バナー・広告素材"],
    ["video", "Video API Layer", ["VIDEO_API_KEY"], "Provider neutral", "CapCut代替を含む動画生成基盤"],
  ] },
  { id: "social", name: "SNS / Publishing", providers: [
    ["meta", "Meta / Instagram / Facebook / Threads", ["META_APP_ID", "META_APP_SECRET"], "Graph API", "投稿・コメント・DM・インサイト"],
    ["x", "X", ["X_API_KEY", "X_API_SECRET"], "X API", "投稿・DM・フォロワー"],
    ["tiktok", "TikTok", ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"], "Content Posting API", "動画投稿・インサイト"],
    ["linkedin", "LinkedIn", ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"], "Marketing API", "BtoB・海外向け投稿"],
    ["pinterest", "Pinterest", ["PINTEREST_APP_ID", "PINTEREST_APP_SECRET"], "Pinterest API", "画像導線・海外集客"],
  ] },
  { id: "affiliate", name: "Affiliate / Revenue", providers: [
    ["a8", "A8.net", ["A8_ACCOUNT_ID"], "Manual / Future API", "国内ASP"],
    ["amazon", "Amazon Associates", ["AMAZON_ASSOCIATE_TAG"], "Product Advertising API", "商品収益化"],
    ["impact", "Impact", ["IMPACT_API_KEY"], "Impact API", "海外ASP"],
    ["cj", "CJ Affiliate", ["CJ_API_KEY"], "CJ API", "海外ASP"],
    ["sharesale", "ShareASale", ["SHAREASALE_API_KEY"], "ShareASale API", "海外ASP"],
  ] },
];
function isConfigured(keys) { return keys.every((key) => Boolean(process.env[key])); }
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const groups = providerGroups.map((group) => ({ ...group, providers: group.providers.map(([id, name, envKeys, model, role]) => ({ id, name, envKeys, configured: isConfigured(envKeys), model, role, secretVisible: false })) }));
  const providers = groups.flatMap((group) => group.providers.map((provider) => ({ ...provider, groupId: group.id, groupName: group.name })));
  const readyCount = providers.filter((provider) => provider.configured).length;
  const automationReady = providers.some((p) => p.id === "openai" && p.configured) && providers.some((p) => p.id === "gemini" && p.configured);
  return res.status(200).json({ ok: true, generatedAt: new Date().toISOString(), automationReady, readyCount, totalProviders: providers.length, groups, providers, nextBestAction: !providers.some((p) => p.id === "anthropic" && p.configured) ? "ANTHROPIC_API_KEYを追加してClaudeをAI Orchestratorへ接続" : !providers.some((p) => p.id === "perplexity" && p.configured) ? "PERPLEXITY_API_KEYを追加してResearch Agentを強化" : "Google OAuth / Canva / SNS APIの接続準備へ進む", principles: ["APIキーは画面に表示しない", "AIは分析・提案・下書き・予約準備まで", "最終決裁は必ずオーナー", "外部送信・投稿・契約・決済は自動実行しない", "機能は増やすが操作は減らす"] });
}
