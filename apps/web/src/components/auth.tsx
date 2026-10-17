import Link from "next/link";
import type { ReactNode } from "react";

/** Centered M3 auth card + brand panel on desktop. Demo form — does not create a session. */
export function AuthShell(props: { title: string; subtitle: string; children: ReactNode; alt: { label: string; href: string } }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "stretch" }}>
      <aside aria-hidden className="m3-hero-mesh m3-rounded-lg" style={{ flex: "1 1 320px", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)", borderRadius: 8, padding: "4px 10px", fontSize: 16, fontWeight: 800, alignSelf: "flex-start" }}>AG</span>
        <h2 className="m3-display-md" style={{ margin: "16px 0 0" }}>Govern every AI agent.</h2>
        <p className="m3-body-lg" style={{ color: "var(--m3-on-surface-variant)" }}>Prove it to any auditor.</p>
      </aside>
      <div className="m3-card m3-elevation-2" style={{ flex: "1 1 320px", maxWidth: 480, margin: "0 auto", padding: 24 }}>
        <h1 className="m3-headline-md" style={{ margin: "0 0 4px" }}>{props.title}</h1>
        <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: "0 0 20px" }}>{props.subtitle}</p>
        {props.children}
        <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 16 }}>
          Auth is env-gated. In production use Better Auth + org plugin. Demo form does not create a session.
        </p>
        <p className="m3-body-md" style={{ marginTop: 12 }}><Link href={props.alt.href}>{props.alt.label}</Link></p>
      </div>
    </div>
  );
}
