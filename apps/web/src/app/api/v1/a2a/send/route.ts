import { z } from "zod";
import { checkA2AMessage, attributeCost, createA2AAuditRecord, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
const policySchema = z.object({ fromAgent: z.string(), toAgent: z.string(), action: z.enum(["allow", "deny", "require_approval"]), contentGuards: z.array(z.string()), conditions: z.array(z.string()).optional() }).optional();
const bodySchema = z.object({ traceId: z.string(), fromAgent: z.string(), toAgent: z.string(), payload: z.string(), costUsd: z.number().optional(), policy: policySchema, chainWeights: z.array(z.object({ agentId: z.string(), weight: z.number() })).optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid A2A body", rid, 400, parsed.error.issues);
    const { traceId, fromAgent, toAgent, payload, costUsd = 0, policy, chainWeights } = parsed.data;
    const check = checkA2AMessage(policy as never, { traceId, fromAgent, toAgent, payload, costUsd });
    const delivered = check.allowed;
    const totalCents = Math.round(costUsd * 100);
    const attribution = chainWeights ? attributeCost(chainWeights, totalCents) : { perAgentCents: { [fromAgent]: totalCents }, totalCents };
    const record = createA2AAuditRecord(traceId, [{ fromAgent, toAgent, allowed: delivered, matchedRule: check.matchedRule, conditions: check.conditions }], totalCents, attribution.perAgentCents);
    if (delivered) store.appendAudit("org_demo", "a2a.message.delivered", { traceId, fromAgent, toAgent, matchedRule: check.matchedRule });
    else store.appendAudit("org_demo", "a2a.message.blocked", { traceId, fromAgent, toAgent, matchedRule: check.matchedRule, guardHit: check.guardHit });
    return ok({ check, delivered, audit: record }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
