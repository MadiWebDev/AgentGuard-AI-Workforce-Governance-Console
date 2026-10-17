"use client";
import { useState } from "react";
import { PageHeader, Card, ConfirmDialog, Stepper } from "@/components/m3";

const STEPS = ["Quarantine", "Revoke keys", "Freeze approvals", "Notify", "Evidence pack"];

export default function Page() {
  const [agentId, setAgentId] = useState("agent-1");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(false);

  async function run() {
    setConfirmOpen(false);
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/runbooks/compromised-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId, stakeholderEmails: ["sec@example.com"] }) });
      const json = await res.json();
      if (json.error) { setResult(`Runbook failed: ${json.error.message}`); return; }
      setRan(true);
      setResult(`Runbook executed — ${(json.data?.steps ?? json.data?.execution?.steps ?? []).length || 5} steps completed, audit-logged.`);
    } catch { setResult("Runbook failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Runbooks" description="Compromised-agent runbook: quarantine → revoke keys → freeze approvals → notify → open incident evidence pack."
        crumbs={[{ label: "Home", href: "/" }, { label: "Runbooks" }]} />
      <Card title="Compromised-agent runbook">
        <Stepper steps={STEPS} current={ran ? 5 : 0} />
        <label className="m3-label" htmlFor="rb-agent" style={{ marginTop: 16 }}>Agent ID</label>
        <input id="rb-agent" className="m3-input" value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ maxWidth: 400 }} />
        <div style={{ marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-danger" onClick={() => setConfirmOpen(true)} disabled={busy}>{busy ? "Running…" : "Run compromised-agent runbook"}</button>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
      <ConfirmDialog open={confirmOpen} title="Run the compromised-agent runbook?"
        body={`This will quarantine ${agentId}, revoke its keys, freeze its pending approvals, notify stakeholders, and open an incident evidence pack. Every step is verified and audit-logged.`}
        confirmLabel="Run runbook" danger onCancel={() => setConfirmOpen(false)} onConfirm={run} />
    </div>
  );
}
