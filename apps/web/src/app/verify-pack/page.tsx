"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Stepper } from "@/components/m3";

export default function Page() {
  const [step, setStep] = useState(0);
  const [manifest, setManifest] = useState("");
  const [files, setFiles] = useState("");
  const [result, setResult] = useState<string | null>(null);

  function verify() {
    setStep(2);
    if (manifest.trim() === "" || files.trim() === "") {
      setResult("Paste a manifest and file list to verify. In production, upload manifest + files; this page demonstrates the flow — full verification runs via the CLI below.");
      return;
    }
    try {
      const m = JSON.parse(manifest) as { files?: { name: string; sha256: string }[] };
      const listed = (m.files ?? []).map((f) => f.name);
      const given = files.split(",").map((s) => s.trim()).filter(Boolean);
      const missing = listed.filter((n) => !given.includes(n));
      setResult(missing.length === 0
        ? "Manifest structure looks valid and all listed files were provided. NOTE: this browser check does not recompute SHA-256 or verify the Ed25519 signature — use the CLI below for full verification."
        : `Manifest lists ${listed.length} file(s); missing from your file list: ${missing.join(", ")}.`);
    } catch {
      setResult("Manifest is not valid JSON — paste the manifest.json from an evidence pack.");
    }
  }

  return (
    <div>
      <PageHeader title="Verify an evidence pack" description="Manifest signature (Ed25519) + per-file SHA-256 must both pass; modifying any file fails verification."
        crumbs={[{ label: "Home", href: "/" }, { label: "Verify Pack" }]} />
      <Card title="Verification flow">
        <Stepper steps={["Upload manifest + files", "Check hashes", "Verify signature"]} current={step} />
      </Card>
      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        <Card title="1 · Paste manifest + file list" subtitle="Upload of manifest + files happens in production; here you paste them to walk the flow.">
          <label className="m3-label" htmlFor="vp-manifest">manifest.json contents</label>
          <textarea id="vp-manifest" className="m3-textarea" rows={5} value={manifest} onChange={(e) => setManifest(e.target.value)} placeholder='{"files":[{"name":"audit.json","sha256":"…"}]}' />
          <label className="m3-label" htmlFor="vp-files" style={{ marginTop: 12 }}>Files in the pack (comma-separated names)</label>
          <input id="vp-files" className="m3-input" value={files} onChange={(e) => setFiles(e.target.value)} placeholder="audit.json, audit.csv" />
          <div style={{ marginTop: 12 }}><button type="button" className="m3-btn m3-btn-filled" onClick={verify}>Verify manifest structure</button></div>
          {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
        </Card>
        <Card title="2 · Full verification (CLI)" subtitle="The CLI recomputes SHA-256 per file and verifies the Ed25519 signature.">
          <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", margin: 0 }}>node scripts/verify-pack.mjs --manifest manifest.json --dir ./pack</pre>
          <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 8 }}>See packages/shared evidence.ts: signManifest / verifyManifest.</p>
          <Chip tone="primary">Tamper-evident: any modified file fails</Chip>
        </Card>
      </div>
    </div>
  );
}
