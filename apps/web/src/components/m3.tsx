"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";

/* ---------- PageHeader: title + description + primary/secondary actions ---------- */
export function PageHeader(props: {
  title: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string }[];
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <header className="m3-enter" style={{ marginBottom: 24 }}>
      {props.crumbs && props.crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: 8 }}>
          <ol style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }} className="m3-body-sm">
            {props.crumbs.map((c, i) => (
              <li key={c.label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {i > 0 && <span aria-hidden style={{ color: "var(--m3-on-surface-variant)" }}>/</span>}
                {c.href ? (
                  <Link href={c.href} style={{ color: "var(--m3-primary)" }}>{c.label}</Link>
                ) : (
                  <span aria-current="page" style={{ color: "var(--m3-on-surface-variant)" }}>{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ maxWidth: 720 }}>
          <h1 className="m3-headline-md" style={{ margin: 0 }}>{props.title}</h1>
          {props.description && <p className="m3-body-lg" style={{ color: "var(--m3-on-surface-variant)", marginTop: 8 }}>{props.description}</p>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {props.secondary?.map((s) => (
            <Link key={s.label} className="m3-btn m3-btn-outlined" href={s.href}>{s.label}</Link>
          ))}
          {props.primary && <Link className="m3-btn m3-btn-filled" href={props.primary.href}>{props.primary.label}</Link>}
        </div>
      </div>
    </header>
  );
}

/* ---------- Card ---------- */
export function Card(props: { title?: string; subtitle?: string; children: ReactNode; actions?: ReactNode; elevated?: boolean; className?: string }) {
  return (
    <section className={props.elevated ? "m3-card m3-card-elevated" : "m3-card"} style={{ overflow: "hidden" }}>
      {(props.title || props.subtitle) && (
        <div style={{ marginBottom: 12 }}>
          {props.title && <h2 className="m3-title-lg" style={{ margin: 0 }}>{props.title}</h2>}
          {props.subtitle && <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", marginTop: 4 }}>{props.subtitle}</p>}
        </div>
      )}
      {props.children}
      {props.actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>{props.actions}</div>}
    </section>
  );
}

/* ---------- Chip ---------- */
export function Chip(props: { children: ReactNode; tone?: "default" | "primary" | "success" | "error" | "warning" }) {
  const cls = props.tone && props.tone !== "default" ? `m3-chip m3-chip-${props.tone}` : "m3-chip";
  return <span className={cls}>{props.children}</span>;
}

/* ---------- EmptyState: never a raw "no data" table ---------- */
export function EmptyState(props: { icon?: string; title: string; guidance: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 16px" }} role="status">
      <div aria-hidden style={{ fontSize: 40, marginBottom: 12 }}>{props.icon ?? "◯"}</div>
      <h3 className="m3-title-lg" style={{ margin: 0 }}>{props.title}</h3>
      <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: "8px auto 0", maxWidth: 480 }}>{props.guidance}</p>
      {props.actionLabel && props.actionHref && (
        <div style={{ marginTop: 16 }}><Link className="m3-btn m3-btn-filled" href={props.actionHref}>{props.actionLabel}</Link></div>
      )}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton(props: { width?: string | number; height?: number; label?: string }) {
  return (
    <div className="m3-skeleton" role="status" aria-label={props.label ?? "Loading"}
      style={{ width: props.width ?? "100%", height: props.height ?? 20 }} />
  );
}
export function SkeletonCard() {
  return (
    <div className="m3-card" aria-hidden>
      <Skeleton width="40%" height={20} /><div style={{ height: 12 }} />
      <Skeleton width="85%" height={14} /><div style={{ height: 8 }} />
      <Skeleton width="60%" height={14} />
    </div>
  );
}

/* ---------- StatCard ---------- */
export function StatCard(props: { label: string; value: string; delta?: string; tone?: "default" | "success" | "error" | "warning" }) {
  return (
    <div className="m3-card">
      <p className="m3-label-md" style={{ color: "var(--m3-on-surface-variant)", textTransform: "uppercase", margin: 0 }}>{props.label}</p>
      <p className="m3-headline-sm" style={{ margin: "8px 0 0" }}>{props.value}</p>
      {props.delta && <p className="m3-body-sm" style={{ margin: "4px 0 0", color: props.tone === "error" ? "var(--m3-error)" : props.tone === "success" ? "var(--m3-success)" : "var(--m3-on-surface-variant)" }}>{props.delta}</p>}
    </div>
  );
}

/* ---------- Sparkline (SVG, from real values; empty array -> honest empty mark) ---------- */
export function Sparkline(props: { values: number[]; label: string }) {
  if (props.values.length < 2) {
    return <span className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)" }}>Not enough data to chart yet</span>;
  }
  const w = 120, h = 32, max = Math.max(...props.values), min = Math.min(...props.values);
  const span = max - min || 1;
  const pts = props.values.map((v, i) => `${(i / (props.values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={props.label} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="var(--m3-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Progress ring (budget meters) ---------- */
export function ProgressRing(props: { percent: number; label: string }) {
  const pct = Math.max(0, Math.min(100, props.percent));
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={64} height={64} viewBox="0 0 64 64" role="img" aria-label={props.label}>
        <circle cx={32} cy={32} r={r} fill="none" stroke="var(--m3-surface-container-highest)" strokeWidth={6} />
        <circle cx={32} cy={32} r={r} fill="none" stroke="var(--m3-primary)" strokeWidth={6} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)" />
        <text x={32} y={36} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--m3-on-surface)">{pct}%</text>
      </svg>
      <span className="m3-body-md">{props.label}</span>
    </div>
  );
}

/* ---------- Dialog + ConfirmDialog (bottom sheet on mobile via .m3-scrim/.m3-dialog) ---------- */
export function Dialog(props: { open: boolean; title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  if (!props.open) return null;
  return (
    <div className="m3-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="m3-dialog" role="dialog" aria-modal="true" aria-label={props.title}>
        <h2 className="m3-title-lg" style={{ margin: "0 0 12px" }}>{props.title}</h2>
        {props.children}
        {props.actions && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>{props.actions}</div>}
      </div>
    </div>
  );
}
export function ConfirmDialog(props: { open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={props.open} title={props.title} onClose={props.onCancel}
      actions={<>
        <button type="button" className="m3-btn m3-btn-text" onClick={props.onCancel}>Cancel</button>
        <button type="button" className={props.danger ? "m3-btn m3-btn-danger" : "m3-btn m3-btn-filled"} onClick={props.onConfirm}>{props.confirmLabel}</button>
      </>}>
      <p className="m3-body-lg" style={{ margin: 0 }}>{props.body}</p>
    </Dialog>
  );
}

/* ---------- Tabs (client-side, no behavior change to data) ---------- */
export function Tabs(props: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(props.tabs[0]?.id ?? "");
  return (
    <div>
      <div role="tablist" aria-label="Sections" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {props.tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id} className="m3-tab" onClick={() => setActive(t.id)}>{t.label}</button>
        ))}
      </div>
      {props.tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id}>{active === t.id ? t.content : null}</div>
      ))}
    </div>
  );
}

/* ---------- Stepper (onboarding wizard) ---------- */
export function Stepper(props: { steps: string[]; current: number }) {
  return (
    <ol style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", margin: 0, padding: 0 }} aria-label="Progress">
      {props.steps.map((s, i) => {
        const done = i < props.current, active = i === props.current;
        return (
          <li key={s} style={{ display: "flex", alignItems: "center", gap: 8 }} aria-current={active ? "step" : undefined}>
            <span style={{
              width: 32, height: 32, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: done || active ? "var(--m3-primary)" : "var(--m3-surface-container-high)",
              color: done || active ? "var(--m3-on-primary)" : "var(--m3-on-surface-variant)",
              fontSize: 14, fontWeight: 600,
            }}>{done ? "✓" : i + 1}</span>
            <span className="m3-label-lg">{s}</span>
            {i < props.steps.length - 1 && <span aria-hidden style={{ color: "var(--m3-outline)", margin: "0 4px" }}>→</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- FAQ accordion ---------- */
export function Faq(props: { items: { q: string; a: string }[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {props.items.map((it) => (
        <details key={it.q} className="m3-card" style={{ padding: "12px 16px" }}>
          <summary className="m3-title-md" style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>{it.q}</summary>
          <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: "8px 0 0" }}>{it.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ---------- Error boundary (per-section, with recovery) ---------- */
import { Component, type ErrorInfo } from "react";
export class SectionErrorBoundary extends Component<{ children: ReactNode; section: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(_e: Error, _info: ErrorInfo) { /* client-side only; server logs unchanged */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="m3-card" role="alert">
          <h3 className="m3-title-md" style={{ margin: 0 }}>Something went wrong in {this.props.section}</h3>
          <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)" }}>This section failed to render. Your data is unaffected.</p>
          <button type="button" className="m3-btn m3-btn-outlined" onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
