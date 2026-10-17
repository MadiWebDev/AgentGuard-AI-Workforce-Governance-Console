import { newRequestId } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, actorFromHeaders } from "@/lib/api";
export async function GET(req: Request){ const rid=req.headers.get("x-request-id")??newRequestId(); const a=actorFromHeaders(req.headers); const v=store.verifyAudit(a.orgId); return ok({ verified: v.ok, firstBrokenId: v.firstBrokenId ?? null, checkedAt: new Date().toISOString(), rows: store.audit.filter(r=>r.orgId===a.orgId).length }, rid); }
