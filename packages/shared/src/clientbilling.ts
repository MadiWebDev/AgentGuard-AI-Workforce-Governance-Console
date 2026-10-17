
import { ApiError } from "./errors";

/**
 * C5 — Client billing through AgentGuard.
 * ALL money is integer cents internally so invoices and margins reconcile
 * to the penny: total = sum(lines), margin = revenue - cost, exactly.
 * PDF invoices use a small hand-rolled, valid PDF writer (no heavy dep).
 */
export interface UsageEvent { clientOrgId: string; type: string; at: string }
export interface MeteredUsage { events: number; costCents: number }

export function meteredUsage(events: UsageEvent[], rateCentsPerEvent: number): MeteredUsage {
  if (!Number.isInteger(rateCentsPerEvent) || rateCentsPerEvent < 0) throw new ApiError("INVALID_RATE", 400, "rateCentsPerEvent must be a non-negative integer");
  return { events: events.length, costCents: events.length * rateCentsPerEvent };
}

export interface InvoiceLine { description: string; quantity: number; unitCents: number; lineTotalCents: number }
export interface Invoice {
  id: string;
  clientOrgId: string;
  period: string;
  lines: InvoiceLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number; // basis points, e.g. 1000 = 10%
  pdfBytes: Uint8Array;
  auditAction: string;
}

function escapePdfText(s: string): string { return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }

/** Minimal valid PDF 1.4 writer: one page, text lines. Output starts with %PDF and parses as a real PDF. */
export function renderInvoicePdf(lines: string[]): Uint8Array {
  const textOps = lines.map((l, i) => `BT /F1 12 Tf 72 ${720 - i * 18} Td (${escapePdfText(l)}) Tj ET`).join("\n");
  const content = `BT /F1 12 Tf 72 760 Td (AgentGuard Invoice) Tj ET\n${textOps}`;
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>`);
  objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function generateInvoice(
  client: { orgId: string; name: string },
  period: string,
  usage: MeteredUsage,
  rateCentsPerEvent: number,
  taxRateBps = 0,
  opts?: { now?: string },
): Invoice {
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) throw new ApiError("INVALID_TAX", 400, "taxRateBps must be an integer 0..10000");
  const lines: InvoiceLine[] = [{
    description: `Governed usage — ${usage.events} events @ $${(rateCentsPerEvent / 100).toFixed(2)}/event`,
    quantity: usage.events,
    unitCents: rateCentsPerEvent,
    lineTotalCents: usage.costCents,
  }];
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
  const taxCents = Math.round((subtotalCents * taxRateBps) / 10000);
  const totalCents = subtotalCents + taxCents;
  const now = opts?.now ?? new Date().toISOString();
  const pdfLines = [
    `Invoice for ${client.name} (${client.orgId})`,
    `Period: ${period}`,
    `Issued: ${now}`,
    `Events: ${usage.events}`,
    `Subtotal: $${(subtotalCents / 100).toFixed(2)}`,
    `Tax: $${(taxCents / 100).toFixed(2)}`,
    `Total: $${(totalCents / 100).toFixed(2)}`,
  ];
  return {
    id: `inv-${client.orgId}-${period}`,
    clientOrgId: client.orgId,
    period,
    lines,
    subtotalCents,
    taxCents,
    totalCents,
    taxRateBps,
    pdfBytes: renderInvoicePdf(pdfLines),
    auditAction: "billing.invoice.generated",
  };
}

/** Margin report: margin = revenue - cost, in integer cents. Reconciles exactly. */
export function marginReport(clientRevenueCents: number, agentGuardCostCents: number): { revenueCents: number; costCents: number; marginCents: number; marginPct: number } {
  if (!Number.isInteger(clientRevenueCents) || !Number.isInteger(agentGuardCostCents) || clientRevenueCents < 0 || agentGuardCostCents < 0) {
    throw new ApiError("INVALID_MONEY", 400, "Revenue and cost must be non-negative integer cents");
  }
  const marginCents = clientRevenueCents - agentGuardCostCents;
  return { revenueCents: clientRevenueCents, costCents: agentGuardCostCents, marginCents, marginPct: clientRevenueCents === 0 ? 0 : (marginCents / clientRevenueCents) * 100 };
}
