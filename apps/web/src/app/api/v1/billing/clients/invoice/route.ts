import { z } from "zod";
import { meteredUsage, generateInvoice, marginReport, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
const bodySchema = z.object({ clientOrgId: z.string(), clientName: z.string(), period: z.string(), eventCount: z.number().int().min(0), rateCentsPerEvent: z.number().int().min(0), taxRateBps: z.number().int().min(0).max(10000).optional(), clientRevenueCents: z.number().int().min(0).optional(), agentGuardCostCents: z.number().int().min(0).optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid invoice body", rid, 400, parsed.error.issues);
    const { clientOrgId, clientName, period, eventCount, rateCentsPerEvent, taxRateBps = 0 } = parsed.data;
    const events = Array.from({ length: eventCount }, (_, i) => ({ clientOrgId, type: "tool_call", at: new Date().toISOString() + String(i) }));
    const usage = meteredUsage(events, rateCentsPerEvent);
    const invoice = generateInvoice({ orgId: clientOrgId, name: clientName }, period, usage, rateCentsPerEvent, taxRateBps);
    store.appendAudit(clientOrgId, invoice.auditAction, { invoiceId: invoice.id, totalCents: invoice.totalCents });
    const margin = parsed.data.clientRevenueCents !== undefined && parsed.data.agentGuardCostCents !== undefined
      ? marginReport(parsed.data.clientRevenueCents, parsed.data.agentGuardCostCents) : null;
    const { pdfBytes, ...rest } = invoice;
    return ok({ invoice: { ...rest, pdfBase64: Buffer.from(pdfBytes).toString("base64") }, margin }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
