
import { z } from "zod";
import { inspectStream } from "@agentguard/shared";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ tokens: z.array(z.string()).max(10000), windowTokens: z.number().int().min(1).max(500).optional(), guardPolicies: z.array(z.object({ id: z.string(), pattern: z.string() })).max(50) }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid stream-inspect request", rid, 400, parsed.error.issues); const res = inspectStream(parsed.data.tokens, { windowTokens: parsed.data.windowTokens, guardPolicies: parsed.data.guardPolicies }); return ok(res, rid); } catch (e) { return serverError(rid, e); } }
