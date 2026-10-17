"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setResult(null);
    try {
      const decisions = Array.from({ length: 6 }, (_, i) => ({ id: `d${i}`, action: "deploy", decision: "approved", agentId: "agent-1" }));
      const res = await fetch("/api/v1/autopilot/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decisions, driftFindings: [] }) });
      const json = await res.json();
      setResult(json.error ? `Run failed: ${json.error.message}` : `${(json.data?.proposals ?? []).length} proposal(s): ${JSON.stringify(json.data?.proposals ?? json.data, null, 2)}`);
    } catch { setResult("Run failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Policy Autopilot" description="Nightly job learns from approval decisions and drift findings and proposes policy changes as drafts with evidence (“37 similar actions were all approved”). Loosening a deny-class rule requires two-person approval. Autopilot NEVER auto-activates anything."
        crumbs={[{ label: "Home", href: "/" }, { label: "Autopilot" }]} />
      <Card title="Run autopilot (demo decisions)" subtitle="Proposals are drafts with evidence counts; activation is a separate audited action.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={run} disabled={busy}>{busy ? "Running…" : "Run autopilot"}</button>
          <Chip tone="primary">Never auto-activates</Chip>
          <Chip>Two-person to loosen deny rules</Chip>
        </div>
        {result && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{result}</pre>}
      </Card>
    </div>
  );
}
