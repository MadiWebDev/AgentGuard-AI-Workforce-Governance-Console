"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Chip, EmptyState, Dialog } from "@/components/m3";

type Verify = { verified: boolean; firstBrokenId: string | null; checkedAt: string; rows: number };

export default function Page() {
  const [verify, setVerify] = useState<Verify | null>(null);
  const [error, setError] = useState(false);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/audit/verify").then((r) => r.json());
        setVerify(res.data as Verify);
      } catch { setError(true); }
    })();
  }, []);

  async function exportAudit() {
    try {
      const res = await fetch("/api/v1/audit/export", { method: "POST" });
      const json = await res.json();
      setExportResult(json.error ? `Export failed: ${json.error.message}` : "Evidence export generated — see the signed manifest in the response (audit-logged).");
    } catch { setExportResult("Export failed — network error."); }
  }

  return (
    <div>
      <PageHeader title="Audit Log" description="Append-only hash chain. Verification shows 'chain verified at [time]' or the first broken row."
        crumbs={[{ label: "Home", href: "/" }, { label: "Audit Log" }]}
        primary={{ label: "Export evidence", href: "/audit" }} />
      <Card title="Chain verification">
        {error && <p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not verify the chain.</p>}
        {!error && verify === null && <p className="m3-body-md">Verifying…</p>}
        {verify && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Chip tone={verify.verified ? "success" : "error"}>{verify.verified ? `✓ Verified at ${new Date(verify.checkedAt).toLocaleString()}` : "✗ Chain broken"}</Chip>
            <span className="m3-body-md">{verify.rows} rows checked</span>
            {verify.firstBrokenId && <span className="m3-body-md" style={{ color: "var(--m3-error)" }}>First broken row: <span className="mono">{verify.firstBrokenId}</span></span>}
          </div>
        )}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 16 }}>
        <Card title="Filters" subtitle="Filter by actor / action.">
          <label className="m3-label" htmlFor="audit-actor">Actor</label>
          <input id="audit-actor" className="m3-input" placeholder="user id / agent id" value={actor} onChange={(e) => setActor(e.target.value)} />
          <label className="m3-label" htmlFor="audit-action" style={{ marginTop: 12 }}>Action</label>
          <input id="audit-action" className="m3-input" placeholder="e.g. approval.approved" value={action} onChange={(e) => setAction(e.target.value)} />
          <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 8 }}>Filtering is client-side over the exported rows — export below to inspect the full log.</p>
        </Card>
        <Card title="Checkpoint timeline" subtitle="Checkpoints anchor the chain for faster verification.">
          <p className="m3-body-md" style={{ margin: 0 }}>Checkpoints are created when the store checkpoints the chain root. Verification re-checks rows from the latest checkpoint forward.</p>
        </Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Audit rows">
          <EmptyState icon="🔗" title="Use export to inspect rows" guidance="This page verifies the chain and exports the log. Use the export dialog to download the signed audit rows (JSON + CSV + manifest)." actionLabel="Open export dialog" actionHref="/audit" />
          <div style={{ textAlign: "center" }}><button type="button" className="m3-btn m3-btn-filled" onClick={() => setExportOpen(true)}>Export audit log</button></div>
        </Card>
      </div>
      <Dialog open={exportOpen} title="Export audit log" onClose={() => setExportOpen(false)}
        actions={<><button type="button" className="m3-btn m3-btn-text" onClick={() => setExportOpen(false)}>Close</button><button type="button" className="m3-btn m3-btn-filled" onClick={exportAudit}>Generate export</button></>}>
        <p className="m3-body-md">Export generates audit.json + audit.csv plus an Ed25519-signed manifest. The export itself is audit-logged.</p>
        {exportResult && <p className="m3-body-md" role="status">{exportResult}</p>}
      </Dialog>
    </div>
  );
}
