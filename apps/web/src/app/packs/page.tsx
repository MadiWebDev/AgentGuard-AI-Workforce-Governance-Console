"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

const PACKS: [string, string, string][] = [
  ["eu-ai-act", "EU AI Act oversight", "Oversight, logging, and human-review rules for the EU AI Act."],
  ["soc2", "SOC 2 baseline", "Baseline controls for SOC 2 evidence."],
  ["finance-dlp", "Finance DLP", "Data-loss-prevention rules for financial data."],
  ["support-qa", "Support QA starter", "Quality gates for support agent outputs."],
];

export default function Page() {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function install(packId: string) {
    setBusy(packId); setResult(null);
    try {
      const res = await fetch("/api/v1/packs/install", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packId }) });
      const json = await res.json();
      setResult(json.error ? `Install failed: ${json.error.message}` : `Pack ${packId} installed as DRAFT policies + simulation. Activation is a separate audited action.`);
    } catch { setResult("Install failed — is the server running?"); }
    finally { setBusy(null); }
  }

  return (
    <div>
      <PageHeader title="Policy Packs" description="Prebuilt versioned packs: EU AI Act oversight, SOC 2 baseline, finance DLP, support QA starter. Install creates DRAFT policies + simulation; activation is a separate audited action."
        crumbs={[{ label: "Home", href: "/" }, { label: "Policy Packs" }]} />
      <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {PACKS.map(([id, name, desc]) => (
          <div key={id} className="m3-card">
            <h2 className="m3-title-lg" style={{ margin: "0 0 4px" }}>{name}</h2>
            <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: "0 0 12px" }}>{desc}</p>
            <Chip>Draft-only install</Chip>
            <div style={{ marginTop: 12 }}><button type="button" className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => install(id)} disabled={busy !== null}>{busy === id ? "Installing…" : "Install pack"}</button></div>
          </div>
        ))}
      </div>
      {result && <div className="m3-card" style={{ marginTop: 16 }} role="status"><p className="m3-body-md" style={{ margin: 0 }}>{result}</p></div>}
    </div>
  );
}
