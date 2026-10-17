
import { PageHeader, Card, EmptyState } from "@/components/m3";
export default function Page() {
  return (<div>
    <PageHeader title="Settings — Redaction" description="PII redaction before storage: choose detection coverage and custom patterns. Redacted values are never recoverable." crumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
    <Card title="Redaction policy"><p className="m3-body-md" style={{margin:0}}>Emails, tokens, credit cards, SSNs, and API keys are redacted in the pipeline. Redaction runs before storage — there is no unredacted copy.</p></Card>
    <p className="m3-body-md" style={{ color:"var(--m3-on-surface-variant)"}}>Demo UI — mutations call authorize() on the server in production.</p>
  </div>);
}
