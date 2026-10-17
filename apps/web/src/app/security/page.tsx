import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  return (
    <div>
      <PageHeader title="Security" description="How AgentGuard protects your agents, your data, and your audit trail."
        crumbs={[{ label: "Home", href: "/" }, { label: "Security" }]} />
      <div className="m3-stagger" style={{ display: "grid", gap: 16 }}>
        <Card title="Trust badges">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip tone="success">✓ Hash-chained audit</Chip>
            <Chip tone="success">✓ Ed25519-signed evidence</Chip>
            <Chip tone="success">✓ PII redaction before storage</Chip>
            <Chip tone="success">✓ CSP + HSTS + fail-fast prod validation</Chip>
            <Chip tone="success">✓ Generic 500s in production</Chip>
            <Chip tone="success">✓ Mocks rejected in production</Chip>
          </div>
        </Card>
        <Card title="Threat model" subtitle="Full STRIDE analysis lives in docs/SECURITY.md in the repo.">
          <ul className="m3-body-md" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            <li><strong>Spoofing:</strong> per-agent keys + workload attestation for high/critical tiers.</li>
            <li><strong>Tampering:</strong> SHA-256 hash chain + signed manifests + optional chain anchoring.</li>
            <li><strong>Repudiation:</strong> append-only audit; every decision signed and timestamped.</li>
            <li><strong>Disclosure:</strong> PII redaction, BYOK encryption, residency pinning, safe logging.</li>
            <li><strong>Denial of service:</strong> per-key rate limits, 1 MB ingest cap, sandbox limits.</li>
            <li><strong>Elevation:</strong> scoped keys, roles, two-person rule, self-approval blocked.</li>
          </ul>
        </Card>
        <Card title="Report a vulnerability">
          <p className="m3-body-md" style={{ margin: 0 }}>Security.txt at <span className="mono">/.well-known/security.txt</span>. See docs/SECURITY.md for the disclosure process.</p>
        </Card>
      </div>
    </div>
  );
}
