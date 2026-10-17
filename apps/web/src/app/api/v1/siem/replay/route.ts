
import { z } from "zod";
import { siemLog, siemEndpoints } from "@/server/v11-state";
import { ok, err, reqId } from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); const body = await req.json().catch(() => null); const parsed = z.object({ endpointId: z.string(), fromTs: z.number(), events: z.array(z.object({ eventId: z.string(), payload: z.record(z.unknown()), ts: z.number() })), endpointUp: z.boolean().optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid replay", rid, 400, parsed.error.issues); const ep = siemEndpoints.get(parsed.data.endpointId); if (!ep) return err("NOT_FOUND", "SIEM endpoint not found", rid, 404); const r = siemLog.replayFrom(ep, parsed.data.fromTs, parsed.data.events, parsed.data.endpointUp ?? true); return ok(r, rid); }
