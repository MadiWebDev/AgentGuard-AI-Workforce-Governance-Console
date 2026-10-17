import { z } from "zod";
import { resolveOnCallIncident, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
import { v13 } from "@/server/v13-store";
const bodySchema = z.object({ incidentId: z.string(), decision: z.enum(["approved", "denied"]), orgId: z.string().optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    if (process.env.NODE_ENV === "production") return err("ONCALL_MOCK_FORBIDDEN", "MockOnCall is dev/test-only. Configure PagerDuty or Opsgenie for production.", rid, 503);
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid resolve body", rid, 400, parsed.error.issues);
    const { incident, auditAction } = await resolveOnCallIncident(v13.oncall, parsed.data.incidentId, parsed.data.decision);
    store.appendAudit(parsed.data.orgId ?? "org_demo", auditAction, { incidentId: incident.id, decision: parsed.data.decision });
    return ok({ incident }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
