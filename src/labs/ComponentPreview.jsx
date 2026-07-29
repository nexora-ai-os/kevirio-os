import { useState } from "react";
import {
  Badge, Button, Card, Checkbox, EmptyState, EnvironmentBadge, ErrorState, FormField,
  Input, LoadingState, Modal, Money, OwnerActionItem, PageHeader, Radio, SectionHeader,
  Select, SkeletonGroup, Stack, Switch, Textarea, ThemeProvider,
} from "../design-system/index.js";
import "../design-system/styles.css";
import "./component-preview.css";

export default function ComponentPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  return <ThemeProvider><main className="kv-labs"><PageHeader eyebrow="LABS" title="Component Preview" description="Static fixtures only. This content is not Production data." actions={<EnvironmentBadge environment="mock" />} /><Stack gap="8">
    <SectionHeader title="Actions and semantic states" description="Default, loading, disabled, and semantic variants." />
    <Card><div className="kv-labs-grid"><Button>Primary action</Button><Button loading>Loading</Button><Button disabled disabledReason="Unavailable in this fixture">Disabled</Button><Badge state="forecast" /><Badge state="actual" /><Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button></div></Card>
    <SectionHeader title="Form controls" />
    <Card><div className="kv-labs-form"><FormField label="Name" description="Accessible description" required><Input defaultValue="Static fixture" /></FormField><FormField label="Notes" error="Example validation error"><Textarea defaultValue="Fixture" /></FormField><FormField label="Status"><Select defaultValue="ready"><option value="ready">Ready</option><option value="pending">Pending</option></Select></FormField><Checkbox label="Checkbox" defaultChecked /><Radio label="Radio" name="fixture-radio" defaultChecked /><Switch label="Switch" defaultChecked /></div></Card>
    <SectionHeader title="Money semantics" />
    <Card><div className="kv-labs-grid"><Money value={null} currency="JPY" /><Money value={0} currency="JPY" kind="forecast" locale="ja-JP" /><Money value={12000} currency="JPY" kind="forecast" locale="ja-JP" /><Money value={12000} currency="JPY" kind="actual" evidenceVerified locale="ja-JP" /></div></Card>
    <SectionHeader title="System states" />
    <div className="kv-labs-states"><EmptyState title="No items" message="Static empty state." /><ErrorState title="Unable to load" message="Static error state." /><Card><LoadingState label="Loading fixture" /><SkeletonGroup count={3} /></Card></div>
    <SectionHeader title="Owner action presentation" />
    <OwnerActionItem title="Review candidate" description="Presentation-only fixture; no Production action is connected." state="pending" actionLabel="Unavailable" disabledReason="No action is connected" />
  </Stack><Modal open={modalOpen} title="Accessible modal" onClose={() => setModalOpen(false)}><p>This static dialog contains no business logic.</p><Button variant="secondary" onClick={() => setModalOpen(false)}>Close dialog</Button></Modal></main></ThemeProvider>;
}
