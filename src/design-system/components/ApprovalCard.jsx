import React from "react";
import { Badge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function ApprovalCard({ variant = "standard", title, target, capability, risk, costCeiling, expiry, version, state = "pending", effect, children, actions, className = "" }) {
  return <Card variant="approval" className={`kv-approval-card kv-approval-card--${variant} ${className}`.trim()}>
    <div className="kv-approval-card__header"><div><p className="kv-card-eyebrow">OWNER判断</p><h2>{title}</h2></div><Badge state={state} /></div>
    <dl className="kv-detail-list kv-approval-priority"><div><dt>金額・上限</dt><dd>{costCeiling ?? "未取得"}</dd></div><div><dt>リスク</dt><dd>{risk || "未確認"}</dd></div><div><dt>判断の効果</dt><dd>{effect || "外部実行なし"}</dd></div><div><dt>期限</dt><dd>{expiry || "設定なし"}</dd></div></dl>
    {actions ? <div className="kv-card-action">{actions}</div> : null}
    <details className="kv-technical-details"><summary>対象と実行能力</summary><div className="kv-technical-details__body"><dl className="kv-detail-list"><div><dt>対象</dt><dd>{target || "未取得"}</dd></div><div><dt>実行能力</dt><dd>{capability || "未取得"}</dd></div><div><dt>Version</dt><dd>{version || "未取得"}</dd></div></dl></div></details>
    {children}
  </Card>;
}
