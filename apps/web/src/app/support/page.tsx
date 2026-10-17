import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Support QA" description="Ticket scoring, failed-resolution detection, KB fix suggestions."
        crumbs={[{ label: "Home", href: "/" }, { label: "Support QA" }]} />
      <Card title="Ticket queue">
        <EmptyState icon="🎧" title="No tickets scored yet" guidance="Support tickets scored by the QA add-on appear here with resolution quality, failed-resolution flags, and KB fix suggestions." />
      </Card>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card title="Quality signals" subtitle="What the scorer checks.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip>Resolution rate</Chip><Chip>Policy compliance</Chip><Chip>Tone</Chip><Chip>KB coverage</Chip></div>
        </Card>
        <Card title="Failed resolutions" subtitle="Tickets that look resolved but are not.">
          <p className="m3-body-md" style={{ margin: 0 }}>Failed-resolution detection flags tickets whose follow-ups suggest the issue persisted, so they can be reopened with a KB fix suggestion.</p>
        </Card>
      </div>
    </div>
  );
}
