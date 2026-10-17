import { PageHeader, Card, EmptyState } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Reports" description="Client-proof reporting: workspaces, reconciliation, share links, PDF export."
        crumbs={[{ label: "Home", href: "/" }, { label: "Reports" }]}
        primary={{ label: "Export evidence", href: "/audit" }} />
      <Card title="Report workspaces">
        <EmptyState icon="📄" title="No reports yet" guidance="Reports are built from evidence packs: generate a pack from the Audit Log, then share it with a client via a workspace link. PDF export comes from the evidence pack generator." actionLabel="Generate evidence pack" actionHref="/audit" />
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card title="Reconciliation" subtitle="Client-proof numbers reconcile to the audit log: every reported event has a hash-chained row.">
          <p className="m3-body-md" style={{ margin: 0 }}>Reconciliation compares report totals against the audit chain — any mismatch names the first broken row.</p>
        </Card>
      </div>
    </div>
  );
}
