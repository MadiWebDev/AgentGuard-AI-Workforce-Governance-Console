"use client";
import { useState } from "react";
import { PageHeader, Card } from "@/components/m3";

export default function Page() {
  const [orgId, setOrgId] = useState("org_demo");
  const [cadence, setCadence] = useState("weekly");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function schedule() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/audits/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, cadence }) });
      const json = await res.json();
      setResult(json.error ? `Schedule failed: ${json.error.message}` : `Scheduled ${cadence} audit for ${orgId} — next run ${json.data?.schedule?.nextRunAt ?? ""}.`);
    } catch { setResult("Schedule failed — is the server running?"); }
    finally { setBusy(false); }
  }
  async function runDue() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/audits/run-due", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json = await res.json();
      setResult(json.error ? `Run failed: ${json.error.message}` : `Ran ${json.data?.ran?.length ?? 0} due schedule(s). Each run produces a signed evidence pack + delivery log.`);
    } catch { setResult("Run failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Scheduled Governance Audits" description="Recurring auto-audits per client org (weekly/monthly): run the real control tests, compile findings, generate a signed evidence pack, and deliver it (email + portal) on schedule with a delivery log entry."
        crumbs={[{ label: "Home", href: "/" }, { label: "Scheduled Audits" }]} />
      <Card title="Schedule an audit">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div><label className="m3-label" htmlFor="audit-org">Org ID</label><input id="audit-org" className="m3-input" value={orgId} onChange={(e) => setOrgId(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="audit-cadence">Cadence</label><select id="audit-cadence" className="m3-select" value={cadence} onChange={(e) => setCadence(e.target.value)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={schedule} disabled={busy}>{busy ? "Working…" : "Schedule audit"}</button>
          <button type="button" className="m3-btn m3-btn-outlined" onClick={runDue} disabled={busy}>Run due audits now</button>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
