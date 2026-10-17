
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — API Keys" description="Create and revoke keys for agent SDKs and services. Keys are shown once at creation; rotation is audit-logged." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Keys"><EmptyState icon="🔑" title="No API keys yet" guidance="Create your first key for an agent or service. Scopes follow the role of the creator." actionLabel="Create key" actionHref="/settings/api-keys" /></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
