import { EnvironmentBadge, LockedState, PageHeader, Stack, SystemBoundary } from "../design-system/index.js";
import "./ProductionScreens.css";

export default function CanonicalInbox({ setPage }) {
  // Truth boundary: No canonical Production Inbox repository or data source exists.
  return <main className="content kv-production-screen kv-archetype-locked">
    <Stack gap="8">
      <PageHeader variant="compact" accent="purple" eyebrow="OWNER ATTENTION" title="受信箱" description="Ownerへの通知と確認事項を集約する将来のコントロール領域です。" actions={<EnvironmentBadge environment="locked" />} />
      <SystemBoundary title="受信箱は本番未接続" description="正式な受信箱Repositoryや通知データソースは存在しません。" items={["外部実行なし", "通知生成なし", "架空件数なし"]} />
      <LockedState title="受信箱は現在利用できません" reason="本番用受信箱Repositoryと通知契約が未実装です。" available="重要なOwner判断は承認画面で確認できます。" requirement="要対応、AI、System通知を区別する正式なRepository・権限・監査契約。" actionLabel="承認画面を確認" onAction={() => setPage?.("approval")} />
    </Stack>
  </main>;
}
