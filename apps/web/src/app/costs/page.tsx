"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, StatCard, ProgressRing, EmptyState, SkeletonCard } from "@/components/m3";
import { ChartCard, BarChart } from "@/components/charts";

type Costs = { totalCost: number; events: number; byAgent: Record<string, number>; byModel: Record<string, number> };

export default function Page() {
  const [costs, setCosts] = useState<Costs | null>(null);
  const [error, setError] = useState(false);
  const [acked, setAcked] = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/costs/summary").then((r) => r.json());
        setCosts(res.data as Costs);
      } catch { setError(true); }
    })();
  }, []);

  const budget = 1000; // demo budget cap for the progress ring — real budgets come from plan limits in production.
  const usedPct = costs ? Math.min(100, (costs.totalCost / budget) * 100) : 0;

  return (
    <div>
      <PageHeader title="Costs" description="Spend by agent/model/provider/day, budgets, alerts, anomaly detection."
        crumbs={[{ label: "Home", href: "/" }, { label: "Costs" }]} />
      {error && <div className="m3-card" role="alert"><p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load costs.</p></div>}
      {!error && costs === null && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {!error && costs && (
        <>
          <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            <StatCard label="Total spend" value={`$${costs.totalCost.toFixed(2)}`} delta="All time, this org" />
            <StatCard label="Events" value={String(costs.events)} delta="Costed events" />
            <StatCard label="Agents with spend" value={String(Object.keys(costs.byAgent).length)} delta="From the summary" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            <ChartCard title="Spend by agent" state={Object.keys(costs.byAgent).length > 0 ? "data" : "empty"} emptyGuidance="Ingest costed events to see spend per agent.">
              <BarChart values={Object.entries(costs.byAgent).map(([label, value]) => ({ label, value }))} label="Spend by agent" />
            </ChartCard>
            <ChartCard title="Spend by model" state={Object.keys(costs.byModel).length > 0 ? "data" : "empty"} emptyGuidance="Ingest events with model + cost data.">
              <BarChart values={Object.entries(costs.byModel).map(([label, value]) => ({ label, value }))} label="Spend by model" />
            </ChartCard>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 16 }}>
            <Card title="Budget" subtitle="Demo budget cap of $1,000 — real budgets come from plan limits in production.">
              <ProgressRing percent={Math.round(usedPct)} label={`$${costs.totalCost.toFixed(2)} of $1,000`} />
            </Card>
            <Card title="Alerts" subtitle="Acknowledge or snooze cost alerts. Anomaly annotations appear on the charts when spend spikes.">
              {Object.keys(costs.byAgent).length === 0
                ? <EmptyState icon="🔔" title="No cost alerts" guidance="No spend anomalies detected. Alerts appear here when spend spikes or a budget threshold is crossed." />
                : <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20 }}>
                    {Object.entries(costs.byAgent).map(([id, spend]) => (
                      <li key={id} style={{ marginBottom: 8 }}>
                        {id}: ${Number(spend).toFixed(2)}
                        {acked.has(id) ? " — acknowledged" : snoozed.has(id) ? " — snoozed" : ""}
                        {!acked.has(id) && !snoozed.has(id) && (
                          <span style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
                            <button type="button" className="m3-btn m3-btn-outlined m3-btn-sm" onClick={() => setAcked((p) => new Set(p).add(id))}>Acknowledge</button>
                            <button type="button" className="m3-btn m3-btn-text m3-btn-sm" onClick={() => setSnoozed((p) => new Set(p).add(id))}>Snooze</button>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
