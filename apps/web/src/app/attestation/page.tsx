"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [agentId, setAgentId] = useState("agent-1");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function issue() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/attestation/issue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId, workload: "worker-1", tier: "high" }) });
      const json = await res.json();
      if (json.error) { setResult(`Issue failed: ${json.error.message}`); return; }
      setToken(JSON.stringify(json.data ?? json));
      setResult("Token issued (short-lived, workload-bound). Paste it into Verify below.");
    } catch { setResult("Issue failed — is the server running?"); }
    finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/attestation/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token || "invalid" }) });
      const json = await res.json();
      setResult(json.error ? `Verify failed: ${json.error.message}` : `Verify result: ${JSON.stringify(json.data ?? json)}`);
    } catch { setResult("Verify failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Agent Identity Attestation" description="High/critical tiers require a short-lived attested token bound to workload identity in addition to the API key. Production uses SPIFFE/SPIRE (SPIRE_AGENT_ADDRESS); the mock issuer is test-only and rejected in production."
        crumbs={[{ label: "Home", href: "/" }, { label: "Attestation" }]} />
      <Card title="Issue + verify" subtitle="Stolen-key replay without attestation is denied + audit-logged.">
        <label className="m3-label" htmlFor="att-agent">Agent ID</label>
        <input id="att-agent" className="m3-input" value={agentId} onChange={(e) => setAgentId(e.target.value)} style={{ maxWidth: 400 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={issue} disabled={busy}>{busy ? "Working…" : "Issue token"}</button>
          <button type="button" className="m3-btn m3-btn-outlined" onClick={verify} disabled={busy}>Verify token</button>
          <Chip>Short-lived · workload-bound</Chip>
        </div>
        {token && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{token}</pre>}
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
