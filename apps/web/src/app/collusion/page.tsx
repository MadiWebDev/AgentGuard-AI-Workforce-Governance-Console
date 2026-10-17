"use client";
import { useState } from "react";
import { PageHeader, Card, ConfirmDialog, Chip } from "@/components/m3";

export default function Page() {
  const [traces, setTraces] = useState(JSON.stringify([{ id: "t1", agentId: "agent-a", action: "read_secret" }, { id: "t2", agentId: "agent-b", action: "send_out" }], null, 2));
  const [autoQuarantine, setAutoQuarantine] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function detect() {
    setConfirmOpen(false);
    setBusy(true); setResult(null);
    try {
      const parsed = JSON.parse(traces) as unknown;
      const res = await fetch("/api/v1/collusion/detect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ traces: parsed, autoQuarantine }) });
      const json = await res.json();
      setResult(json.error ? `Detect failed: ${json.error.message}` : `${(json.data?.alerts ?? []).length} alert(s). Quarantined: ${JSON.stringify(json.data?.quarantinedAgentIds ?? [])}.`);
    } catch { setResult("Detect failed — check the traces JSON and that the server is running."); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Cross-Agent Collusion Detection" description="Graph analysis over traces detects bypass patterns split across agents: chunked exfiltration (A emits chunks, B reassembles) and split bypass (A reads a secret, B sends it out). Alerts carry the reconstructed chain. Auto-quarantine is opt-in per org."
        crumbs={[{ label: "Home", href: "/" }, { label: "Collusion" }]} />
      <Card title="Detect over traces" subtitle="Heuristic detective control — not a preventive guarantee. False-positive rate is measured on seeded normal traffic.">
        <label className="m3-label" htmlFor="col-traces">Traces (JSON array)</label>
        <textarea id="col-traces" className="m3-textarea mono" rows={6} value={traces} onChange={(e) => setTraces(e.target.value)} />
        <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }} className="m3-body-md">
          <input type="checkbox" checked={autoQuarantine} onChange={(e) => setAutoQuarantine(e.target.checked)} style={{ minWidth: 24, minHeight: 24 }} />
          Opt-in auto-quarantine (asks for confirmation)
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={() => { if (autoQuarantine) setConfirmOpen(true); else detect(); }} disabled={busy}>{busy ? "Detecting…" : "Run detection"}</button>
          <Chip>Reconstructed chains in alerts</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
      <ConfirmDialog open={confirmOpen} title="Enable auto-quarantine for this run?"
        body="Auto-quarantine will quarantine agents named by detection alerts. This is an opt-in destructive action."
        confirmLabel="Run with auto-quarantine" danger onCancel={() => setConfirmOpen(false)} onConfirm={detect} />
    </div>
  );
}
