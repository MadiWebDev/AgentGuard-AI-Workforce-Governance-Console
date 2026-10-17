import { PageHeader, Card, Chip } from "@/components/m3";

const ENTRIES: [string, string, string][] = [
  ["v1.4.0", "Complete UI/UX redesign", "Material Design 3 system, global shell, every page redesigned. No behavior changes."],
  ["v1.3.0", "Ecosystem & Growth", "Marketplace + trust scores, A2A governance, white-label, MSP, client billing, scheduled audits, warehouse sync, on-call, trust badge, voice governance."],
  ["v1.2.1", "Production hardening", "Fail-fast env validation, security headers, generic 500s, honest /api/ready, rate limits, secret scan, lifecycle contract."],
  ["v1.2.0", "Autonomous Governance & Deep Trust", "Token-stream inspection, sandboxed execution, attestation, NL policy authoring, autopilot, collusion detection, chain anchoring, compliance, DP benchmarking, lineage."],
  ["v1.1.0", "Enterprise", "SSO/SAML + SCIM, data residency, BYOK, red-team, baselining, cost optimizer, SIEM, runbooks, policy packs, PWA."],
  ["v1.0.0", "Initial release", "Golden path, ingest, policy, approvals, audit, costs, billing adapters, add-ons, SDKs, MCP."],
];

export default function Page() {
  return (
    <div>
      <PageHeader title="Changelog" description="Every release, newest first. Full detail lives in CHANGELOG.md in the repo."
        crumbs={[{ label: "Home", href: "/" }, { label: "Changelog" }]} />
      <div style={{ display: "grid", gap: 16, position: "relative" }}>
        {ENTRIES.map(([v, title, desc], i) => (
          <div key={v} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div aria-hidden style={{ flexShrink: 0, width: 12, height: 12, borderRadius: "50%", background: i === 0 ? "var(--m3-primary)" : "var(--m3-outline-variant)", marginTop: 8 }} />
            <Card title={`${v} — ${title}`} subtitle={desc}>
              {i === 0 && <Chip tone="primary">Latest</Chip>}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
