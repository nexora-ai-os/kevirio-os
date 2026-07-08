export const initialCampaigns = [
  {
    id: 1,
    title: "AI副業 × KEVIRIO初期キャンペーン",
    theme: "AIで副業作業を自動化する",
    objective: "affiliate",
    product: "KEVIRIO / AIツール案件",
    status: "承認待ち",
    expectedRevenue: 9800,
    countries: ["JP", "US"],
    platforms: ["Instagram", "Threads", "X", "Blog"],
    createdAt: new Date().toISOString(),
    posts: [],
    legalChecklist: ["誇大表現なし", "AI生成表示要確認", "ASP規約要確認"],
  },
];

const platformHints = {
  Instagram: "保存されやすい箇条書き・カルーセル構成",
  Threads: "共感フック + 体験談 + CTA",
  X: "短文フック + 数字 + 導線",
  Blog: "SEO見出し + 比較 + 申込導線",
  TikTok: "冒頭3秒フック + ビフォー/アフター構成",
  YouTube: "ショート動画台本 + 概要欄リンク",
  LinkedIn: "BtoB向け実績・専門性訴求",
};

export function buildCampaignPlan(input = {}) {
  const theme = input.theme || "AIで収益化を進める";
  const product = input.product || "KEVIRIO";
  const objective = input.objective || "affiliate";
  const platforms = input.platforms?.length ? input.platforms : ["Instagram", "Threads", "X", "Blog"];
  const countries = input.countries?.length ? input.countries : ["JP", "US"];
  const expectedRevenue = Number(input.expectedRevenue || 12000);

  const japanesePosts = buildPosts({
    theme,
    product,
    language: "ja",
    country: "JP",
    platforms,
    count: 3,
  });

  const globalPosts = buildPosts({
    theme,
    product,
    language: "en",
    country: countries.find((country) => country !== "JP") || "US",
    platforms,
    count: 3,
  });

  const campaign = {
    id: Date.now(),
    title: `${theme}｜v5 Campaign`,
    theme,
    product,
    objective,
    countries,
    platforms,
    expectedRevenue,
    status: "承認待ち",
    createdAt: new Date().toISOString(),
    posts: [...japanesePosts, ...globalPosts],
    creativeBriefs: buildCreativeBriefs({ theme, product, platforms }),
    videoBriefs: buildVideoBriefs({ theme, product, platforms }),
    legalChecklist: buildLegalChecklist({ objective, product }),
    publisherPlan: buildPublisherPlan({ platforms, countries }),
    aiAgents: [
      "Research Agent",
      "Trend Agent",
      "Opportunity Agent",
      "Affiliate Agent",
      "Content Agent",
      "Translator Agent",
      "Creative Agent",
      "Video Agent",
      "Legal Agent",
      "Publisher Agent",
      "Analytics Agent",
      "Memory Agent",
    ],
    ownerDecision: "最終決裁待ち",
  };

  return campaign;
}

function buildPosts({ theme, product, language, country, platforms, count }) {
  return Array.from({ length: count }).map((_, index) => {
    const platform = platforms[index % platforms.length];
    const hint = platformHints[platform] || "SNS向けに短く明確に";
    const isJa = language === "ja";

    return {
      id: `${language}-${index + 1}-${Date.now()}`,
      platform,
      language,
      country,
      title: isJa
        ? `${theme}｜投稿案${index + 1}`
        : `${theme}｜Global Post ${index + 1}`,
      copy: isJa
        ? `【${theme}】\n今やるべき理由を3つに整理しました。\n1. 作業時間を減らせる\n2. 収益導線を作りやすい\n3. AIで継続改善できる\n\n関連: ${product}\n※公開前に表現・規約を確認してください。`
        : `【${theme}】\nHere are 3 reasons this topic can work globally:\n1. It reduces manual workload\n2. It creates a monetization path\n3. It can be improved with AI feedback loops\n\nRelated: ${product}\nNote: Review legal, platform, and affiliate rules before publishing.`,
      hashtags: isJa
        ? ["#AI活用", "#副業", "#業務効率化", "#KEVIRIO"]
        : ["#AI", "#Automation", "#SideHustle", "#BusinessOS"],
      hint,
      approvalStatus: "承認待ち",
      scheduledAt: "",
    };
  });
}

function buildCreativeBriefs({ theme, product, platforms }) {
  return [
    {
      tool: "Canva",
      title: `${theme}｜SNSカルーセル`,
      format: "1080x1080 / 1080x1920",
      direction: "白・グリーン基調。高級感、余白多め、1枚1メッセージ。",
      platforms,
      product,
    },
    {
      tool: "Canva",
      title: `${theme}｜広告バナー`,
      format: "横長 / 正方形 / 縦長",
      direction: "数字・ベネフィット・CTAを明確化。誇大表現は避ける。",
      platforms,
      product,
    },
  ];
}

function buildVideoBriefs({ theme, product, platforms }) {
  return [
    {
      tool: "CapCut / Video API",
      title: `${theme}｜ショート動画案`,
      length: "15-30秒",
      script: `冒頭: まだ手作業でやっていませんか？\n展開: AIで調査・投稿・分析まで短縮\nCTA: 詳細はプロフィール/リンクへ`,
      platforms: platforms.filter((platform) => ["TikTok", "Instagram", "YouTube"].includes(platform)),
      product,
    },
  ];
}

function buildLegalChecklist({ objective, product }) {
  return [
    "事実・推測・意見を分ける",
    "効果保証・断定表現を避ける",
    "PR / 広告 / アフィリエイト表記を確認する",
    "ASP規約・SNS規約を確認する",
    "著作権・商標・画像素材の利用権を確認する",
    objective === "health" ? "薬機法・景表法表現を重点確認する" : "業界固有規制を確認する",
    `${product}のブランドガイドラインを確認する`,
  ];
}

function buildPublisherPlan({ platforms, countries }) {
  return platforms.map((platform, index) => ({
    platform,
    targetCountries: countries,
    suggestedTime: index % 2 === 0 ? "08:00" : "20:00",
    mode: "承認後に予約投稿準備",
    status: "未予約",
  }));
}

export function buildApprovalItemsFromCampaign(campaign) {
  const postApprovals = campaign.posts.map((post) => ({
    id: Date.now() + Math.floor(Math.random() * 100000),
    title: `${campaign.title}｜${post.platform}｜${post.language}`,
    channel: post.platform,
    asp: campaign.product,
    time: "今日",
    status: "承認待ち",
    value: Math.round(Number(campaign.expectedRevenue || 0) / Math.max(campaign.posts.length, 1)),
    counted: false,
    risk: "要確認",
    copy: post.copy,
  }));

  return postApprovals;
}

export function buildWorkflowFromCampaign(campaign) {
  return {
    id: Date.now(),
    source: "Campaign OS",
    title: campaign.title,
    relatedProgram: campaign.product,
    score: 86,
    expectedRevenue: campaign.expectedRevenue,
    riskLevel: "要確認",
    confidence: 78,
    ownerDecision: "承認待ち",
    status: "pending-owner",
    reason: "v5 Campaign OSから生成。日本向け・海外向け投稿、Creative、Video、Legal、Publisherを一括準備。",
    steps: [
      { id: 1, label: "Research / Trend", status: "done" },
      { id: 2, label: "Content生成", status: "done" },
      { id: 3, label: "Creative / Video案", status: "done" },
      { id: 4, label: "Legal確認", status: "ready" },
      { id: 5, label: "Approval承認待ち", status: "ready" },
      { id: 6, label: "予約投稿準備", status: "ready" },
      { id: 7, label: "Analytics / Memory", status: "ready" },
    ],
    memo: campaign.theme,
  };
}

export function buildDecisionFromCampaign(campaign, ownerDecision = "承認") {
  return {
    id: Date.now(),
    date: new Date().toISOString(),
    title: `${campaign.title}｜Campaign Decision`,
    aiProposal: "日本向け3本・海外向け3本・Creative/Video/Legal/Publisher準備を一括生成",
    ownerDecision,
    outcome: "承認待ち生成",
    impact: 82,
    lesson: "1テーマ入力から複数SNS・多言語展開へ広げることで母数を増やせる",
    category: "campaign",
  };
}
