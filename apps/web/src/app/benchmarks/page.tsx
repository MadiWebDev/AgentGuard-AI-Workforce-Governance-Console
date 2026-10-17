"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/benchmarks/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgs: [{ id: "org-a", optedIn: true, spendPer1k: 12, approvalRate: 0.9, incidentRate: 0.01 }, { id: "org-b", optedIn: true, spendPer1k: 18, approvalRate: 0.85, incidentRate: 0.02 }] }),
      });
      const json = await res.json();
      setResult(json.error ? `Publish failed: ${json.error.message}` : `Aggregates published. Epsilon spent: ${json.data?.epsilonSpent ?? "?"}, budget after: ${JSON.stringify(json.data?.budgetAfter ?? json.data)}`);
    } catch { setResult("Publish failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Private Peer Benchmarking" description="Opt-in only. Anonymized aggregates (spend per 1k events, approval rate, incident rate) with differential privacy: epsilon budget 1.0 per release window, per-query spend tracked, rejection on exhaustion. Orgs see percentile bands vs similar-size peers; no org is identifiable — outputs are bucket-level only."
        crumbs={[{ label: "Home", href: "/" }, { label: "Benchmarks" }]} />
      <Card title="Publish opt-in aggregates (demo orgs)" subtitle="Budget exhaustion returns 429 DP_BUDGET_EXHAUSTED. Choose epsilon with privacy counsel — do not raise it without review.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Publish aggregates"}</button>
          <Chip>Epsilon budget 1.0 / window</Chip>
          <Chip>0.25 / query</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
