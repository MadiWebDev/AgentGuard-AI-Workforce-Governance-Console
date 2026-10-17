import { z } from "zod";
import { isSlaBreached, createOnCallIncident, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
import { v13 } from "@/server/v13-store";
const bodySchema = z.object({ approval: z.object({ id: z.string(), orgId: z.string(), agentId: z.string(), action: z.string(), riskTier: z.string(), createdAt: z.string(), slaMinutes: z.number() }), approverId: z.string() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    if (process.env.NODE_ENV === "production") return err("ONCALL_MOCK_FORBIDDEN", "MockOnCall is dev/test-only. Configure PagerDuty (PAGERDUTY_API_KEY) or Opsgenie (OPSGENIE_API_KEY) for production.", rid, 503);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid incident body", rid, 400, parsed.error.issues);
    if (!isSlaBreached(parsed.data.approval)) return err("SLA_NOT_BREACHED", "Approval has not breached its SLA", rid, 400);
    const { incident, auditAction } = await createOnCallIncident(v13.oncall, parsed.data.approval, parsed.data.approverId);
    store.appendAudit(parsed.data.approval.orgId, auditAction, { incidentId: incident.id, approvalId: parsed.data.approval.id });
    return ok({ incident }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
