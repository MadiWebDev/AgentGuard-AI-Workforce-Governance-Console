
import { z } from "zod";
import { detectCollusion } from "@agentguard/shared";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ traces: z.array(z.object({ traceId: z.string(), agentId: z.string(), action: z.string(), tool: z.string().optional(), sessionId: z.string().optional(), exfilId: z.string().optional(), at: z.string().optional(), metadata: z.record(z.unknown()).optional() }).passthrough()).max(100000), autoQuarantine: z.boolean().optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid collusion request", rid, 400, parsed.error.issues); return ok(detectCollusion(parsed.data.traces as never, { autoQuarantine: parsed.data.autoQuarantine }), rid); } catch (e) { return serverError(rid, e); } }
