"use client";
import { useState } from "react";
import { PageHeader, Card, ProgressRing } from "@/components/m3";

export default function Page() {
  const [clientOrgId, setClientOrgId] = useState("org-client-1");
  const [clientName, setClientName] = useState("Client One");
  const [period, setPeriod] = useState("2026-10");
  const [eventCount, setEventCount] = useState(1000);
  const [rate, setRate] = useState(2);
  const [result, setResult] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invoice() {
    setBusy(true); setResult(null); setPdfUrl(null);
    try {
      const res = await fetch("/api/v1/billing/clients/invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientOrgId, clientName, period, eventCount, rateCentsPerEvent: rate, taxRateBps: 0, clientRevenueCents: eventCount * rate * 2, agentGuardCostCents: eventCount * rate }),
      });
      const json = await res.json();
      if (json.error) { setResult(`Invoice failed: ${json.error.message}`); return; }
      const inv = json.data?.invoice;
      setResult(`Invoice ${inv?.id ?? ""}: subtotal ${inv?.subtotalCents}¢, total ${inv?.totalCents}¢. Margin: ${JSON.stringify(json.data?.margin ?? {})}. Audit-logged.`);
      if (inv?.pdfBase64) setPdfUrl(`data:application/pdf;base64,${inv.pdfBase64}`);
    } catch { setResult("Invoice failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Client Billing" description="Agencies invoice clients for governed usage: per-client metering, invoice generation with a real PDF, Paddle or manual collection, and margin reports (client revenue vs AgentGuard cost) that reconcile to the penny in integer cents. Every invoice is audit-logged."
        crumbs={[{ label: "Home", href: "/" }, { label: "Client Billing" }]} />
      <div style={{ display: "grid", gap: 16 }}>
        <Card title="Plan card" subtitle="Agency billing is separate from your own AgentGuard subscription (Settings → Billing).">
          <ProgressRing percent={0} label="Usage this period — generate an invoice to see metering" />
        </Card>
        <Card title="Generate invoice" subtitle="All money is integer cents; tax via integer basis points, rounded once.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
            <div><label className="m3-label" htmlFor="bill-org">Client org ID</label><input id="bill-org" className="m3-input" value={clientOrgId} onChange={(e) => setClientOrgId(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="bill-name">Client name</label><input id="bill-name" className="m3-input" value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="bill-period">Period</label><input id="bill-period" className="m3-input" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
            <div><label className="m3-label" htmlFor="bill-events">Event count</label><input id="bill-events" className="m3-input" type="number" min={0} value={eventCount} onChange={(e) => setEventCount(Number(e.target.value))} /></div>
            <div><label className="m3-label" htmlFor="bill-rate">Rate (cents / event)</label><input id="bill-rate" className="m3-input" type="number" min={0} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
          </div>
          <button type="button" className="m3-btn m3-btn-filled" style={{ marginTop: 16 }} onClick={invoice} disabled={busy}>{busy ? "Generating…" : "Generate invoice"}</button>
          {result && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{result}</p>}
          {pdfUrl && <p className="m3-body-md"><a href={pdfUrl} download="invoice.pdf">Download invoice PDF</a></p>}
        </Card>
        <Card title="Invoices" subtitle="Every generated invoice is audit-logged and appears in the audit trail.">
          <p className="m3-body-md" style={{ margin: 0 }}>Invoices table: use the generator above; past invoices are found in the audit log under the client org.</p>
        </Card>
      </div>
    </div>
  );
}
