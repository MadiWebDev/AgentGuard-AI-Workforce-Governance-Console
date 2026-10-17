import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Legal — subprocessors" description="Legal document for AgentGuard." crumbs={[{ label: "Home", href: "/" }, { label: "Legal" }, { label: "subprocessors" }]} />
      <Card title="Legal text required">
        <Chip tone="warning">LEGAL TEXT REQUIRED</Chip>
        <p className="m3-body-lg" style={{ marginTop: 12 }}>
          Replace with counsel-reviewed text before launch. This placeholder is intentionally visible — do not ship real legal claims without counsel review.
        </p>
      </Card>
    </div>
  );
}
