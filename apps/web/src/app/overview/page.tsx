"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip, EmptyState, SkeletonCard } from "@/components/m3";
import { ChartCard, BarChart, LineChart } from "@/components/charts";

type Costs = { totalCost: number; events: number; byAgent: Record<string, number>; byModel: Record<string, number> };
type Approval = { id: string; agentId: string; action: string; status: string; riskTier?: string };

export default function Page() {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, a, v] = await Promise.all([
          fetch("/api/v1/costs/summary").then((r) => r.json()),
          fetch("/api/v1/approvals").then((r) => r.json()),
          fetch("/api/v1/audit/verify").then((r) => r.json()),
        ]);
        setCosts(c.data as Costs);
        setApprovals((a.data?.approvals ?? []) as Approval[]);
        setVerified((v.data?.verified ?? null) as boolean | null);
      } catch { setError(true); }
    })();
  }, []);

  const pending = approvals?.filter((x) => x.status === "pending") ?? [];
  const loading = !error && (costs === null || approvals === null);

  return (
    <div>
      <PageHeader title="Overview" description="Spend, reliability, approvals pending, recent traces — live from your org's data."
        crumbs={[{ label: "Home", href: "/" }, { label: "Overview" }]}
        primary={{ label: "Register agent", href: "/onboarding" }}
        secondary={[{ label: "Verify audit", href: "/audit" }]} />

      {error && <div className="m3-card" role="alert"><p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load overview data. Check that the server is running and try again.</p></div>}
      {loading && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {!loading && !error && costs && approvals && (
        <>
          <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <StatCard label="Events" value={String(costs.events)} delta="All time, this org" />
            <StatCard label="Spend" value={`$${costs.totalCost.toFixed(2)}`} delta="All time, this org" />
            <StatCard label="Approvals pending" value={String(pending.length)} delta={pending.length > 0 ? "Needs a reviewer" : "Queue is clear"} tone={pending.length > 0 ? "warning" : "success"} />
            <StatCard label="Audit chain" value={verified ? "Verified" : "Check failed"} delta={verified ? "Hash chain intact" : "See Audit Log"} tone={verified ? "success" : "error"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            <ChartCard title="Spend by agent" state={Object.keys(costs.byAgent).length > 0 ? "data" : "empty"} emptyGuidance="Ingest events with cost data to see spend per agent.">
              <BarChart values={Object.entries(costs.byAgent).map(([label, value]) => ({ label, value }))} label="Spend by agent" />
            </ChartCard>
            <ChartCard title="Spend by model" state={Object.keys(costs.byModel).length > 0 ? "data" : "empty"} emptyGuidance="Ingest events with model + cost data to see spend per model.">
              <LineChart values={Object.values(costs.byModel)} label="Spend by model" />
            </ChartCard>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            <Card title="Top agents" subtitle="By spend (from the costs summary).">
              {Object.keys(costs.byAgent).length === 0
                ? <EmptyState icon="🤖" title="No agent spend yet" guidance="Register an agent and ingest costed events to see the leaderboard." actionLabel="Onboarding" actionHref="/onboarding" />
                : <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20 }}>{Object.entries(costs.byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, spend]) => (<li key={id}><Link href={`/agents/${id}`}>{id}</Link> — ${Number(spend).toFixed(2)}</li>))}</ul>}
            </Card>
            <Card title="Approval queue" subtitle="Pending approvals needing a decision.">
              {pending.length === 0
                ? <EmptyState icon="✓" title="Queue is clear" guidance="No pending approvals. New requests appear here with SLA countdowns." actionLabel="View all approvals" actionHref="/approvals" />
                : <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20 }}>{pending.slice(0, 5).map((a) => (<li key={a.id}><Link href={`/approvals/${a.id}`}>{a.action}</Link> — {a.agentId} <Chip tone={a.riskTier === "critical" ? "error" : "default"}>{a.riskTier ?? "low"}</Chip></li>))}</ul>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
