"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [mode, setMode] = useState("strict");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/redteam/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const json = await res.json();
      setResult(json.error ? `Run failed: ${json.error.message}` : `Score ${json.data?.score ?? "?"} — ${(json.data?.findings ?? []).length} finding(s). Findings produce DRAFT policies only.`);
    } catch { setResult("Run failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Red Team" description="Attack library: prompt injection, jailbreak, PII exfiltration, tool misuse, cost-burn loops. Findings produce DRAFT policies only — never auto-activated."
        crumbs={[{ label: "Home", href: "/" }, { label: "Red Team" }]} />
      <Card title="Run the attack library" subtitle="Scored report + one-click draft policy from each finding.">
        <label className="m3-label" htmlFor="rt-mode">Mode</label>
        <select id="rt-mode" className="m3-select" value={mode} onChange={(e) => setMode(e.target.value)} style={{ maxWidth: 320 }}>
          <option value="strict">strict</option>
          <option value="permissive">permissive</option>
        </select>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={run} disabled={busy}>{busy ? "Running…" : "Run red team"}</button>
          <Chip tone="primary">Draft-only findings</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
