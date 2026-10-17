import { z } from "zod";
import { nextRunAfter, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { v13 } from "@/server/v13-store";
const bodySchema = z.object({ orgId: z.string(), cadence: z.enum(["weekly", "monthly"]) });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid schedule body", rid, 400, parsed.error.issues);
    const schedule = { id: `sched-${v13.schedules.length + 1}`, orgId: parsed.data.orgId, cadence: parsed.data.cadence, nextRunAt: nextRunAfter(parsed.data.cadence, Date.now()), enabled: true };
    v13.schedules.push(schedule);
    return ok({ schedule }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
