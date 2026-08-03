import React from "react";
import { Badge, EnvironmentBadge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function AIEmployeeCard({ name, role, maturity = "locked", status = "unknown", activeTask, permission, provider, costToday, lastActivity, externalExecution = "locked", action, className = "" }) {
  return <Card variant="employee" className={`kv-employee-card ${className}`.trim()}>
    <div className="kv-employee-card__header"><div className="kv-employee-card__monogram" aria-hidden="true">{name?.slice(0, 2).toUpperCase()}</div><div><h2>{name}</h2><p>{role}</p></div><Badge state={status} label={maturity} /></div>
    <dl className="kv-detail-list kv-employee-priority"><div><dt>現在の仕事</dt><dd>{activeTask || "未取得"}</dd></div><div><dt>最終活動</dt><dd>{lastActivity || "稼働履歴なし"}</dd></div><div><dt>Provider</dt><dd>{provider || "None"}</dd></div><div><dt>本日のコスト</dt><dd>{costToday ?? "未取得"}</dd></div></dl>
    <details className="kv-technical-details"><summary>権限と実行境界</summary><div className="kv-technical-details__body"><dl className="kv-detail-list"><div><dt>権限</dt><dd>{permission || "未確認"}</dd></div><div><dt>外部実行</dt><dd><EnvironmentBadge environment={externalExecution} /></dd></div></dl></div></details>
    {action ? <div className="kv-card-action">{action}</div> : null}
  </Card>;
}
