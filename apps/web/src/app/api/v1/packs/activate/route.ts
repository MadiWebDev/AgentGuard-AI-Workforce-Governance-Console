
import { z } from "zod";
import { activatePackDraft } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => null); const parsed = z.object({ policy: z.object({ id: z.string(), orgId: z.string(), name: z.string(), version: z.number(), status: z.literal("draft"), rules: z.array(z.object({ id: z.string(), action: z.enum(["allow", "deny", "require_approval", "rate_limit", "spend_cap", "content_guard"]), priority: z.number() }).passthrough()), changeNote: z.string(), createdAt: z.string() }), actorId: z.string().optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid activation", rid, 400, parsed.error.issues); const r = activatePackDraft(parsed.data.policy as never, parsed.data.actorId ?? "owner-1"); store.policies.set(r.policy.id, r.policy as never); store.appendAudit(r.policy.orgId, r.audit.action, { policyId: r.policy.id }); return ok(r.policy, rid); } catch (e) { return serverError(rid, e); } }
