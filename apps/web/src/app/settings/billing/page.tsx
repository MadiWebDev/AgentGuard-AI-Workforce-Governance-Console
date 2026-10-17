
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Billing" description="Your AgentGuard subscription: plan, usage, invoices, and upgrade. Client billing lives under Billing → Clients." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Plan"><p className="m3-body-md" style={{margin:0}}>Usage meters and invoices are rendered from the real subscription record in production. See <a href="/pricing">Pricing</a> for plans.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
