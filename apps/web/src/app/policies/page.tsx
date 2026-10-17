import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

const PRECEDENCE = ["deny", "require_approval", "rate_limit / spend_cap", "allow"];

export default function Page() {
  return (
    <div>
      <PageHeader title="Policies" description="Policy engine: rules, versioning, simulation, diff + rollback."
        crumbs={[{ label: "Home", href: "/" }, { label: "Policies" }]}
        primary={{ label: "Author from plain English", href: "/policies/nl" }}
        secondary={[{ label: "Policy packs", href: "/packs" }]} />
      <Card title="Precedence" subtitle="When several rules match, the highest-precedence outcome wins.">
        <ol style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", margin: 0, padding: 0, alignItems: "center" }}>
          {PRECEDENCE.map((p, i) => (
            <li key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Chip tone={i === 0 ? "error" : i === 1 ? "warning" : i === 2 ? "primary" : "success"}>{i + 1}. {p}</Chip>
              {i < PRECEDENCE.length - 1 && <span aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </Card>
      <div style={{ marginTop: 16 }}>
        <Card title="Rule list">
          <EmptyState icon="📜" title="No custom rules yet" guidance="Author a rule from plain English, install a policy pack, or accept an autopilot proposal. Drafts never affect policy/check until activated." actionLabel="Author a policy" actionHref="/policies/nl" />
        </Card>
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        <Card title="Simulation" subtitle="Replay past events against a draft before activating it."><Link className="m3-btn m3-btn-outlined" href="/policies/nl">Simulate a draft</Link></Card>
        <Card title="Version timeline" subtitle="Every change is versioned with a diff + rollback."><Link className="m3-btn m3-btn-outlined" href="/policies">View versions</Link></Card>
      </div>
    </div>
  );
}
