import { EmptyState, EnvironmentBadge, PageHeader, Stack } from "../design-system/index.js";
import "./ProductionScreens.css";

export default function CanonicalInbox() {
  return <main className="content kv-production-screen"><Stack gap="8"><PageHeader title="Inbox" description="Owner notifications and required attention" actions={<EnvironmentBadge environment="locked" />} /><EmptyState title="Inbox is not connected" message="No canonical Production Inbox repository or data source exists. No messages or activity have been fabricated." /></Stack></main>;
}
