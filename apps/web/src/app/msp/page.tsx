"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Chip, EmptyState, SkeletonCard } from "@/components/m3";

type Client = { orgId: string; healthScore: number; alerts: number; incidents: number; compliance: number };

export default function Page() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/msp/clients").then((r) => r.json());
        setClients((res.data?.clients ?? []) as Client[]);
      } catch { setError(true); }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="MSP Multi-Org Console" description="Agencies manage many client orgs from one pane: cross-org alert rollup, per-client health scores recomputed nightly, per-client usage and billing summary, and delegated admins with scoped permissions per client. A client admin sees only their own org — enforced in the accessor, not just the UI."
        crumbs={[{ label: "Home", href: "/" }, { label: "MSP" }]}
        primary={{ label: "Client billing", href: "/billing/clients" }} />
      {error && <div className="m3-card" role="alert"><p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load clients.</p></div>}
      {!error && clients === null && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}><SkeletonCard /><SkeletonCard /></div>}
      {!error && clients !== null && clients.length === 0 && (
        <Card title="Clients"><EmptyState icon="🏢" title="No client orgs yet" guidance="Client orgs appear here once they exist in the registry. MSP admins see all assigned clients; client admins see only their own org." actionLabel="Onboarding" actionHref="/onboarding" /></Card>
      )}
      {!error && clients !== null && clients.length > 0 && (
        <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {clients.map((c) => (
            <div key={c.orgId} className="m3-card">
              <h2 className="m3-title-lg" style={{ margin: 0 }}>{c.orgId}</h2>
              <p className="m3-headline-sm" style={{ margin: "8px 0 0" }}>Health {c.healthScore}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <Chip tone={c.alerts > 0 ? "warning" : "success"}>{c.alerts} alerts</Chip>
                <Chip tone={c.incidents > 0 ? "error" : "success"}>{c.incidents} incidents</Chip>
                <Chip>Compliance {Math.round(c.compliance * 100)}%</Chip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
