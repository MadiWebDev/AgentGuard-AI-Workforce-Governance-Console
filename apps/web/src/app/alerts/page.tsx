import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Alerts" description="Alert rules, dedupe, snooze, acknowledge, channels."
        crumbs={[{ label: "Home", href: "/" }, { label: "Alerts" }]}
        primary={{ label: "View costs", href: "/costs" }} />
      <Card title="Alert rules">
        <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><strong>Drift:</strong> |z| &gt; 3 on baselined metrics — see <a href="/baseline">Baselines</a>.</li>
          <li><strong>Budget:</strong> spend thresholds per plan — see <a href="/costs">Costs</a>.</li>
          <li><strong>Approval SLA:</strong> breaching approvals page on-call — see <a href="/oncall">On-call</a>.</li>
          <li><strong>Compliance:</strong> failed control tests — see <a href="/compliance">Compliance</a>.</li>
        </ul>
        <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)" }}>Alerts dedupe on (rule, subject); acknowledge or snooze from the Costs page or the alert feed.</p>
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card title="Alert feed">
          <EmptyState icon="🔔" title="No active alerts" guidance="When a rule fires, the alert appears here with severity, subject, and acknowledge/snooze actions." actionLabel="Check compliance" actionHref="/compliance" />
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Channels" subtitle="Where alerts go.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip tone="primary">In-app</Chip>
            <Chip>Slack webhook (SLACK_WEBHOOK_URL)</Chip>
            <Chip>PagerDuty / Opsgenie (on-call)</Chip>
            <Chip>Email (Resend)</Chip>
          </div>
        </Card>
      </div>
    </div>
  );
}
