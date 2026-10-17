"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/m3";

export default function Page() {
  const [kind, setKind] = useState("events");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/warehouse/sync", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, rows: [{ idempotencyKey: `demo-${Date.now()}`, orgId: "org_demo", payload: { demo: true } }] }),
      });
      const json = await res.json();
      setResult(json.error ? `Sync failed: ${json.error.message}` : `Synced — written ${json.data?.written ?? "?"}, duplicates ${json.data?.duplicates ?? "?"} (exactly-once).`);
    } catch { setResult("Sync failed — is the server running?"); }
    finally { setBusy(false); }
  }
  async function backfill() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/warehouse/backfill", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: { events: [{ idempotencyKey: `bf-${Date.now()}` }], audit: [], costs: [] } }),
      });
      const json = await res.json();
      setResult(json.error ? `Backfill failed: ${json.error.message}` : `Backfill — total ${json.data?.progress?.total}, written ${json.data?.progress?.written}, ${json.data?.progress?.percent}%.`);
    } catch { setResult("Backfill failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Warehouse Sync" description="Continuous sync of events, audit rows, and cost rollups to customer warehouses (BigQuery, Snowflake, Postgres) via the WarehouseSink interface. Schema is documented in docs/WAREHOUSE_SCHEMA.md. Historical backfill reports progress and is exactly-once via idempotency keys."
        crumbs={[{ label: "Home", href: "/" }, { label: "Warehouse" }]} />
      <Card title="Sync a demo row" subtitle="Sends one demo row through the real sync path (dev/test uses the in-memory sink; production requires WAREHOUSE_DATABASE_URL).">
        <label className="m3-label" htmlFor="wh-kind">Kind</label>
        <select id="wh-kind" className="m3-select" value={kind} onChange={(e) => setKind(e.target.value)} style={{ maxWidth: 320 }}><option value="events">events</option><option value="audit">audit</option><option value="costs">costs</option></select>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={sync} disabled={busy}>{busy ? "Working…" : "Sync demo row"}</button>
          <button type="button" className="m3-btn m3-btn-outlined" onClick={backfill} disabled={busy}>Run backfill</button>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
