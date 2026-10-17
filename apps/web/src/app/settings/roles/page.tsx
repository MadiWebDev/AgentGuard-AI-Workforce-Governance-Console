
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Roles" description="Role-based access control: Admin, Approver, Viewer, Agent. Roles gate every page and API call." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Roles"><p className="m3-body-md" style={{margin:0}}>Admin manages everything; Approver decides approvals; Viewer reads; Agent keys are scoped to ingest only.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
