import { z } from "zod";
import { evaluatePolicy, authorize, ApiError, newRequestId, RateLimiter } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, err, actorFromHeaders, serverError, rateLimited } from "@/lib/api";
const policyCheckLimiter = new RateLimiter(300, 60_000); // 300 policy checks/min per key (in-memory fallback; production MUST set Upstash vars)
export async function POST(req: Request){
  const rid = req.headers.get("x-request-id") ?? newRequestId();
  try {
    const apiKey = req.headers.get("x-api-key") ?? ""; let orgId = req.headers.get("x-org-id") ?? "org_demo";
    const pc = policyCheckLimiter.check(`policy:${apiKey || req.headers.get("x-forwarded-for") || "anon"}`);
    if (!pc.allowed) return rateLimited(rid, pc.retryAfterSec);
    if (apiKey) { const rec = store.findKey(apiKey); if (!rec) return err("UNAUTHORIZED","Invalid API key",rid,401); if (!rec.scopes.includes("policy:check") && !rec.scopes.includes("ingest")) { /* allow if policy scope missing? enforce */ if (!rec.scopes.includes("policy:check")) return err("FORBIDDEN","Key lacks policy:check scope",rid,403); } orgId = rec.orgId; const agentId = rec.agentId; const agent = store.agents.get(agentId); if (agent && agent.status!=="active") return ok({ decision:"deny", reason:`Agent ${agent.status}`, matched_rule_ids:[] }, rid); }
    const body = await req.json().catch(()=>null);
    const parsed = z.object({ tool: z.string().optional(), action: z.string().optional(), cost: z.number().optional(), environment: z.string().optional(), riskTier: z.string().optional(), arguments: z.record(z.unknown()).optional(), agentId: z.string().optional() }).safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR","Invalid policy check",rid,400,parsed.error.issues);
    const actor = actorFromHeaders(req.headers); try { authorize({ userId: actor.userId, orgId, role: actor.role as never }, "policy:check", { orgId }); } catch {}
    // kill switch: if agent paused/quarantined -> deny
    if (parsed.data.agentId) { const a = store.agents.get(parsed.data.agentId); if (a && a.status!=="active") return ok({ decision:"deny", reason:`Agent ${a.status}`, matched_rule_ids:[] }, rid); }
    const rules = [...store.policies.values()].filter(p=>p.orgId===orgId && p.status==="active").flatMap(p=>p.rules);
    const t0 = Date.now(); const dec = evaluatePolicy(rules, { tool: parsed.data.tool ?? parsed.data.action, cost: parsed.data.cost, environment: parsed.data.environment, riskTier: parsed.data.riskTier, args: parsed.data.arguments });
    const latency = Date.now()-t0; void latency;
    store.appendAudit(orgId, "policy.checked", { tool: parsed.data.tool, decision: dec.decision });
    return ok(dec, rid);
  } catch(e){ if(e instanceof ApiError) return err(e.code,e.message,rid,e.status); return serverError(rid, e); }
}
