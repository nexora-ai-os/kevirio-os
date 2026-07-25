export default function ProductionFoundationPanel({ ownerSession }) {
  const items=[
    ["Current Workspace / Brand","KEVIRIO Owner Workspace / KEVIRIO","REMOTE BOOTSTRAP REQUIRED"],
    ["Revenue Source of Truth","Supabase Migration 003","REMOTE NOT VERIFIED"],
    ["Actual Revenue","Evidence verification only","ACTUAL ONLY"],
    ["External Execution","Direct Service manual export candidate","LOCKED"],
    ["Security","App-wide Owner Auth / Workspace RLS","CONDITIONAL"],
    ["API Cost","Controlled OpenAI Sandbox","SERVER CAPPED"],
  ];
  return <section className="panel production-foundation-panel" aria-labelledby="production-foundation-title">
    <div className="section-head"><div><p className="eyebrow">Revenue Production Foundation</p><h2 id="production-foundation-title">Owner Control Status</h2></div><span className="status-badge">{ownerSession?.user?.id ? "OWNER VERIFIED" : "LOCKED"}</span></div>
    <div className="metric-grid">{items.map(([label,value,status])=><article className="metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{status}</small></article>)}</div>
    <p>Mock・Forecast・Actualは別Domainです。外部送信、投稿、課金、Deploymentは有効化されていません。</p>
  </section>;
}
