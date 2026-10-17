"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState, SkeletonCard, ConfirmDialog } from "@/components/m3";
import { Sparkline } from "@/components/m3";

type Agent = { id: string; name: string; environment?: string; riskTier?: string; status?: string };

export default function Page() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<Agent | null>(null);
  const [confirmAction, setConfirmAction] = useState<"pause" | "quarantine">("pause");
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/v1/agents").then((r) => r.json());
      setAgents((res.data?.agents ?? []) as Agent[]);
    } catch { setError(true); }
  }
  useEffect(() => { load(); }, []);

  async function killSwitch(agent: Agent, action: "pause" | "quarantine") {
    try {
      const res = await fetch(`/api/v1/agents/${agent.id}/${action}`, { method: "POST" });
      const json = await res.json();
      setNotice(json.error ? `${action} failed: ${json.error.message}` : `${agent.name} ${action}d.`);
      setConfirm(null);
      load();
    } catch { setNotice(`${action} failed — network error.`); setConfirm(null); }
  }

  return (
    <div>
      <PageHeader title="Agents" description="Register agents, manage keys, kill switch (pause / quarantine)."
        crumbs={[{ label: "Home", href: "/" }, { label: "Agents" }]}
        primary={{ label: "Register agent", href: "/onboarding" }} />
      {notice && <div className="m3-card" role="status" style={{ marginBottom: 16 }}><p className="m3-body-md" style={{ margin: 0 }}>{notice}</p></div>}
      {error && <div className="m3-card" role="alert"><p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load agents.</p></div>}
      {!error && agents === null && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>}
      {!error && agents !== null && agents.length === 0 && (
        <Card title="Agents"><EmptyState icon="🤖" title="No agents yet" guidance="Register your first agent to start governing it — mint a scoped key, then ingest events." actionLabel="Onboarding" actionHref="/onboarding" /></Card>
      )}
      {!error && agents !== null && agents.length > 0 && (
        <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {agents.map((a) => (
            <div key={a.id} className="m3-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <h2 className="m3-title-lg" style={{ margin: 0 }}><Link href={`/agents/${a.id}`}>{a.name}</Link></h2>
                <Chip tone={a.status === "quarantined" ? "error" : a.status === "paused" ? "warning" : "success"}>{a.status ?? "active"}</Chip>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <Chip tone="primary">{a.riskTier ?? "low"} risk</Chip>
                <Chip>{a.environment ?? "dev"}</Chip>
              </div>
              <div style={{ marginTop: 12 }}><Sparkline values={[]} label={`Trust sparkline for ${a.name}`} /></div>
              <p className="m3-body-sm mono" style={{ color: "var(--m3-on-surface-variant)", overflowWrap: "anywhere" }}>{a.id}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <button type="button" className="m3-btn m3-btn-outlined m3-btn-sm" onClick={() => { setConfirm(a); setConfirmAction("pause"); }}>Pause</button>
                <button type="button" className="m3-btn m3-btn-danger m3-btn-sm" onClick={() => { setConfirm(a); setConfirmAction("quarantine"); }}>Quarantine</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={confirm !== null} title={confirmAction === "pause" ? "Pause agent?" : "Quarantine agent?"}
        body={confirm ? `${confirmAction === "pause" ? "Pausing" : "Quarantining"} ${confirm.name} denies its actions immediately. You can reverse this from the agent detail page.` : ""}
        confirmLabel={confirmAction === "pause" ? "Pause" : "Quarantine"} danger={confirmAction === "quarantine"}
        onCancel={() => setConfirm(null)} onConfirm={() => { if (confirm) killSwitch(confirm, confirmAction); }} />
    </div>
  );
}
