import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Baselines & Drift" description="Nightly baselines: tools, cost/run mean/std, latency p50/p95, error rate. Drift alerts fire when |z| exceeds 3, linked to trace ids."
        crumbs={[{ label: "Home", href: "/" }, { label: "Baselines" }]} />
      <Card title="Baseline metrics">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip>Tools used</Chip><Chip>Cost / run (mean ± std)</Chip><Chip>Latency p50 / p95</Chip><Chip>Error rate</Chip>
        </div>
        <p className="m3-body-md" style={{ marginTop: 12 }}>Baselines are computed nightly per agent. A drift alert names the metric, the z-score, and the offending trace ids.</p>
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card title="Drift alerts">
          <EmptyState icon="📈" title="No drift alerts" guidance="When |z| exceeds 3 for a baselined metric, the alert appears here linked to its traces." actionLabel="View traces" actionHref="/traces" />
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Related"><Link className="m3-btn m3-btn-outlined" href="/alerts">Alert feed</Link></Card>
      </div>
    </div>
  );
}
