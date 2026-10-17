
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Webhooks" description="Delivery endpoints for approval, incident, and audit events. Deliveries are signed and retried with backoff." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Endpoints"><EmptyState icon="🔔" title="No webhook endpoints" guidance="Add an endpoint to receive signed event deliveries with retry and a delivery log." /></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
