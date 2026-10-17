"use client";
import type { ReactNode } from "react";
import { EmptyState } from "./m3";

/** ChartCard: every chart has empty / loading / error states. No invented data. */
export function ChartCard(props: {
  title: string;
  subtitle?: string;
  state: "data" | "empty" | "loading" | "error";
  emptyTitle?: string;
  emptyGuidance?: string;
  errorMessage?: string;
  children?: ReactNode;
}) {
  return (
    <section className="m3-card" aria-label={props.title}>
      <h3 className="m3-title-lg" style={{ margin: "0 0 4px" }}>{props.title}</h3>
      {props.subtitle && <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", margin: "0 0 12px" }}>{props.subtitle}</p>}
      {props.state === "loading" && <div aria-label="Chart loading" style={{ display: "grid", gap: 8 }}><div className="m3-skeleton" style={{ height: 120 }} /><div className="m3-skeleton" style={{ height: 16, width: "60%" }} /></div>}
      {props.state === "empty" && <EmptyState icon="📊" title={props.emptyTitle ?? "No data yet"} guidance={props.emptyGuidance ?? "Ingest events or wait for activity — this chart renders from real data only."} />}
      {props.state === "error" && <div role="alert" className="m3-body-md" style={{ color: "var(--m3-error)" }}>{props.errorMessage ?? "Could not load this chart. Try again."}</div>}
      {props.state === "data" && props.children}
    </section>
  );
}

/** Simple SVG bar chart from real values. */
export function BarChart(props: { values: { label: string; value: number }[]; label: string }) {
  if (props.values.length === 0) return <p className="m3-body-md">No data to chart.</p>;
  const max = Math.max(...props.values.map((v) => v.value), 1);
  return (
    <svg viewBox="0 0 320 140" role="img" aria-label={props.label} style={{ width: "100%", height: "auto", display: "block" }}>
      {props.values.map((v, i) => {
        const bw = 320 / props.values.length;
        const h = (v.value / max) * 100;
        return (
          <g key={v.label}>
            <rect x={bw * i + 8} y={110 - h} width={Math.max(8, bw - 16)} height={h} rx={4} fill="var(--m3-primary)" />
            <text x={bw * i + bw / 2} y={128} textAnchor="middle" fontSize={9} fill="var(--m3-on-surface-variant)">{v.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Simple SVG line chart from real values. */
export function LineChart(props: { values: number[]; label: string }) {
  if (props.values.length < 2) return <p className="m3-body-md">Not enough data to chart yet.</p>;
  const w = 320, h = 120, max = Math.max(...props.values), min = Math.min(...props.values), span = max - min || 1;
  const pts = props.values.map((v, i) => `${(i / (props.values.length - 1)) * w},${h - 10 - ((v - min) / span) * (h - 20)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={props.label} style={{ width: "100%", height: "auto", display: "block" }}>
      <polyline points={pts} fill="none" stroke="var(--m3-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
