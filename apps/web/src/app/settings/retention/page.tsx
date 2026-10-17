
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Retention" description="Retention windows and deletion: event, audit, and evidence retention; GDPR erasure and export requests." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Retention windows"><p className="m3-body-md" style={{margin:0}}>Retention windows are enforced by the lifecycle contract — expired data is deleted, not merely hidden.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
