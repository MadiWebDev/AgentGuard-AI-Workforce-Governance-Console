"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function anchor() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/anchoring/anchor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manifest: { files: [{ name: "audit.json", sha256: "demo" }], packId: `pack-demo-${Date.now()}` } }) });
      const json = await res.json();
      setResult(json.error ? `Anchor failed: ${json.error.message}` : `Anchored — status ${json.data?.status ?? "?"}: ${JSON.stringify(json.data?.proof ?? json.data)}`);
    } catch { setResult("Anchor failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Public-Chain Anchoring" description="Daily Merkle roots anchor via OpenTimestamps (and optionally a configured EVM chain) in addition to R2. The verify page shows the full chain: row → Merkle root → timestamp proof → (optional) chain tx. Local proofs are Ed25519-signed and verify offline from the pack alone."
        crumbs={[{ label: "Home", href: "/" }, { label: "Anchoring" }]} />
      <Card title="Anchor a pack" subtitle="Configure OTS_CALENDAR_URL / EVM_RPC_URL for real anchoring; see RUNBOOK.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={anchor} disabled={busy}>{busy ? "Anchoring…" : "Anchor demo pack"}</button>
          <Chip tone="primary">Offline-verifiable</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12, overflowWrap: "anywhere" }}>{result}</p>}
      </Card>
    </div>
  );
}
