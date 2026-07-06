import TopBar from "./TopBar";

export default function Dashboard({
  approvals,
  programs,
  analytics,
  todos,
  setTodos,
  notifications,
  opportunities,
  pipelineRuns,
  savedAt,
  setPage,
}) {
  const waiting = approvals.filter((a) => a.status === "承認待ち").length;
  const approved = approvals.filter((a) => a.status === "承認済み").length;
  const predicted = programs.filter((p) => p.favorite).reduce((sum, p) => sum + p.predicted, 0);
  const done = todos.filter((t) => t.done).length;
  const unread = notifications.filter((n) => !n.read).length;
  const monthlyGoal = 300000;
  const progress = Math.min(100, Math.round((analytics.revenue / monthlyGoal) * 100));

  const toggleTodo = (id) => {
    setTodos((prev) => prev.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo));
  };

  return (
    <main className="content">
      <TopBar notifications={unread + waiting} savedAt={savedAt} />

      <div className="hero mission-hero">
        <div>
          <p className="eyebrow">LIVING INTELLIGENCE</p>
          <h1>おはようございます、健さん。</h1>
          <p className="lead">KEVIRIOが今日の仕事を整理します。人は創造へ。AIは実行へ。</p>
        </div>
        <div className="mission-orb">
          <span>{progress}%</span>
          <small>Monthly Goal</small>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span>今月目標</span><strong>{monthlyGoal.toLocaleString()}円</strong><p>Revenue Target</p></div>
        <div className="stat-card"><span>AI経由売上</span><strong>{analytics.revenue.toLocaleString()}円</strong><p>承認済みから反映</p></div>
        <div className="stat-card"><span>承認待ち</span><strong>{waiting}件</strong><p>今日処理する候補</p></div>
        <div className="stat-card"><span>Pipeline</span><strong>{pipelineRuns.length}件</strong><p>一括処理履歴</p></div>
      </div>

      <section className="panel focus-panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">TODAY'S FOCUS</p>
            <h2>今日の優先順位</h2>
          </div>
          <button onClick={() => setPage("work")}>＋ 新しい仕事</button>
        </div>
        <div className="mission-list">
          {todos.map((todo) => (
            <button className="wide-btn" key={todo.id} onClick={() => toggleTodo(todo.id)}>
              {todo.done ? "✅" : "□"} {todo.text}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">AI SUGGESTION</p>
            <h2>KEVIRIOからの提案</h2>
          </div>
          <button onClick={() => setPage("assistant")}>AIに相談</button>
        </div>
        <div className="mission-list">
          <div>まずWork Commandで新しい案件・ネタを登録してください。</div>
          <div>承認待ちが{waiting}件あります。Approval Centerで処理するとAnalyticsに反映されます。</div>
          <div>お気に入り案件ベースの予測売上は{predicted.toLocaleString()}円です。</div>
        </div>
      </section>

      <section className="panel">
        <h2>Workflow Summary</h2>
        <div className="mission-list">
          <div>Work Queue：{opportunities.length}件</div>
          <div>Pipeline Runs：{pipelineRuns.length}件</div>
          <div>承認済み：{approved}件</div>
          <div>クリック：{analytics.clicks} / CV：{analytics.cv}</div>
        </div>
      </section>

      <section className="panel">
        <h2>Notification Center</h2>
        <div className="mission-list">
          {notifications.map((n) => (
            <div key={n.id}>{n.read ? "既読" : "未読"}｜{n.title}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
