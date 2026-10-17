
import { z } from "zod";
import { bucketFor, queueFor, authorizeRegion, migrateOrgRegion, ApiError } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, err, reqId } from "@/lib/api";
export async function GET(req: Request) { const rid = reqId(req.headers); const region = (req.headers.get("x-region") ?? "US") as "EU" | "US"; return ok({ region, bucket: bucketFor({ region }), queue: queueFor({ region }) }, rid); }
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => null); const parsed = z.object({ orgId: z.string(), from: z.enum(["EU", "US"]), to: z.enum(["EU", "US"]), requestedRegion: z.enum(["EU", "US"]).optional(), keys: z.array(z.string()).optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid residency request", rid, 400, parsed.error.issues); if (parsed.data.requestedRegion) authorizeRegion(parsed.data.requestedRegion, parsed.data.from, parsed.data.orgId); const m = migrateOrgRegion({ orgId: parsed.data.orgId, region: parsed.data.from, keys: parsed.data.keys ?? [] }, parsed.data.to); store.appendAudit(parsed.data.orgId, m.audit.action, { from: m.audit.from, to: m.audit.to }); return ok(m, rid); } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return err("INTERNAL_ERROR", "error", rid, 500); } }
