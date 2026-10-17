import Link from "next/link";
import { PageHeader, Card, Chip } from "@/components/m3";

const PLANS: [string, string, string, string[], boolean][] = [
  ["Free", "$0", "1 agent · 10k events/mo · 7-day retention", ["1 agent", "10k events / month", "7-day retention", "Core policy + audit"], false],
  ["Pro", "$49/mo", "10 agents · 250k events · 30-day retention", ["10 agents", "250k events / month", "30-day retention", "Red-team + baselining"], true],
  ["Team", "$199/mo", "Unlimited agents · 2M events · 90-day retention · Add-ons", ["Unlimited agents", "2M events / month", "90-day retention", "Add-ons + SIEM + PWA"], false],
  ["Enterprise", "Custom", "Custom limits · Contact sales", ["Custom limits", "BYOK + residency", "Dedicated support", "Custom DPA"], false],
];

export default function Page() {
  return (
    <div>
      <PageHeader title="Pricing" description="Paddle Billing (merchant of record). Annual billing: 2 months free. Checkout is env-gated — configure Paddle to enable live checkout."
        crumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]} />
      <div className="m3-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {PLANS.map(([name, price, tagline, features, highlighted]) => (
          <div key={name} className="m3-card" style={highlighted ? { borderColor: "var(--m3-primary)", borderWidth: 2, boxShadow: "var(--m3-elevation-2)" } : undefined}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="m3-title-lg" style={{ margin: 0 }}>{name}</h2>
              {highlighted && <Chip tone="primary">Most popular</Chip>}
            </div>
            <p className="m3-headline-md" style={{ margin: "12px 0 4px" }}>{price}</p>
            <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: 0 }}>{tagline}</p>
            <ul className="m3-body-md" style={{ margin: "16px 0", paddingLeft: 20, lineHeight: 1.9 }}>
              {features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <Link className={highlighted ? "m3-btn m3-btn-filled" : "m3-btn m3-btn-outlined"} href="/onboarding">Choose {name}</Link>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <Card title="Overage" subtitle="Usage beyond plan limits is metered in Paddle (overage price per 10k events, configured via PADDLE_PRICE_OVERAGE_10K). No surprise bills — budgets and alerts warn first.">
          <Link className="m3-btn m3-btn-text" href="/docs">How billing works →</Link>
        </Card>
      </div>
    </div>
  );
}
