"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const NAV: { label: string; href: string; icon: string; group: string }[] = [
  { label: "Overview", href: "/overview", icon: "▦", group: "App" },
  { label: "Agents", href: "/agents", icon: "🤖", group: "App" },
  { label: "Traces", href: "/traces", icon: "↔", group: "App" },
  { label: "Policies", href: "/policies", icon: "📜", group: "App" },
  { label: "Approvals", href: "/approvals", icon: "✓", group: "App" },
  { label: "Audit Log", href: "/audit", icon: "🔗", group: "App" },
  { label: "Costs", href: "/costs", icon: "$", group: "App" },
  { label: "Alerts", href: "/alerts", icon: "🔔", group: "App" },
  { label: "Compliance", href: "/compliance", icon: "🛡", group: "Trust" },
  { label: "Anchoring", href: "/anchoring", icon: "⚓", group: "Trust" },
  { label: "Attestation", href: "/attestation", icon: "🪪", group: "Trust" },
  { label: "Red Team", href: "/redteam", icon: "🎯", group: "Trust" },
  { label: "Autopilot", href: "/autopilot", icon: "✦", group: "Trust" },
  { label: "Marketplace", href: "/marketplace", icon: "🛒", group: "Growth" },
  { label: "A2A", href: "/a2a", icon: "⇄", group: "Growth" },
  { label: "White-label", href: "/brand", icon: "🎨", group: "Growth" },
  { label: "MSP", href: "/msp", icon: "🏢", group: "Growth" },
  { label: "Client Billing", href: "/billing/clients", icon: "🧾", group: "Growth" },
  { label: "Scheduled Audits", href: "/audits", icon: "📅", group: "Growth" },
  { label: "Warehouse", href: "/warehouse", icon: "🗄", group: "Growth" },
  { label: "On-call", href: "/oncall", icon: "📟", group: "Growth" },
  { label: "Voice", href: "/voice", icon: "🎙", group: "Growth" },
  { label: "Packs", href: "/packs", icon: "📦", group: "More" },
  { label: "Runbooks", href: "/runbooks", icon: "📕", group: "More" },
  { label: "Baselines", href: "/baseline", icon: "📈", group: "More" },
  { label: "Benchmarks", href: "/benchmarks", icon: "📊", group: "More" },
  { label: "Collusion", href: "/collusion", icon: "🕸", group: "More" },
  { label: "Lineage", href: "/lineage", icon: "🧬", group: "More" },
  { label: "Sandbox", href: "/sandbox", icon: "📦", group: "More" },
  { label: "Token Stream", href: "/token-stream", icon: "💬", group: "More" },
  { label: "Reports", href: "/reports", icon: "📄", group: "More" },
  { label: "Content", href: "/content", icon: "✍", group: "More" },
  { label: "Support QA", href: "/support", icon: "🎧", group: "More" },
  { label: "Verify Pack", href: "/verify-pack", icon: "✅", group: "More" },
  { label: "Settings", href: "/settings/security", icon: "⚙", group: "More" },
];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ag-theme") : null;
    const initial = stored === "dark" || stored === "light" ? stored : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    const d = window.localStorage.getItem("ag-density");
    if (d) document.documentElement.setAttribute("data-density", d);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.localStorage.setItem("ag-theme", next);
  };
  return { theme, toggle };
}

export function toast(message: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("ag-toast", { detail: message }));
}

function Toasts() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      setItems((prev) => [...prev, msg]);
      window.setTimeout(() => setItems((prev) => prev.filter((m) => m !== msg)), 4000);
    };
    window.addEventListener("ag-toast", handler);
    return () => window.removeEventListener("ag-toast", handler);
  }, []);
  return (
    <div aria-live="polite" style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "grid", gap: 8 }}>
      {items.map((m, i) => (
        <div key={`${m}-${i}`} className="m3-elevation-2" style={{ background: "var(--m3-inverse-surface)", color: "var(--m3-inverse-on-surface)", padding: "12px 20px", borderRadius: "var(--m3-radius-xs)", fontSize: 14 }}>{m}</div>
      ))}
    </div>
  );
}

function CommandPalette(props: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.open) { setQ(""); window.setTimeout(() => inputRef.current?.focus(), 0); }
  }, [props.open]);
  if (!props.open) return null;
  const results = NAV.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  return (
    <div className="m3-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}>
      <div className="m3-dialog" role="dialog" aria-modal="true" aria-label="Search pages">
        <input ref={inputRef} className="m3-input" placeholder="Search pages…" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { router.push(results[0].href); props.onClose(); } if (e.key === "Escape") props.onClose(); }} />
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0 }}>
          {results.map((r) => (
            <li key={r.href}>
              <Link href={r.href} onClick={props.onClose} className="navlink" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span aria-hidden>{r.icon}</span> {r.label} <span className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)" }}>{r.group}</span>
              </Link>
            </li>
          ))}
          {results.length === 0 && <li className="m3-body-md" style={{ padding: 12 }}>No pages match “{q}”.</li>}
        </ul>
      </div>
    </div>
  );
}

export function AppShell(props: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isMarketing = pathname === "/" || pathname === "/pricing" || pathname === "/docs" || pathname.startsWith("/docs/") || pathname === "/changelog" || pathname === "/security" || pathname.startsWith("/legal") || pathname === "/login" || pathname === "/signup" || pathname === "/magic-link" || pathname === "/verify-2fa" || pathname === "/design";
  const railWidth = railCollapsed ? 72 : 220;

  const rail = (
    <nav aria-label="Primary" style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
      {["App", "Trust", "Growth", "More"].map((g) => (
        <div key={g}>
          {!railCollapsed && <p className="m3-label-md" style={{ color: "var(--m3-on-surface-variant)", textTransform: "uppercase", padding: "16px 12px 4px", margin: 0 }}>{g}</p>}
          {NAV.filter((n) => n.group === g).map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className="navlink" aria-current={active ? "page" : undefined}
                style={{ background: active ? "var(--m3-secondary-container)" : "transparent", color: active ? "var(--m3-on-secondary-container)" : "var(--m3-on-surface)", fontWeight: active ? 600 : 400, display: "flex", gap: 12, alignItems: "center" }}
                title={n.label}>
                <span aria-hidden style={{ fontSize: 18 }}>{n.icon}</span>
                {!railCollapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="m3-no-x-overflow" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* App bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--m3-surface-container)", borderBottom: "1px solid var(--m3-outline-variant)", display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", minHeight: 64 }}>
        <button type="button" className="m3-btn m3-btn-icon m3-btn-text" aria-label="Open navigation" onClick={() => setDrawerOpen(true)} style={{ display: "none" }} id="ag-drawer-btn">☰</button>
        <Link href="/" style={{ fontWeight: 800, fontSize: 20, color: "var(--m3-on-surface)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)", borderRadius: 8, padding: "4px 8px", fontSize: 16 }}>AG</span>
          {!isMarketing && <span>AgentGuard</span>}
          {isMarketing && <span>AgentGuard</span>}
        </Link>
        {!isMarketing && (
          <nav aria-label="Marketing" style={{ display: "flex", gap: 4 }}>
            <Link className="navlink" href="/pricing">Pricing</Link>
            <Link className="navlink" href="/docs">Docs</Link>
          </nav>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <button type="button" className="m3-btn m3-btn-outlined m3-btn-sm" onClick={() => setPaletteOpen(true)} aria-label="Search pages (Cmd+K)">
            <span aria-hidden>⌘K</span><span className="m3-hide-mobile"> Search</span>
          </button>
          {!isMarketing && (
            <select aria-label="Switch organization" className="m3-select" style={{ width: "auto", minHeight: 44 }}
              defaultValue="org_demo" onChange={(e) => { if (e.target.value === "msp") router.push("/msp"); else router.push(`/portal/${e.target.value}`); }}>
              <option value="org_demo">org_demo</option>
              <option value="msp">All orgs (MSP)</option>
            </select>
          )}
          <button type="button" className="m3-btn m3-btn-icon m3-btn-text" aria-label="Notifications" aria-expanded={notifOpen} onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false); }}>🔔</button>
          <button type="button" className="m3-btn m3-btn-icon m3-btn-text" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle}>{theme === "dark" ? "☀" : "◐"}</button>
          <button type="button" className="m3-btn m3-btn-icon m3-btn-text" aria-label="User menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false); }}>👤</button>
        </div>
      </header>

      {/* Notification center */}
      {notifOpen && (
        <div className="m3-card m3-elevation-3" role="region" aria-label="Notifications" style={{ position: "fixed", top: 72, right: 16, zIndex: 60, width: "min(360px, calc(100vw - 32px))" }}>
          <h3 className="m3-title-md" style={{ margin: "0 0 8px" }}>Notifications</h3>
          <p className="m3-body-md" style={{ color: "var(--m3-on-surface-variant)", margin: 0 }}>Alerts live on the Alerts page — this panel shows no separate feed.</p>
          <div style={{ marginTop: 12 }}><Link className="m3-btn m3-btn-filled m3-btn-sm" href="/alerts" onClick={() => setNotifOpen(false)}>Open Alerts</Link></div>
        </div>
      )}
      {/* User menu */}
      {menuOpen && (
        <div className="m3-card m3-elevation-3" role="menu" aria-label="User menu" style={{ position: "fixed", top: 72, right: 16, zIndex: 60, width: 240, padding: 8 }}>
          <Link className="navlink" href="/settings/team" role="menuitem">Team</Link>
          <Link className="navlink" href="/settings/security" role="menuitem">Security settings</Link>
          <Link className="navlink" href="/settings/api-keys" role="menuitem">API keys</Link>
          <Link className="navlink" href="/login" role="menuitem">Sign in</Link>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Navigation rail (desktop) */}
        {!isMarketing && (
          <aside className="ag-rail" style={{ width: railWidth, flexShrink: 0, borderRight: "1px solid var(--m3-outline-variant)", padding: "12px 8px", position: "sticky", top: 64, height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
            {rail}
            <button type="button" className="m3-btn m3-btn-text m3-btn-sm" onClick={() => setRailCollapsed((v) => !v)} style={{ marginTop: "auto" }}>
              {railCollapsed ? "→ Expand" : "← Collapse"}
            </button>
          </aside>
        )}
        {/* Drawer (mobile / deep nav) */}
        {drawerOpen && (
          <div className="m3-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
            <div className="m3-dialog" role="dialog" aria-modal="true" aria-label="Navigation" style={{ maxWidth: 320, marginRight: "auto", borderRadius: "0 var(--m3-radius-lg) var(--m3-radius-lg) 0", height: "100%", maxHeight: "100vh" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className="m3-title-lg" style={{ margin: 0 }}>Navigate</h2>
                <button type="button" className="m3-btn m3-btn-icon m3-btn-text" aria-label="Close navigation" onClick={() => setDrawerOpen(false)}>✕</button>
              </div>
              <div onClick={() => setDrawerOpen(false)}>{rail}</div>
            </div>
          </div>
        )}
        <main style={{ flex: 1, minWidth: 0, maxWidth: isMarketing ? 1200 : 1100, margin: "0 auto", padding: "24px 16px 96px", width: "100%" }}>
          {props.children}
        </main>
      </div>

      {/* Bottom navigation (mobile) */}
      {!isMarketing && (
        <nav aria-label="Bottom navigation" className="ag-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "var(--m3-surface-container)", borderTop: "1px solid var(--m3-outline-variant)", display: "none", paddingBottom: "env(safe-area-inset-bottom)" }}>
          {NAV.filter((n) => ["Overview", "Agents", "Approvals", "Audit Log", "Costs"].includes(n.label)).map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 0", minHeight: 56, color: active ? "var(--m3-primary)" : "var(--m3-on-surface-variant)", textDecoration: "none", fontSize: 11, fontWeight: active ? 600 : 400 }}>
                <span aria-hidden style={{ fontSize: 20 }}>{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
      )}

      <footer style={{ textAlign: "center", padding: "24px 16px calc(24px + env(safe-area-inset-bottom))", fontSize: 12, color: "var(--m3-on-surface-variant)", borderTop: "1px solid var(--m3-outline-variant)" }}>
        AgentGuard v1.4.0 · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/security">Security</Link> · <Link href="/docs">Docs</Link>
      </footer>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toasts />
      <style>{`
        @media (max-width: 1023px) { .ag-rail { display: none !important; } #ag-drawer-btn { display: inline-flex !important; } }
        @media (max-width: 767px) { .ag-bottom-nav { display: flex !important; } .m3-hide-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
