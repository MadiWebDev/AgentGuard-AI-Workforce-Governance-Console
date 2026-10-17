
import { z } from "zod";
import { sendPush } from "@agentguard/shared";
import { pushStore } from "@/server/v11-state";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); if (process.env.NODE_ENV === "production" && process.env.PUSH_MODE !== "webpush") return err("PUSH_NOT_CONFIGURED", "Web Push is not configured in production; notifications fall back to email.", rid, 503); try { const body = await req.json().catch(() => null); const parsed = z.object({ userId: z.string(), endpoint: z.string().url(), payload: z.record(z.unknown()).optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid push subscription", rid, 400, parsed.error.issues); const sub = pushStore.subscribe(parsed.data.userId, parsed.data.endpoint); const result = sendPush(pushStore, sub.id, parsed.data.payload ?? { title: "AgentGuard approval needed" }, { mock: true }); return ok({ subscription: sub, push: result }, rid, 201); } catch (e) { return serverError(rid, e); } }
