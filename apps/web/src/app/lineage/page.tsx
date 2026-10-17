"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/m3";

export default function Page() {
  const [oldV, setOldV] = useState(JSON.stringify({ modelVersion: "gpt-4.1", promptTemplateVersion: "v3", toolVersions: { search: "1.0" }, policyVersion: "p1", sdkVersion: "1.0.0" }, null, 2));
  const [newV, setNewV] = useState(JSON.stringify({ modelVersion: "gpt-4.2", promptTemplateVersion: "v3", toolVersions: { search: "1.1" }, policyVersion: "p1", sdkVersion: "1.0.0" }, null, 2));
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function diff() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/lineage/diff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ old: JSON.parse(oldV) as unknown, new: JSON.parse(newV) as unknown }) });
      const json = await res.json();
      setResult(json.error ? `Diff failed: ${json.error.message}` : JSON.stringify(json.data ?? json, null, 2));
    } catch { setResult("Diff failed — check the JSON and that the server is running."); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Full Lineage Tracking" description="Every trace records model version, prompt template version, tool versions, policy version, and SDK version. The trace view shows a 'what changed' diff when behavior shifts after a version change, and lineage is included in evidence packs."
        crumbs={[{ label: "Home", href: "/" }, { label: "Lineage" }]} />
      <Card title="What changed?" subtitle="Compare two lineage snapshots to see exactly what changed.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          <div><label className="m3-label" htmlFor="lin-old">Old lineage (JSON)</label><textarea id="lin-old" className="m3-textarea mono" rows={7} value={oldV} onChange={(e) => setOldV(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="lin-new">New lineage (JSON)</label><textarea id="lin-new" className="m3-textarea mono" rows={7} value={newV} onChange={(e) => setNewV(e.target.value)} /></div>
        </div>
        <button type="button" className="m3-btn m3-btn-filled" style={{ marginTop: 16 }} onClick={diff} disabled={busy}>{busy ? "Diffing…" : "Compute diff"}</button>
        {result && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{result}</pre>}
      </Card>
    </div>
  );
}
