
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Data Residency" description="Region routing and storage: EU-only, US-only, or global per org. Violations are rejected at ingest." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Residency policy"><p className="m3-body-md" style={{margin:0}}>Set the residency region per org. Cross-region writes are rejected at ingest with RESIDENCY_VIOLATION.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
