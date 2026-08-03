import { GOOGLE_CAPABILITIES, GOOGLE_WORKFLOWS } from "../services/googleOperations";
import { AIEmployeeCard, Badge, Card, DataReadiness, EnvironmentBadge, PageHeader, SectionHeader, Stack, SystemBoundary, Table } from "../design-system/index.js";
import "./ProductionScreens.css";

const serviceLabel = { gmail: "Gmail", drive: "Drive", calendar: "Calendar", analytics: "Analytics", search_console: "Search Console", youtube: "YouTube" };

export default function GoogleOperationsEmployee() {
  // Production invariant: Google API calls: 0
  const capabilities = Object.entries(GOOGLE_CAPABILITIES).map(([id, capability]) => ({ id, ...capability }));
  const columns = [
    { key: "capability", label: "できること", render: (item) => item.id.replaceAll("_", " ") },
    { key: "service", label: "サービス", render: (item) => serviceLabel[item.service] || item.service },
    { key: "scope", label: "権限", render: (item) => <details><summary>技術的な権限を表示</summary><code>{item.scope}</code></details> },
    { key: "maturity", label: "準備状態", render: (item) => <Badge state={item.maturity === "Locked" ? "locked" : "candidate"} label={item.maturity === "Locked" ? "ロック中" : "条件付き"} /> },
  ];
  return <main className="content kv-production-screen kv-archetype-workforce"><Stack gap="8"><PageHeader eyebrow="AI WORKFORCE CONTROL" title="AI社員" description="AI社員の役割、権限、準備状態を、実行可能性と分離して管理します。" actions={<EnvironmentBadge environment="dry_run" />} /><SystemBoundary title="Google OperationsはDry Run" description="定義済みCapabilityを確認できますが、Google APIへの外部実行は行いません。" items={["外部呼び出し 0", "Owner承認境界", "権限不足はFail Closed"]} /><AIEmployeeCard name="Google Operations" role="Googleサービスを横断する業務支援" maturity="条件付き" status="pending" activeTask="Ownerによる設定が必要です" permission="読み取り専用・承認が必要な機能" provider="Google" costToday={null} lastActivity="未取得" externalExecution="dry_run" /><DataReadiness title="AI社員の稼働準備" state="conditional" current="Dry Run契約のみ" required="Provider接続、Scope、Cost Guard、Owner承認" nextAction="Capabilityと不足権限を確認" />
    <section><SectionHeader title="業務能力" description="Production契約が定義されていない項目は、Productionとして表示しません。" /><Table caption="Google Operationsの業務能力" columns={columns} rows={capabilities} /></section>
    <section><SectionHeader title="サービス横断ワークフロー" /><div className="kv-screen-grid">{Object.entries(GOOGLE_WORKFLOWS).map(([id, items]) => <Card key={id}><h2>{id.replaceAll("_", " ")}</h2><p>{items.length}件の機能</p><Badge state="locked" label="Dry Runのみ" /><p>Google API呼び出し：0</p></Card>)}</div></section>
  </Stack></main>;
}
