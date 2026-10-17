import { z } from "zod";
import { validateBatch, processBatch, authorize, ApiError, newRequestId, RateLimiter } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, err, serverError, rateLimited } from "@/lib/api";
const ingestLimiter = new RateLimiter(60, 60_000); // 60 ingest batches/min per key (in-memory fallback; production MUST set Upstash vars for a shared limiter — see RUNBOOK)
const EventSchema = z.object({ traceId: z.string(), agentId: z.string(), type: z.string(), input: z.unknown().optional(), output: z.unknown().optional(), model: z.string().optional(), tokensIn: z.number().optional(), tokensOut: z.number().optional(), cachedTokens: z.number().optional(), costUsd: z.number().optional(), idempotencyKey: z.string().optional(), metadata: z.record(z.unknown()).optional() });
export async function POST(req: Request){
  const rid = req.headers.get("x-request-id") ?? newRequestId();
  try {
    const apiKey = req.headers.get("x-api-key") ?? ""; const rec = apiKey ? store.findKey(apiKey) : undefined;
    if (apiKey && !rec) return err("UNAUTHORIZED", "Invalid API key", rid, 401);
    const rlKey = apiKey || req.headers.get("x-forwarded-for") || "anon";
    const rl = ingestLimiter.check(`ingest:${rlKey}`);
    if (!rl.allowed) return rateLimited(rid, rl.retryAfterSec);
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > 1024 * 1024) return err("PAYLOAD_TOO_LARGE", "Ingest batch exceeds 1MB", rid, 413);
    const orgId = rec?.orgId ?? req.headers.get("x-org-id") ?? "org_demo";
    const body = await req.json().catch(()=>null);
    const parsed = z.object({ events: z.array(EventSchema) }).safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid batch", rid, 400, parsed.error.issues);
    const v = validateBatch(parsed.data.events as unknown as never); if (!v.valid) return err("VALIDATION_ERROR", v.errors.join("; "), rid, 400, v.errors);
    // idempotency dedupe against store
    const fresh = (parsed.data.events as Array<Record<string, unknown>>).filter(e=>{ const k = e.idempotencyKey as string|undefined; if (k && store.seenIdempotency.has(`${orgId}:${k}`)) return false; if (k) store.seenIdempotency.add(`${orgId}:${k}`); return true; });
    const processed = processBatch(fresh as never);
    for (const e of processed) store.events.push({ ...e, orgId, storedAt: new Date().toISOString() } as Record<string, unknown>);
    store.appendAudit(orgId, "event.ingested", { count: processed.length });
    return ok({ accepted: processed.length, redacted: processed.reduce((s,e)=>s+(e.redactionCount??0),0) }, rid, 202);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
