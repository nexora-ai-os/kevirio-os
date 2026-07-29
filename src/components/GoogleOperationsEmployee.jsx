import { GOOGLE_CAPABILITIES, GOOGLE_WORKFLOWS } from "../services/googleOperations";
import { AIEmployeeCard, Badge, Card, EnvironmentBadge, PageHeader, SectionHeader, Stack, Table } from "../design-system/index.js";
import "./ProductionScreens.css";

const serviceLabel = { gmail: "Gmail", drive: "Drive", calendar: "Calendar", analytics: "Analytics", search_console: "Search Console", youtube: "YouTube" };

export default function GoogleOperationsEmployee() {
  const capabilities = Object.entries(GOOGLE_CAPABILITIES).map(([id, capability]) => ({ id, ...capability }));
  const columns = [
    { key: "capability", label: "Capability", render: (item) => item.id.replaceAll("_", " ") },
    { key: "service", label: "Service", render: (item) => serviceLabel[item.service] || item.service },
    { key: "scope", label: "Permission", render: (item) => item.scope },
    { key: "maturity", label: "Maturity", render: (item) => <Badge state={item.maturity === "Locked" ? "locked" : "candidate"} label={item.maturity} /> },
  ];
  return <main className="content kv-production-screen"><Stack gap="8"><PageHeader title="AI Employees" description="Formal AI Employee registry" actions={<EnvironmentBadge environment="dry_run" />} /><AIEmployeeCard name="Google Operations" role="Cross-service operations support" maturity="Conditional" status="pending" activeTask="Owner setup required" permission="Read-only and approval-gated capabilities" provider="Google" costToday={null} lastActivity="Unknown" externalExecution="dry_run" />
    <section><SectionHeader title="Capabilities" description="Undefined Production contract fields remain non-Production." /><Table caption="Google Operations capabilities" columns={columns} rows={capabilities} /></section>
    <section><SectionHeader title="Cross-Service Workflows" /><div className="kv-screen-grid">{Object.entries(GOOGLE_WORKFLOWS).map(([id, items]) => <Card key={id}><h2>{id.replaceAll("_", " ")}</h2><p>{items.length} capabilities</p><Badge state="locked" label="Dry Run only" /><p>Google API calls: 0</p></Card>)}</div></section>
  </Stack></main>;
}
