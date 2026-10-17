"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [tokens, setTokens] = useState("Hello, here is a secret: sk_live_abcdef1234567890 — do not share.");
  const [pattern, setPattern] = useState("sk_live_[A-Za-z0-9]+");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function inspect() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/gateway/stream-inspect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: tokens.split(" "), guardPolicies: [{ id: "g1", pattern }] }),
      });
      const json = await res.json();
      setResult(json.error ? `Inspect failed: ${json.error.message}` : `Terminated: ${json.data?.terminated ? "yes" : "no"}. Matched rule: ${json.data?.matchedRuleId ?? "none"}. Output: ${(json.data?.outputTokens ?? []).join(" ")}`);
    } catch { setResult("Inspect failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Token-Stream Inspection" description="Gateway inspects streaming output token-by-token in buffered windows. On a content-guard match the stream terminates mid-flight, the tail is redacted, and a guardrail_triggered event is stored."
        crumbs={[{ label: "Home", href: "/" }, { label: "Token Stream" }]} />
      <Card title="Inspect a stream" subtitle="Tokens are released only after clearing the buffered window; on match only pre-window tokens are released.">
        <label className="m3-label" htmlFor="ts-tokens">Tokens (space-separated)</label>
        <textarea id="ts-tokens" className="m3-textarea" rows={3} value={tokens} onChange={(e) => setTokens(e.target.value)} />
        <label className="m3-label" htmlFor="ts-pattern" style={{ marginTop: 12 }}>Guard pattern (regex)</label>
        <input id="ts-pattern" className="m3-input" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={inspect} disabled={busy}>{busy ? "Inspecting…" : "Inspect stream"}</button>
          <Chip>Buffered windows · mid-flight termination</Chip>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
      </Card>
    </div>
  );
}
