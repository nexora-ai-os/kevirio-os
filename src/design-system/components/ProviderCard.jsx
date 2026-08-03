import React from "react";
import { Badge } from "./Badge.jsx";
import { Card } from "./Card.jsx";

export function ProviderCard({ provider, maturity = "locked", connection, credentialStorage = "サーバー管理", readCapability, writeCapability, scope, quota, costGuard, health, ownerAction, externalExecution = false, className = "" }) {
  const usable = connection === "connected" && maturity !== "Locked";
  return <Card variant="provider" className={`kv-provider-card ${className}`.trim()}>
    <div className="kv-provider-card__header"><div><p className="kv-card-eyebrow">Provider</p><h2>{provider}</h2></div><Badge state={usable ? "ready" : "locked"} label={maturity} /></div>
    <dl className="kv-detail-list kv-provider-priority"><div><dt>現在の利用可否</dt><dd>{usable ? "条件付きで利用可能" : "利用不可"}</dd></div><div><dt>接続状態</dt><dd>{connection || "未確認"}</dd></div><div><dt>読み取り</dt><dd>{readCapability || "未確認"}</dd></div><div><dt>書き込み</dt><dd>{writeCapability || "ロック中"}</dd></div><div><dt>コスト保護</dt><dd>{costGuard || "利用不可"}</dd></div><div><dt>外部実行</dt><dd>{externalExecution ? "有効" : "ロック中"}</dd></div></dl>
    <div className="kv-provider-next"><strong>次に行うこと</strong><p>{ownerAction || "現在行える操作はありません"}</p></div>
    <details className="kv-technical-details"><summary>接続契約の詳細</summary><div className="kv-technical-details__body"><dl className="kv-detail-list"><div><dt>認証情報の管理</dt><dd>{credentialStorage}</dd></div><div><dt>Scope</dt><dd>{scope || "None"}</dd></div><div><dt>Quota</dt><dd>{quota || "未取得"}</dd></div><div><dt>最終Health確認</dt><dd>{health || "未取得"}</dd></div></dl></div></details>
  </Card>;
}
