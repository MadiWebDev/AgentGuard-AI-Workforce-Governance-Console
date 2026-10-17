"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [from, setFrom] = useState("agent-a");
  const [to, setTo] = useState("agent-b");
  const [payload, setPayload] = useState("Hello — here is the summary.");
  const [action, setAction] = useState("allow");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/a2a/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traceId: `tr-a2a-${Date.now()}`, fromAgent: from, toAgent: to, payload, costUsd: 0.02, policy: { fromAgent: from, toAgent: to, action, contentGuards: [] } }),
      });
      const json = await res.json();
      setResult(json.error ? `Send failed: ${json.error.message}` : `Delivered: ${json.data?.delivered ? "yes" : "no"} — matched rule: ${json.data?.check?.matchedRule ?? "—"}. Audit record links the full trace.`);
    } catch { setResult("Send failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Agent-to-Agent Governance" description="Per-pair allow / deny / require-approval policies gate inter-agent messages. Content guards scan payloads; costs are attributed across the chain in integer cents so the split sums exactly to the total; every delivery gets an audit record linking the full multi-agent trace."
        crumbs={[{ label: "Home", href: "/" }, { label: "A2A" }]} />
      <Card title="Send a governed message" subtitle="Try the pair policy live — denied pairs cannot exchange messages.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div><label className="m3-label" htmlFor="a2a-from">From agent</label><input id="a2a-from" className="m3-input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="a2a-to">To agent</label><input id="a2a-to" className="m3-input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="a2a-action">Pair policy</label><select id="a2a-action" className="m3-select" value={action} onChange={(e) => setAction(e.target.value)}><option value="allow">allow</option><option value="deny">deny</option><option value="require_approval">require_approval</option></select></div>
        </div>
        <label className="m3-label" htmlFor="a2a-payload" style={{ marginTop: 12 }}>Payload</label>
        <textarea id="a2a-payload" className="m3-textarea" rows={3} value={payload} onChange={(e) => setPayload(e.target.value)} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send message"}</button>
          <Chip>Cost attributed in integer cents</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
