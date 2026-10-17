"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/m3";

export default function Page() {
  const [approvalId, setApprovalId] = useState("appr-demo-1");
  const [incidentId, setIncidentId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/oncall/incidents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approval: { id: approvalId, orgId: "org_demo", agentId: "agent-1", action: "deploy", riskTier: "high", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), slaMinutes: 30 }, approverId: "oncall-approver" }),
      });
      const json = await res.json();
      if (json.error) { setResult(`Incident failed: ${json.error.message}`); return; }
      setIncidentId(json.data?.incident?.id ?? "");
      setResult(`Incident ${json.data?.incident?.id} created (status ${json.data?.incident?.status}). In production this pages the on-call approver via PagerDuty/Opsgenie.`);
    } catch { setResult("Incident failed — is the server running?"); }
    finally { setBusy(false); }
  }
  async function resolve(decision: "approved" | "denied") {
    if (!incidentId) { setResult("Create an incident first."); return; }
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/oncall/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incidentId, decision }) });
      const json = await res.json();
      setResult(json.error ? `Resolve failed: ${json.error.message}` : `Incident ${incidentId} resolved by ${decision} decision. Round trip audit-logged.`);
    } catch { setResult("Resolve failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="On-Call Integrations" description="PagerDuty / Opsgenie for approval escalations and incident runbooks: SLA-breaching approvals create an incident and page the on-call approver; the approver's decision resolves it. The full round trip is audit-logged."
        crumbs={[{ label: "Home", href: "/" }, { label: "On-call" }]} />
      <Card title="Simulate an SLA breach → incident → resolve" subtitle="Uses the real on-call API. In dev/test the mock provider is used; production requires PagerDuty/Opsgenie keys.">
        <label className="m3-label" htmlFor="oc-approval">Approval ID (2h old, 30-min SLA → breached)</label>
        <input id="oc-approval" className="m3-input" value={approvalId} onChange={(e) => setApprovalId(e.target.value)} style={{ maxWidth: 400 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={create} disabled={busy}>{busy ? "Working…" : "Create incident"}</button>
          <button type="button" className="m3-btn m3-btn-outlined" onClick={() => resolve("approved")} disabled={busy || !incidentId}>Resolve: approved</button>
          <button type="button" className="m3-btn m3-btn-danger" onClick={() => resolve("denied")} disabled={busy || !incidentId}>Resolve: denied</button>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
