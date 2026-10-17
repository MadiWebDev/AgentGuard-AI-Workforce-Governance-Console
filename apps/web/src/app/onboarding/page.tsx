"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Stepper } from "@/components/m3";

const SNIPPET = `import { AgentGuard } from "@agentguard/sdk-ts";
const ag = new AgentGuard({ apiKey: "ag_live_...", baseUrl: "http://localhost:3000" });
await ag.track({ type: "tool_call", traceId: "tr_1", agentId: "agent_1", tool: "search" });
const d = await ag.checkPolicy({ tool: "deploy", cost: 5 });
`;

export default function Page() {
  const [step, setStep] = useState(0);
  const [ingestOut, setIngestOut] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTestEvent() {
    setBusy(true); setIngestOut(null);
    try {
      const res = await fetch("/api/v1/ingest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: [{ traceId: "tr_demo_1", agentId: "agent_1", type: "tool_call", input: { tool: "search", query: "demo" }, costUsd: 0.01, idempotencyKey: `onboard-${Date.now()}` }] }),
      });
      const json = await res.json();
      setIngestOut(JSON.stringify(json, null, 2));
      if (!json.error) setStep(3);
    } catch { setIngestOut("Ingest failed — is the server running?"); }
    finally { setBusy(false); }
  }

  async function checkPolicy() {
    setBusy(true); setCheckOut(null);
    try {
      const res = await fetch("/api/v1/policy/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "deploy", agentId: "agent_1", cost: 5, environment: "prod" }),
      });
      const json = await res.json();
      setCheckOut(JSON.stringify(json, null, 2));
    } catch { setCheckOut("Policy check failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Onboarding — under 5 minutes" description="Four steps from zero to a governed agent, with a live test event against the real APIs."
        crumbs={[{ label: "Home", href: "/" }, { label: "Onboarding" }]} />
      <Card title="Your progress">
        <Stepper steps={["Create org", "Register agent", "Copy SDK snippet", "Send test event"]} current={step} />
      </Card>
      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        <Card title="1 · Create org" subtitle="Demo org: org_demo. Production orgs are created in Settings → Team.">
          <button type="button" className="m3-btn m3-btn-outlined" onClick={() => setStep(1)}>I have an org →</button>
        </Card>
        <Card title="2 · Register first agent" subtitle="Agents get scoped, hash-only API keys (ag_live_… / ag_test_…).">
          <Link className="m3-btn m3-btn-outlined" href="/agents">Go to Agents</Link>
          <button type="button" className="m3-btn m3-btn-text" onClick={() => setStep(2)}>I registered an agent →</button>
        </Card>
        <Card title="3 · Copy SDK snippet" subtitle="TS / Python / curl / MCP — same APIs.">
          <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", margin: 0 }}>{SNIPPET}</pre>
        </Card>
        <Card title="4 · Send a test event — see it in Traces" subtitle="Live test-event animation: this posts a real event to /api/v1/ingest, then runs a real policy check.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="m3-btn m3-btn-filled" onClick={sendTestEvent} disabled={busy}>{busy ? "Sending…" : "Send test event"}</button>
            <button type="button" className="m3-btn m3-btn-outlined" onClick={checkPolicy} disabled={busy}>Check policy</button>
          </div>
          {ingestOut && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{ingestOut}</pre>}
          {checkOut && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{checkOut}</pre>}
          <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 12 }}>Playwright covers signup → onboarding → test event in tests/e2e (manual in this environment).</p>
        </Card>
      </div>
    </div>
  );
}
