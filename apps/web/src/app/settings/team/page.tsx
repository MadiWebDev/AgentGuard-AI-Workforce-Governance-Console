
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Team" description="Invite teammates, assign roles, and manage SSO / SCIM provisioning." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Members"><EmptyState icon="👥" title="No team members yet" guidance="Invite teammates and assign roles. SSO / SCIM provisioning syncs directory membership." /></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
