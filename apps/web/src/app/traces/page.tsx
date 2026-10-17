"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/m3";

export default function Page() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <aside aria-label="Trace filters" style={{ minWidth: 220, flex: "0 0 220px" }}>
        <div className="m3-card" style={{ position: "sticky", top: 88 }}>
          <h2 className="m3-title-md" style={{ margin: "0 0 12px" }}>Filters</h2>
          <label className="m3-label" htmlFor="trace-search">Search</label>
          <input id="trace-search" className="m3-input" placeholder="Trace id, agent, tool…" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="m3-label" style={{ marginTop: 16 }} htmlFor="trace-filter">Status</label>
          <select id="trace-filter" className="m3-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="allowed">Allowed</option>
            <option value="denied">Denied</option>
            <option value="approval">Needs approval</option>
            <option value="error">Error</option>
          </select>
          <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 12 }}>
            Filters apply to the trace list below. Share a trace with its deep link: <span className="mono">/traces/&lt;id&gt;</span>
          </p>
        </div>
      </aside>
      <div style={{ flex: "1 1 480px", minWidth: 0 }}>
        <PageHeader title="Traces" description="Trace explorer: waterfall, filters, search, compare runs."
          crumbs={[{ label: "Home", href: "/" }, { label: "Traces" }]}
          primary={{ label: "Onboarding", href: "/onboarding" }} />
        <Card title="Trace list">
          <EmptyState icon="↔" title="No traces yet" guidance={`No traces match${q ? ` “${q}”` : ""}${filter !== "all" ? ` with status “${filter}”` : ""}. Ingest events to see waterfalls here — each trace gets a shareable deep link.`} actionLabel="Send a test event" actionHref="/onboarding" />
        </Card>
        <div style={{ marginTop: 16 }}>
          <Card title="Compare runs" subtitle="Open two trace details and compare their waterfalls side by side.">
            <Link className="m3-btn m3-btn-outlined" href="/traces">Open trace list</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
