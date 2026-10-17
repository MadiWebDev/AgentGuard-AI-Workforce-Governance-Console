
import { siemLog } from "@/server/v11-state";
import { ok, reqId } from "@/lib/api";
export async function GET(req: Request) { const rid = reqId(req.headers); return ok({ deliveries: siemLog.list().map(r => ({ id: r.delivery.id, eventId: r.delivery.eventId, status: r.status, attempts: r.attempts })) }, rid); }
