"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [agentId, setAgentId] = useState("agent-1");
  const [orgId, setOrgId] = useState("org-seller");
  const [name, setName] = useState("Support Bot");
  const [incidents, setIncidents] = useState(0);
  const [violations, setViolations] = useState(0);
  const [compliance, setCompliance] = useState(1);
  const [uptime, setUptime] = useState(1);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/marketplace/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: { id: agentId, orgId, name, version: "1.0.0" }, history: { incidents, violations, approvalCompliance: compliance, uptime, totalActions: 100, chainVerified: true } }),
      });
      const json = await res.json();
      setResult(json.error ? `Publish refused: ${json.error.message}` : `Listed! Trust score ${json.data?.listing?.trustScore ?? "?"} — ${JSON.stringify(json.data?.listing ?? json.data)}`);
    } catch { setResult("Publish failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Agent Marketplace" description="Orgs publish agents with trust scores computed only from governance history (incidents, violations, approval compliance, uptime) — never self-reported. Publishing requires score ≥ 60; score ≥ 80 + verified chain earns the verified-governance badge."
        crumbs={[{ label: "Home", href: "/" }, { label: "Marketplace" }]} />
      <div style={{ display: "grid", gap: 16 }}>
        <Card title="How trust scores work" subtitle="Score = approvalCompliance × 40 + uptime × 30 + 30 − incident/violation penalties, clamped 0–100.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip tone="primary">Publish ≥ 60</Chip>
            <Chip tone="success">Verified badge ≥ 80 + verified chain</Chip>
            <Chip>Stale after 24h without a scoring run</Chip>
          </div>
        </Card>
        <Card title="Publish an agent" subtitle="Enter governance history — the score is computed from these numbers, never from self-reported claims.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <div><label className="m3-label" htmlFor="mp-agent">Agent ID</label><input id="mp-agent" className="m3-input" value={agentId} onChange={(e) => setAgentId(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="mp-org">Seller org</label><input id="mp-org" className="m3-input" value={orgId} onChange={(e) => setOrgId(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="mp-name">Agent name</label><input id="mp-name" className="m3-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="mp-inc">Incidents</label><input id="mp-inc" className="m3-input" type="number" min={0} value={incidents} onChange={(e) => setIncidents(Number(e.target.value))} /></div>
            <div><label className="m3-label" htmlFor="mp-vio">Violations</label><input id="mp-vio" className="m3-input" type="number" min={0} value={violations} onChange={(e) => setViolations(Number(e.target.value))} /></div>
            <div><label className="m3-label" htmlFor="mp-comp">Approval compliance (0–1)</label><input id="mp-comp" className="m3-input" type="number" min={0} max={1} step={0.01} value={compliance} onChange={(e) => setCompliance(Number(e.target.value))} /></div>
            <div><label className="m3-label" htmlFor="mp-up">Uptime (0–1)</label><input id="mp-up" className="m3-input" type="number" min={0} max={1} step={0.01} value={uptime} onChange={(e) => setUptime(Number(e.target.value))} /></div>
          </div>
          <button type="button" className="m3-btn m3-btn-filled" style={{ marginTop: 16 }} onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</button>
          {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
        </Card>
        <Card title="Buy — govern this agent" subtitle="One-click 'govern this agent' creates a governed registry entry in the buyer org (POST /api/v1/marketplace/buy with the listing + buyerOrgId). Buyer onboarding is audit-logged.">
          <p className="m3-body-md" style={{ margin: 0 }}>Buying requires a published listing; the trust score at onboarding is preserved for the buyer&apos;s records.</p>
        </Card>
      </div>
    </div>
  );
}
