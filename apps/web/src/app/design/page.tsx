import { notFound } from "next/navigation";
import { Card, Chip, EmptyState, PageHeader, SkeletonCard, StatCard, Sparkline, ProgressRing, Tabs, Stepper, Faq } from "@/components/m3";
import { ChartCard, BarChart, LineChart } from "@/components/charts";

/**
 * M3 component gallery — DEV ONLY. Renders 404 in production.
 * Showcases every primitive in both themes (toggle via the app bar).
 */
export default function DesignGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div>
      <PageHeader title="Design System Gallery" description="Material Design 3 primitives. Dev-only route — 404 in production. Toggle light/dark in the app bar to preview both themes." crumbs={[{ label: "Home", href: "/" }, { label: "Design gallery" }]} />
      <div style={{ display: "grid", gap: 16 }}>
        <Card title="Type scale">
          <p className="m3-display-lg">Display Large</p>
          <p className="m3-headline-lg">Headline Large</p>
          <p className="m3-title-lg">Title Large</p>
          <p className="m3-body-lg">Body Large — the quick brown fox.</p>
          <p className="m3-body-md">Body Medium — the quick brown fox.</p>
          <p className="m3-label-lg">Label Large</p>
          <p className="mono">Mono — ag_live_… / code / keys</p>
        </Card>
        <Card title="Buttons" subtitle="Filled, tonal, outlined, text, danger. Min 44px tap targets.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="m3-btn m3-btn-filled">Filled</button>
            <button type="button" className="m3-btn m3-btn-tonal">Tonal</button>
            <button type="button" className="m3-btn m3-btn-outlined">Outlined</button>
            <button type="button" className="m3-btn m3-btn-text">Text</button>
            <button type="button" className="m3-btn m3-btn-danger">Danger</button>
          </div>
        </Card>
        <Card title="Chips"><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Chip>Default</Chip><Chip tone="primary">Primary</Chip><Chip tone="success">Success</Chip><Chip tone="error">Error</Chip><Chip tone="warning">Warning</Chip></div></Card>
        <Card title="Inputs">
          <label className="m3-label" htmlFor="gallery-input">Label</label>
          <input id="gallery-input" className="m3-input" placeholder="Outlined input" />
          <p className="m3-field-error">Example inline error (only shown when a field is invalid).</p>
        </Card>
        <Card title="Stats + sparkline + progress ring">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
            <StatCard label="Events" value="12,480" delta="▲ 8% vs last week" tone="success" />
            <StatCard label="Spend" value="$1,240" delta="▼ 3% vs last week" tone="success" />
          </div>
          <div style={{ marginTop: 12 }}><Sparkline values={[4, 7, 5, 9, 8, 12, 10]} label="Demo sparkline" /></div>
          <div style={{ marginTop: 12 }}><ProgressRing percent={62} label="Budget used" /></div>
        </Card>
        <Card title="Charts"><ChartCard title="Spend by day" state="data" subtitle="Real values only"><BarChart values={[{ label: "Mon", value: 12 }, { label: "Tue", value: 19 }, { label: "Wed", value: 8 }]} label="Spend by day" /></ChartCard><div style={{ height: 12 }} /><ChartCard title="Latency" state="data"><LineChart values={[42, 38, 51, 44, 39]} label="Latency" /></ChartCard><div style={{ height: 12 }} /><ChartCard title="Empty chart" state="empty" emptyGuidance="Honest empty state — no invented data." /></Card>
        <Card title="Skeleton + empty state"><SkeletonCard /><EmptyState icon="📭" title="Nothing here yet" guidance="Beautiful empty state with guidance and an action." actionLabel="Get started" actionHref="/onboarding" /></Card>
        <Card title="Tabs / stepper / FAQ">
          <Tabs tabs={[{ id: "a", label: "One", content: <p className="m3-body-md">Tab one content.</p> }, { id: "b", label: "Two", content: <p className="m3-body-md">Tab two content.</p> }]} />
          <div style={{ marginTop: 16 }}><Stepper steps={["Create org", "Register agent", "Send test event"]} current={1} /></div>
          <div style={{ marginTop: 16 }}><Faq items={[{ q: "What is AgentGuard?", a: "AI workforce governance: log, enforce, approve, prove." }]} /></div>
        </Card>
        <Card title="Elevation + shape">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[1, 2, 3, 4, 5].map((e) => (<div key={e} className={`m3-elevation-${e} m3-rounded-md`} style={{ padding: 16, background: "var(--m3-surface-container-low)" }}>Elevation {e}</div>))}
          </div>
        </Card>
      </div>
    </div>
  );
}
