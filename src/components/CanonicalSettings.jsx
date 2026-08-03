import { Badge, Card, EnvironmentBadge, LockedState, PageHeader, PageSection, Stack, SystemBoundary } from "../design-system/index.js";
import "./ProductionScreens.css";

const policies = [
  { title: "表示テーマ", description: "White × Champagne Goldを基調とする明るいKEVIRIOテーマ。", state: "actual", label: "適用中" },
  { title: "実行ポリシー", description: "外部実行はOwner方針と安全ゲートにより無効です。", state: "locked", label: "ロック中" },
  { title: "Provider認証情報", description: "安全なサーバー側フローでのみ管理し、この画面には表示しません。", state: "locked", label: "サーバー管理" },
  { title: "ワークスペース", description: "対応するワークスペース変更契約は存在しません。", state: "unknown", label: "未実装" },
];

export default function CanonicalSettings() {
  // Contract state: Workspace mutation is Not Implemented.
  return <main className="content kv-production-screen kv-archetype-control">
    <Stack gap="8">
      <PageHeader variant="compact" accent="silver" eyebrow="SYSTEM CONTROL" title="設定" description="現在適用されている運用ポリシーと、変更権限の境界を確認します。" actions={<EnvironmentBadge environment="locked" />} />
      <SystemBoundary title="安全な読み取り専用設定" description="未実装の切替や変更操作は表示しません。" items={["Secret非表示", "Feature Flag UIなし", "外部実行ロック"]} />
      <PageSection title="現在の運用ポリシー" description="権限と変更経路を含む現行契約">
        <div className="kv-screen-grid">{policies.map((policy) => <Card key={policy.title} variant="status"><h2>{policy.title}</h2><p>{policy.description}</p><Badge state={policy.state} label={policy.label} /></Card>)}</div>
      </PageSection>
      <LockedState title="変更操作は提供されていません" reason="安全に変更できる本番設定契約が未実装です。" available="現在の方針と成熟度を確認できます。" requirement="Owner承認済みの設定契約、権限、監査、Rollback設計。" />
    </Stack>
  </main>;
}
