import { PageHeader, Card, EmptyState, Tabs } from "@/components/m3";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader title="Policy Detail" description={`Rules, versions, diff, simulation for policy ${params.id}.`}
        crumbs={[{ label: "Policies", href: "/policies" }, { label: params.id }]}
        primary={{ label: "All policies", href: "/policies" }} />
      <Card title={`Policy ${params.id}`}>
        <Tabs tabs={[
          { id: "rules", label: "Rules", content: <EmptyState icon="📜" title="No rules in this policy yet" guidance="Add rules from plain English or a policy pack." actionLabel="Author a rule" actionHref="/policies/nl" /> },
          { id: "versions", label: "Versions", content: <p className="m3-body-md">Version timeline: every activation creates a version with a diff. Rollback restores a previous version (audited).</p> },
          { id: "diff", label: "Diff", content: <p className="m3-body-md">Diff shows exactly what changed between two versions — added, removed, and modified rules.</p> },
          { id: "simulation", label: "Simulation", content: <p className="m3-body-md">Replay past events against this policy to see which actions would be allowed, denied, or held for approval.</p> },
        ]} />
      </Card>
    </div>
  );
}
