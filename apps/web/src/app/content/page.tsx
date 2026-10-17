import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Content Review" description="Compliance checker: rulesets, AI findings with spans, approval before publish."
        crumbs={[{ label: "Home", href: "/" }, { label: "Content Review" }]} />
      <Card title="Review queue">
        <EmptyState icon="✍" title="Nothing to review" guidance="Content submitted for review appears here with AI findings, highlighted spans, and approve-before-publish actions." actionLabel="View policies" actionHref="/policies" />
      </Card>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card title="Rulesets" subtitle="Which checks run on content.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip>PII</Chip><Chip>Toxicity</Chip><Chip>Policy compliance</Chip><Chip>Brand safety</Chip></div>
        </Card>
        <Card title="Findings" subtitle="AI findings carry spans — the exact text that triggered the rule.">
          <p className="m3-body-md" style={{ margin: 0 }}>Each finding links to its span and the rule that fired, so a reviewer can judge it in context.</p>
        </Card>
      </div>
    </div>
  );
}
