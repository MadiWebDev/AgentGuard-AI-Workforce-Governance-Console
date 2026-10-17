
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Integrations" description="SIEM streaming, warehouse sync, on-call providers, and PagerDuty / Opsgenie keys." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Connected services"><p className="m3-body-md" style={{margin:0}}>Configure provider keys in environment variables (see .env.example); this page surfaces their configured / not-configured status.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
