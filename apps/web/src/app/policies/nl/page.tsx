"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [utterance, setUtterance] = useState("blocks prod database writes on weekends");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function draft() {
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/v1/policies/draft-from-nl", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance }),
      });
      const json = await res.json();
      if (json.error) { setError(json.error.message); return; }
      setResult(JSON.stringify(json.data, null, 2));
    } catch { setError("Request failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Natural-Language Policy Authoring" description="Describe a policy in plain English and get a Zod-validated draft with a plain-English explanation and a simulation diff. Drafts never affect policy/check until you activate them."
        crumbs={[{ label: "Policies", href: "/policies" }, { label: "Author from plain English" }]} />
      <Card title="Describe your policy" subtitle="Try the sample, or write your own.">
        <label className="m3-label" htmlFor="nl-utterance">Policy in plain English</label>
        <input id="nl-utterance" className="m3-input" value={utterance} onChange={(e) => setUtterance(e.target.value)} placeholder="e.g. blocks prod database writes on weekends" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={draft} disabled={busy || utterance.trim() === ""}>{busy ? "Drafting…" : "Generate draft"}</button>
          <Chip>Draft-only — never auto-activated</Chip>
        </div>
        {error && <p role="alert" className="m3-body-md" style={{ color: "var(--m3-error)" }}>{error}</p>}
        {result && <pre className="m3-card" style={{ marginTop: 16, overflowX: "auto", whiteSpace: "pre-wrap" }}>{result}</pre>}
      </Card>
    </div>
  );
}
