import { z } from "zod";
import { runDueSchedules, ConsoleDeliveryAdapter, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
import { v13 } from "@/server/v13-store";
const bodySchema = z.object({ nowMs: z.number().optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid run-due body", rid, 400, parsed.error.issues);
    const deps = { killSwitchDenies: () => store.killSwitchDenies(), chainVerifies: () => store.verifyAudit("org_demo").ok, checkpointBackedUp: () => store.hasCheckpoint(), redactionClean: () => store.redactionProbeClean() };
    const { ran, schedules } = await runDueSchedules(v13.schedules, parsed.data.nowMs ?? Date.now(), deps, [new ConsoleDeliveryAdapter()]);
    v13.schedules = schedules;
    for (const r of ran) store.appendAudit(r.orgId, r.auditAction, { packId: r.packId, findings: r.findings.length, deliveries: r.deliveries.length });
    return ok({ ran: ran.map((r) => ({ scheduleId: r.scheduleId, orgId: r.orgId, packId: r.packId, findings: r.findings, deliveries: r.deliveries })) }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
