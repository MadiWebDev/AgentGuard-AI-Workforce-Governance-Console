
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Sessions" description="Active sessions across devices. Revoking a session ends it immediately." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Active sessions"><EmptyState icon="🖥️" title="No other sessions" guidance="Sessions from other devices appear here. Revoking ends that session immediately." /></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
