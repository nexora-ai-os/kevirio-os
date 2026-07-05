import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const initialPrograms = [
{ name: "PLAUD", asp: "A8.net", category: "AIボイスレコーダー", reward: "購入10%", status: "提携済み", score: 95, favorite: true, predicted: 4500 },
{ name: "ConoHa AI Canvas", asp: "A8.net", category: "AI画像生成", reward: "500円〜4,000円", status: "提携済み", score: 93, favorite: true, predicted: 3800 },
{ name: "Value AI Writer", asp: "A8.net", category: "SEO記事生成AI", reward: "有料40%", status: "提携済み", score: 90, favorite: true, predicted: 3200 },
{ name: "Twomi", asp: "A8.net", category: "AI × SNS", reward: "300円", status: "提携済み", score: 89, favorite: false, predicted: 1800 },
{ name: "Doraverse", asp: "A8.net", category: "AI SaaS", reward: "62円〜", status: "提携済み", score: 84, favorite: false, predicted: 1200 },
{ name: "RingConn", asp: "A8.net", category: "AIスマートリング", reward: "購入7%", status: "提携済み", score: 82, favorite: false, predicted: 2200 },
];

const initialApprovals = [
{ id: 1, title: "ChatGPT便利機能3選", channel: "Instagram / Threads", asp: "PLAUD", time: "20:15", status: "承認待ち", value: 1200, counted: false },
{ id: 2, title: "AI画像生成で時短する方法", channel: "TikTok / Shorts", asp: "ConoHa AI Canvas", time: "19:40", status: "修正待ち", value: 900, counted: false },
{ id: 3, title: "ブログ記事をAIで量産する方法", channel: "Blog / X", asp: "Value AI Writer", time: "明日 09:00", status: "保留", value: 1500, counted: false },
];

const initialAnalytics = { clicks: 0, cv: 0, revenue: 0 };

const initialDraft = {
title: "ChatGPT便利機能3選",
channel: "Instagram / Threads / Blog",
asp: "PLAUD",
value: 1000,
body: "Affiliate Hubから投稿ネタを送ると、ここに反映されます。",
};

const loadStorage = (key, fallback) => {
try {
const saved = localStorage.getItem(key);
return saved ? JSON.parse(saved) : fallback;
} catch {
return fallback;
}
};

function TopBar({ notifications, savedAt }) {
return (
<div className="topbar">
<div>
<p className="eyebrow">NEXORA COMMAND CENTER</p>
<strong>Good Morning, 健さん</strong>
<p className="muted">保存状態：{savedAt || "準備中"}</p>
</div>
<div className="top-actions">
<button className="icon-btn">🔔 {notifications}</button>
<button className="profile-btn">KEN</button>
</div>
</div>
);
}

function Dashboard({ approvals, programs, analytics, savedAt }) {
const waiting = approvals.filter((a) => a.status === "承認待ち").length;
const approved = approvals.filter((a) => a.status === "承認済み").length;
const favorites = programs.filter((p) => p.favorite).length;
const predicted = programs.filter((p) => p.favorite).reduce((sum, p) => sum + p.predicted, 0);

return (
<main className="content">
<TopBar notifications={waiting} savedAt={savedAt} />

<div className="hero">
<p className="eyebrow">AI BUSINESS OPERATING SYSTEM</p>
<h1>今日やる仕事は、NEXORAが整理します。</h1>
<p className="lead">案件選定 → 投稿生成 → 承認 → 分析まで、1つの流れで進めます。</p>
</div>

<div className="stats">
<div className="stat-card"><span>予測売上</span><strong>{predicted.toLocaleString()}円</strong><p>お気に入り案件ベース</p></div>
<div className="stat-card"><span>承認待ち</span><strong>{waiting}件</strong><p>投稿候補</p></div>
<div className="stat-card"><span>承認済み</span><strong>{approved}件</strong><p>Analytics反映済み</p></div>
<div className="stat-card"><span>AI経由売上</span><strong>{analytics.revenue.toLocaleString()}円</strong><p>承認で加算</p></div>
</div>

<section className="panel">
<h2>今日のAI指示</h2>
<div className="mission-list">
<div>01｜Affiliate Hubで高スコア案件を選ぶ</div>
<div>02｜投稿ネタを生成してContent Studioへ送る</div>
<div>03｜生成した投稿をApproval Centerへ追加する</div>
<div>04｜承認後、Analyticsで数値を見る</div>
</div>
</section>
</main>
);
}

function AffiliateHub({ programs, setPrograms, setDraft, setPage, savedAt }) {
const [query, setQuery] = useState("");

const filtered = useMemo(() => {
return programs.filter((p) =>
`${p.name} ${p.asp} ${p.category}`.toLowerCase().includes(query.toLowerCase())
);
}, [programs, query]);

const toggleFavorite = (name) => {
setPrograms((prev) => prev.map((p) => p.name === name ? { ...p, favorite: !p.favorite } : p));
};

const sendToStudio = (item, type) => {
setDraft({
title: `${item.name}を使った${type}`,
channel: "Instagram / Threads / Blog",
asp: item.name,
value: Math.round(item.predicted / 3),
body: `【${type}】
案件：${item.name}
カテゴリ：${item.category}
報酬：${item.reward}
Revenue Score：${item.score}

投稿テーマ案：
1. ${item.category}で作業時間を減らす方法
2. 初心者でも使いやすい${item.name}活用法
3. 副業・仕事効率化に${item.name}が向いている理由

CTA：
詳しくはプロフィールリンクから確認。`
});
setPage("content");
};

return (
<main className="content">
<TopBar notifications={0} savedAt={savedAt} />

<div className="panel">
<h1>Affiliate Hub</h1>
<p className="muted">案件管理・検索・お気に入り・Content Studio連携。</p>
<input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="案件名・ASP・カテゴリで検索" />
</div>

<div className="grid">
{filtered.map((item) => (
<div className="card offer-card" key={item.name}>
<div className="card-header">
<div>
<h2>{item.name}</h2>
<p>{item.category}</p>
</div>
<span className="badge">Score {item.score}</span>
</div>

<ul>
<li>ASP：{item.asp}</li>
<li>報酬：{item.reward}</li>
<li>予測：{item.predicted.toLocaleString()}円</li>
<li>お気に入り：{item.favorite ? "YES" : "NO"}</li>
</ul>

<div className="actions">
<button onClick={() => toggleFavorite(item.name)}>{item.favorite ? "★ 解除" : "★ 追加"}</button>
<button onClick={() => sendToStudio(item, "投稿ネタ")}>📝 投稿ネタ</button>
<button onClick={() => sendToStudio(item, "記事ネタ")}>📖 記事ネタ</button>
<button onClick={() => sendToStudio(item, "動画台本")}>🎬 動画台本</button>
</div>
</div>
))}
</div>
</main>
);
}

function ContentStudio({ draft, setDraft, setApprovals, setPage, savedAt }) {
const [title, setTitle] = useState(draft.title);
const [channel, setChannel] = useState(draft.channel);
const [body, setBody] = useState(draft.body);

useEffect(() => {
setTitle(draft.title);
setChannel(draft.channel);
setBody(draft.body);
}, [draft]);

const regenerate = () => {
const nextBody = `テーマ：${title}
媒体：${channel}

Instagram構成：
1枚目：結論
2枚目：悩み
3枚目：解決策
4枚目：使い方
5枚目：案件導線
6枚目：保存CTA

Threads投稿：
${title}は、作業効率化・副業導線・AI活用と相性が高いテーマです。

ブログ構成：
H2：なぜ今このテーマが重要か
H2：初心者向けの使い方
H2：おすすめ案件
H2：注意点
H2：まとめ`;

setBody(nextBody);
setDraft((prev) => ({ ...prev, title, channel, body: nextBody }));
};

const addToApproval = () => {
setDraft((prev) => ({ ...prev, title, channel, body }));

setApprovals((prev) => [
{
id: Date.now(),
title,
channel,
asp: draft.asp || "未設定",
time: "今日 20:00",
status: "承認待ち",
value: draft.value || 1000,
counted: false,
},
...prev,
]);

setPage("approval");
};

return (
<main className="content">
<TopBar notifications={0} savedAt={savedAt} />

<div className="panel">
<h1>Content Studio</h1>
<p className="muted">Affiliate Hubから受け取った案件情報をもとに投稿を作成。</p>

<input className="search" value={title} onChange={(e) => setTitle(e.target.value)} />
<input className="search" value={channel} onChange={(e) => setChannel(e.target.value)} />

<div className="actions">
<button onClick={regenerate}>✨ 再生成</button>
<button onClick={() => navigator.clipboard.writeText(body)}>📋 コピー</button>
<button onClick={addToApproval}>✅ 承認待ちへ追加</button>
</div>

<pre className="prompt-box">{body || "Affiliate Hubから投稿ネタを送るか、ここで生成してください。"}</pre>
</div>
</main>
);
}

function ApprovalCenter({ approvals, setApprovals, setAnalytics, savedAt }) {
const updateStatus = (id, status) => {
const target = approvals.find((a) => a.id === id);

setApprovals((prev) =>
prev.map((a) => {
if (a.id !== id) return a;
if (status === "承認済み") return { ...a, status, counted: true };
return { ...a, status };
})
);

if (status === "承認済み" && target && !target.counted) {
setAnalytics((prev) => ({
clicks: prev.clicks + 38,
cv: prev.cv + 1,
revenue: prev.revenue + target.value,
}));
}
};

return (
<main className="content">
<TopBar notifications={approvals.filter((a) => a.status === "承認待ち").length} savedAt={savedAt} />

<div className="panel">
<h1>Approval Center</h1>
<p className="muted">承認するとAnalyticsとDashboardへ反映されます。</p>
</div>

<div className="grid">
{approvals.map((a) => (
<div className="card" key={a.id}>
<span className="badge">{a.status}</span>
<h2>{a.title}</h2>
<p>{a.channel}</p>
<p>案件：{a.asp}</p>
<p>投稿予定：{a.time}</p>
<p>予測価値：{a.value.toLocaleString()}円</p>
<div className="actions">
<button onClick={() => updateStatus(a.id, "承認済み")}>✅ 承認</button>
<button onClick={() => updateStatus(a.id, "修正待ち")}>🟡 修正</button>
<button onClick={() => updateStatus(a.id, "保留")}>⏸ 保留</button>
</div>
</div>
))}
</div>
</main>
);
}

function Analytics({ analytics, approvals, savedAt }) {
const approved = approvals.filter((a) => a.status === "承認済み").length;
const ctr = analytics.clicks ? "4.8%" : "0%";

return (
<main className="content">
<TopBar notifications={0} savedAt={savedAt} />

<div className="panel">
<h1>Analytics</h1>
<p className="muted">承認済み投稿をもとに仮数値を連動表示。</p>
</div>

<div className="stats">
<div className="stat-card"><span>クリック</span><strong>{analytics.clicks}</strong><p>承認ごとに加算</p></div>
<div className="stat-card"><span>CV</span><strong>{analytics.cv}</strong><p>成果待ち</p></div>
<div className="stat-card"><span>CTR</span><strong>{ctr}</strong><p>投稿後に記録</p></div>
<div className="stat-card"><span>AI経由売上</span><strong>{analytics.revenue.toLocaleString()}円</strong><p>{approved}件承認済み</p></div>
</div>
</main>
);
}

function Assistant({ programs, approvals, savedAt }) {
const top = [...programs].sort((a, b) => b.score - a.score)[0];
const waiting = approvals.filter((a) => a.status === "承認待ち").length;

return (
<main className="content">
<TopBar notifications={waiting} savedAt={savedAt} />

<div className="panel assistant-panel">
<h1>AI Assistant</h1>
<div className="chat-bubble">健さん、本日の最優先案件は「{top.name}」です。Revenue Scoreが{top.score}で最も高いです。</div>
<div className="chat-bubble">承認待ちは{waiting}件あります。まずApproval Centerで確認しましょう。</div>
<div className="chat-bubble">次の一手：Affiliate Hub → Content Studio → Approval Center の順に進めると最短です。</div>
</div>
</main>
);
}

function Settings({ resetAll, savedAt }) {
return (
<main className="content">
<TopBar notifications={0} savedAt={savedAt} />
<div className="panel">
<h1>Settings / Profile</h1>
<div className="mission-list">
<div>Profile｜健 / NEXORA Owner</div>
<div>Notifications｜承認待ち・投稿予定・売上通知</div>
<div>User Management｜v1は疑似ログイン</div>
<div>Security｜Basic認証稼働中</div>
<div>Storage｜localStorage保存対応</div>
</div>
<div className="actions">
<button onClick={resetAll}>🧹 データ初期化</button>
</div>
</div>
</main>
);
}

function FloatingAssistant({ approvals }) {
const waiting = approvals.filter((a) => a.status === "承認待ち").length;

return (
<div className="floating-ai">
<strong>🤖 NEXORA AI</strong>
<p>承認待ち {waiting}件。次はApproval Centerへ。</p>
</div>
);
}

export default function App() {
const [page, setPage] = useState("dashboard");

const [programs, setPrograms] = useState(() =>
loadStorage("nexora-programs", initialPrograms)
);

const [approvals, setApprovals] = useState(() =>
loadStorage("nexora-approvals", initialApprovals)
);

const [analytics, setAnalytics] = useState(() =>
loadStorage("nexora-analytics", initialAnalytics)
);

const [draft, setDraft] = useState(() =>
loadStorage("nexora-draft", initialDraft)
);

const [savedAt, setSavedAt] = useState("未保存");

useEffect(() => {
localStorage.setItem("nexora-programs", JSON.stringify(programs));
setSavedAt(new Date().toLocaleTimeString("ja-JP"));
}, [programs]);

useEffect(() => {
localStorage.setItem("nexora-approvals", JSON.stringify(approvals));
setSavedAt(new Date().toLocaleTimeString("ja-JP"));
}, [approvals]);

useEffect(() => {
localStorage.setItem("nexora-analytics", JSON.stringify(analytics));
setSavedAt(new Date().toLocaleTimeString("ja-JP"));
}, [analytics]);

useEffect(() => {
localStorage.setItem("nexora-draft", JSON.stringify(draft));
setSavedAt(new Date().toLocaleTimeString("ja-JP"));
}, [draft]);

const resetAll = () => {
const ok = window.confirm("保存データを初期化しますか？");
if (!ok) return;

localStorage.removeItem("nexora-programs");
localStorage.removeItem("nexora-approvals");
localStorage.removeItem("nexora-analytics");
localStorage.removeItem("nexora-draft");

setPrograms(initialPrograms);
setApprovals(initialApprovals);
setAnalytics(initialAnalytics);
setDraft(initialDraft);
setPage("dashboard");
setSavedAt("初期化済み");
};

const pages = {
dashboard: <Dashboard approvals={approvals} programs={programs} analytics={analytics} savedAt={savedAt} />,
affiliate: <AffiliateHub programs={programs} setPrograms={setPrograms} setDraft={setDraft} setPage={setPage} savedAt={savedAt} />,
content: <ContentStudio draft={draft} setDraft={setDraft} setApprovals={setApprovals} setPage={setPage} savedAt={savedAt} />,
approval: <ApprovalCenter approvals={approvals} setApprovals={setApprovals} setAnalytics={setAnalytics} savedAt={savedAt} />,
analytics: <Analytics analytics={analytics} approvals={approvals} savedAt={savedAt} />,
assistant: <Assistant programs={programs} approvals={approvals} savedAt={savedAt} />,
settings: <Settings resetAll={resetAll} savedAt={savedAt} />,
};

return (
<div className="app-shell">
<aside className="sidebar">
<div className="brand">
<div className="logo">N</div>
<div><h2>NEXORA</h2><p>AI OS v1.5</p></div>
</div>

<nav className="nav">
<button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>🏠 Dashboard</button>
<button className={page === "affiliate" ? "active" : ""} onClick={() => setPage("affiliate")}>💰 Affiliate Hub</button>
<button className={page === "content" ? "active" : ""} onClick={() => setPage("content")}>✍️ Content Studio</button>
<button className={page === "approval" ? "active" : ""} onClick={() => setPage("approval")}>✅ Approval Center</button>
<button className={page === "analytics" ? "active" : ""} onClick={() => setPage("analytics")}>📊 Analytics</button>
<button className={page === "assistant" ? "active" : ""} onClick={() => setPage("assistant")}>🤖 AI Assistant</button>
<button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>⚙️ Settings</button>
</nav>
</aside>

{pages[page]}
<FloatingAssistant approvals={approvals} />
</div>
);
}
