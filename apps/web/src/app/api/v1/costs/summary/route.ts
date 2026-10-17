import { newRequestId } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, actorFromHeaders } from "@/lib/api";
export async function GET(req: Request){ const rid=req.headers.get("x-request-id")??newRequestId(); const a=actorFromHeaders(req.headers); const evs=store.events.filter(e=>e.orgId===a.orgId); const totalCost=evs.reduce((s,e)=>s+Number((e as Record<string,unknown>).costUsd ?? 0),0); return ok({ totalCost, events: evs.length, byAgent: {}, byModel: {}, period: "all" }, rid); }
