import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/m3";

export default function Page({ params }: { params: { orgId: string } }) {
  return (
    <div>
      <PageHeader title="Client Portal" description={`Client-facing portal for org ${params.orgId}: only this client's reports and approvals are visible. Data is scoped server-side by org — other orgs' data is never returned.`}
        crumbs={[{ label: "Home", href: "/" }, { label: "Portal" }, { label: params.orgId }]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <Card title="Your reports">
          <EmptyState icon="📄" title="No reports for this org yet" guidance="Reports for this client appear here once evidence packs are generated for this org." actionLabel="Generate a pack" actionHref="/audit" />
        </Card>
        <Card title="Your approvals">
          <EmptyState icon="✓" title="No approvals for this org" guidance="Approvals scoped to this org appear here. Approvals for other orgs are never returned." actionLabel="View approvals" actionHref="/approvals" />
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Portal scope" subtitle="This portal is branded per org (see White-label) and shows only this client's data.">
          <Link className="m3-btn m3-btn-outlined" href="/brand">White-label settings</Link>
        </Card>
      </div>
    </div>
  );
}
