"use client";
import { useState } from "react";
import { PageHeader, Card, Chip } from "@/components/m3";

export default function Page() {
  const [orgId, setOrgId] = useState("org_demo");
  const [orgName, setOrgName] = useState("Demo Client");
  const [logoUrl, setLogoUrl] = useState("https://example.com/logo.png");
  const [primary, setPrimary] = useState("#4f46e5");
  const [secondary, setSecondary] = useState("#0e7490");
  const [domain, setDomain] = useState("");
  const [emailFrom, setEmailFrom] = useState("noreply@example.com");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch(`/api/v1/brand/${orgId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, logoUrl, primaryColor: primary, secondaryColor: secondary, domain: domain || undefined, emailFrom }),
      });
      const json = await res.json();
      setResult(json.error ? `Save failed: ${json.error.message}` : "Brand saved — rendered output is leak-checked (no AgentGuard branding).");
    } catch { setResult("Save failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="White-Label Console" description="Per-org rebrand: logo, colors, custom domain, branded emails, and a client portal scoped to one org. Rendered branded output is leak-checked — it never contains AgentGuard branding."
        crumbs={[{ label: "Home", href: "/" }, { label: "White-label" }]} />
      <Card title="Brand settings" subtitle="Colors must be #rrggbb; logo must be an http(s) URL; custom domains must be public hostnames with a TLD.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <div><label className="m3-label" htmlFor="brand-org">Org ID</label><input id="brand-org" className="m3-input" value={orgId} onChange={(e) => setOrgId(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="brand-name">Org display name</label><input id="brand-name" className="m3-input" value={orgName} onChange={(e) => setOrgName(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="brand-logo">Logo URL</label><input id="brand-logo" className="m3-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="brand-primary">Primary color</label><input id="brand-primary" className="m3-input" value={primary} onChange={(e) => setPrimary(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="brand-secondary">Secondary color</label><input id="brand-secondary" className="m3-input" value={secondary} onChange={(e) => setSecondary(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="brand-domain">Custom domain (optional)</label><input id="brand-domain" className="m3-input" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="console.client.com" /></div>
          <div><label className="m3-label" htmlFor="brand-email">Email From</label><input id="brand-email" className="m3-input" value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save brand"}</button>
          <Chip tone="primary">Preview: {orgName}</Chip>
          <span aria-hidden style={{ background: primary, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>Primary</span>
          <span aria-hidden style={{ background: secondary, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>Secondary</span>
        </div>
        {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
        <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 12 }}>Custom-domain TLS: point a DNS CNAME at the console host, verify ownership via TXT record, then provision a certificate (Vercel automatic certs / ACME). See RUNBOOK.</p>
      </Card>
    </div>
  );
}
