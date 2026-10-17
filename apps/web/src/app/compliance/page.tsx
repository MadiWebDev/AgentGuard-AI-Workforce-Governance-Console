"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Chip, ProgressRing } from "@/components/m3";

type Controls = { controls?: { id: string; name: string; pass: boolean }[]; passRate?: number; history?: unknown[] };

export default function Page() {
  const [data, setData] = useState<Controls | null>(null);
  const [error, setError] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/v1/compliance/controls").then((r) => r.json());
      setData((res.data ?? {}) as Controls);
    } catch { setError(true); }
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setBusy(true); setRunResult(null);
    try {
      const res = await fetch("/api/v1/compliance/run", { method: "POST" });
      const json = await res.json();
      setRunResult(json.error ? `Run failed: ${json.error.message}` : "Control tests executed — reloading history.");
      load();
    } catch { setRunResult("Run failed — is the server running?"); }
    finally { setBusy(false); }
  }

  const controls = data?.controls ?? [];
  const passRate = data?.passRate ?? (controls.length > 0 ? Math.round((controls.filter((c) => c.pass).length / controls.length) * 100) : null);

  return (
    <div>
      <PageHeader title="Continuous Compliance Monitoring" description="Scheduled control tests run the controls themselves: kill-switch propagation, chain verification, checkpoint backup, redaction nowhere-leak probe. Results feed this auditor dashboard with pass/fail history and auto-collected evidence artifacts."
        crumbs={[{ label: "Home", href: "/" }, { label: "Compliance" }]}
        primary={{ label: "Run control tests", href: "/compliance" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        <Card title="Pass rate (30-day history)">
          {error && <p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load control history.</p>}
          {!error && passRate === null && <p className="m3-body-md">Loading…</p>}
          {passRate !== null && <ProgressRing percent={passRate} label={`${passRate}% controls passing`} />}
          <button type="button" className="m3-btn m3-btn-filled" style={{ marginTop: 16 }} onClick={run} disabled={busy}>{busy ? "Running…" : "Run control tests"}</button>
          {runResult && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{runResult}</p>}
        </Card>
        <Card title="Controls">
          {controls.length === 0
            ? <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: 0 }}>No control history yet — run the control tests to populate this dashboard.</p>
            : <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20 }}>{controls.map((c) => (<li key={c.id}>{c.name} — <Chip tone={c.pass ? "success" : "error"}>{c.pass ? "pass" : "fail"}</Chip></li>))}</ul>}
        </Card>
      </div>
    </div>
  );
}
