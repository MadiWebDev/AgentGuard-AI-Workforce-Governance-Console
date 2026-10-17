import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState, Tabs } from "@/components/m3";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title="Agent Detail" description={`Agent ${params.id} — keys, recent events, kill switch. Data loads from the agents API; this page organizes it by tab.`}
        crumbs={[{ label: "Agents", href: "/agents" }, { label: params.id }]}
        primary={{ label: "All agents", href: "/agents" }}
        secondary={[{ label: "Traces", href: "/traces" }]} />
      <Card title={`Agent ${params.id}`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <Chip tone="success">Status: see registry</Chip>
          <Chip>Keys: hash-only, scoped, rotatable</Chip>
        </div>
        <Tabs tabs={[
          { id: "overview", label: "Overview", content: <p className="m3-body-md">Overview for this agent — identity, tier, environment. Recent events appear in Traces once ingested.</p> },
          { id: "traces", label: "Traces", content: <EmptyState icon="↔" title="No traces for this agent yet" guidance="Ingest events with this agentId to see its waterfall here." actionLabel="View all traces" actionHref="/traces" /> },
          { id: "policies", label: "Policies", content: <p className="m3-body-md">Policies that apply to this agent, in precedence order. Manage them from <Link href="/policies">Policies</Link>.</p> },
          { id: "keys", label: "Keys", content: <p className="m3-body-md">Per-agent API keys are hash-only and scoped. Rotate from Settings → API keys; old keys enter a grace period before expiry.</p> },
          { id: "audit", label: "Audit", content: <p className="m3-body-md">Every action by this agent is in the hash-chained audit log. Filter by actor on the <Link href="/audit">Audit Log</Link> page.</p> },
        ]} />
      </Card>
    </div>
  );
}
