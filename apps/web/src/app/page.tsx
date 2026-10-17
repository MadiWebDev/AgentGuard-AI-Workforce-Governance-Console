"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Chip, Faq } from "@/components/m3";

const FEATURES: [string, string, string][] = [
  ["🛡", "Policy Engine", "Deny > require_approval > rate/spend > allow. Versioned rules, simulation, diff + rollback."],
  ["🔗", "Audit Log", "SHA-256 hash chain per org. Verification names the exact first broken row."],
  ["✓", "Approvals", "SLA queue, routing, escalation, two-person rule for critical. Self-approval blocked."],
  ["$", "Costs", "Spend by agent/model/provider, budgets, anomaly detection, editable pricing table."],
  ["🧪", "Red Team", "5-attack library with scored reports and draft-only policy fixes."],
  ["⚓", "Anchoring", "Daily Merkle roots on OpenTimestamps / EVM. Offline pack verification."],
  ["🛒", "Marketplace", "Trust scores from governance history only — never self-reported."],
  ["🎙", "Voice", "Transcript policy enforcement with barge-in on violations."],
];

export default function Home() {
  const [demoResult, setDemoResult] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  async function runDemo() {
    setDemoBusy(true);
    setDemoResult(null);
    try {
      const res = await fetch("/api/v1/policy/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "db_write", agentId: "demo-agent", cost: 5, environment: "prod" }),
      });
      const json = await res.json();
      setDemoResult(JSON.stringify(json, null, 2));
    } catch {
      setDemoResult("Demo request failed — is the dev server running?");
    } finally {
      setDemoBusy(false);
    }
  }
  return (
    <div>
      {/* Hero */}
      <section className="m3-hero-mesh m3-rounded-lg" style={{ padding: "48px 24px", marginBottom: 24 }}>
        <Chip tone="primary">AI Workforce Governance Console</Chip>
        <h1 className="m3-display-lg" style={{ margin: "16px 0 0", maxWidth: 820 }}>Govern every AI agent.<br />Prove it to any auditor.</h1>
        <p className="m3-body-lg" style={{ color: "var(--m3-on-surface-variant)", marginTop: 16, maxWidth: 640 }}>
          Log every agent action, enforce permissions and human approvals, track cost and reliability, and export tamper-evident, audit-ready evidence.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          <Link className="m3-btn m3-btn-filled" href="/onboarding">Start onboarding →</Link>
          <Link className="m3-btn m3-btn-outlined" href="/overview">Open dashboard</Link>
          <Link className="m3-btn m3-btn-text" href="/verify-pack">Verify a pack</Link>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }} aria-label="Demo stats">
          <Chip>59 golden checks passing</Chip>
          <Chip>105 tests passing</Chip>
          <Chip>60+ API routes</Chip>
          <Chip>50+ pages</Chip>
        </div>
        <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 8 }}>Stats above are demo values from this build (verify:all green, v1.4.0) — not live customer data.</p>
      </section>

      {/* Golden path */}
      <Card title="The golden path" subtitle="One flow, end to end. Every step is real — try the live demo below.">
        <ol className="m3-body-lg" style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>Register agent + mint scoped keys</li>
          <li>Ingest events — PII redacted before storage</li>
          <li>policy/check: allow / deny / require_approval</li>
          <li>Human approval with 2-person rule for critical</li>
          <li>Hash-chained audit + signed evidence pack</li>
        </ol>
      </Card>

      {/* Interactive policy demo — real API */}
      <div style={{ marginTop: 16 }}>
        <Card title="Try it: live policy check" subtitle="This widget calls the real POST /api/v1/policy/check with a sample prod db_write action.">
          <button type="button" className="m3-btn m3-btn-filled" onClick={runDemo} disabled={demoBusy}>{demoBusy ? "Checking…" : "Run policy check"}</button>
          {demoResult && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{demoResult}</pre>}
        </Card>
      </div>

      {/* Feature grid */}
      <h2 className="m3-headline-md" style={{ margin: "32px 0 16px" }}>Everything governance needs</h2>
      <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {FEATURES.map(([icon, t, d]) => (
          <div key={t} className="m3-card">
            <span aria-hidden className="m3-headline-md">{icon}</span>
            <h3 className="m3-title-lg" style={{ margin: "8px 0 4px" }}>{t}</h3>
            <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: 0 }}>{d}</p>
          </div>
        ))}
      </div>

      {/* Testimonials — MARKED placeholders, never fake */}
      <h2 className="m3-headline-md" style={{ margin: "32px 0 16px" }}>What teams say</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        {[1, 2].map((i) => (
          <div key={i} className="m3-card">
            <Chip tone="warning">Testimonial placeholder — replace with a real customer quote</Chip>
            <p className="m3-body-lg" style={{ marginTop: 12 }}>“Placeholder testimonial text. Do not ship with this copy — replace with an approved customer quote, name, role, and company.”</p>
            <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)" }}>— Name withheld (placeholder), Role (placeholder)</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="m3-headline-md" style={{ margin: "32px 0 16px" }}>Frequently asked questions</h2>
      <Faq items={[
        { q: "How does AgentGuard enforce policy?", a: "Agents call policy/check before sensitive actions. The engine returns allow, deny, or require_approval, and every decision is written to the hash-chained audit log." },
        { q: "What happens to PII in events?", a: "PII (email, phone, card numbers, SSN, keys, IBAN) is redacted before storage. The redaction pipeline is covered by control tests." },
        { q: "Can an auditor verify evidence independently?", a: "Yes. Evidence packs carry an Ed25519-signed manifest; the verify-pack page and CLI check the signature plus per-file SHA-256 hashes." },
        { q: "Does AgentGuard work without live services?", a: "Yes for dev/test — adapters fall back to local/in-memory implementations. Production rejects mocks and requires real credentials." },
      ]} />

      <footer style={{ textAlign: "center", marginTop: 32, color: "var(--m3-on-surface-variant)" }} className="m3-body-sm">
        <Link href="/pricing">Pricing</Link> · <Link href="/docs">Docs</Link> · <Link href="/security">Security</Link> · <Link href="/changelog">Changelog</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
