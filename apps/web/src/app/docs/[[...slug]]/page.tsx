import Link from "next/link";
import { PageHeader, Card } from "@/components/m3";

const SECTIONS: [string, string, string][] = [
  ["API", "Full route contract, auth, error format.", "/docs/api"],
  ["Security", "STRIDE threat model, headers, secrets.", "/docs/security"],
  ["Compliance", "Control mapping, evidence, retention.", "/docs/compliance"],
  ["Runbook", "Incidents, rotation, chaos playbooks.", "/docs/runbook"],
  ["Operator Handbook", "Non-technical setup: accounts → launch.", "/docs/operator"],
  ["Verification", "Gates R1–R48 + P1–P10 with verdicts.", "/docs/verification"],
];

export default function Page() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <aside aria-label="Docs navigation" style={{ minWidth: 220, flex: "0 0 220px" }}>
        <nav className="m3-card" style={{ position: "sticky", top: 88 }}>
          <h2 className="m3-title-md" style={{ margin: "0 0 8px" }}>Documentation</h2>
          {SECTIONS.map(([label, _d, href]) => (
            <Link key={href} className="navlink" href={href}>{label}</Link>
          ))}
        </nav>
      </aside>
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        <PageHeader title="Docs" description="Full docs live in /docs in the repo: API, SECURITY, COMPLIANCE, RUNBOOK, OPERATOR_HANDBOOK. Start with the quickstart below."
          crumbs={[{ label: "Home", href: "/" }, { label: "Docs" }]} />
        <Card title="Quickstart">
          <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", margin: 0 }}>pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev</pre>
        </Card>
        <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 16 }}>
          {SECTIONS.map(([label, desc]) => (
            <div key={label} className="m3-card">
              <h3 className="m3-title-lg" style={{ margin: "0 0 4px" }}>{label}</h3>
              <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
