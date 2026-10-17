
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { siemEndpoints } from "@/server/v11-state";
import { ok, err, reqId } from "@/lib/api";
export async function GET(req: Request) { const rid = reqId(req.headers); return ok({ endpoints: [...siemEndpoints.values()].map(e => ({ id: e.id, orgId: e.orgId, profile: e.profile, url: e.url })) }, rid); }
export async function POST(req: Request) { const rid = reqId(req.headers); const body = await req.json().catch(() => null); const parsed = z.object({ profile: z.enum(["generic_https", "splunk_hec", "datadog"]), url: z.string().url(), secret: z.string().min(1) }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid SIEM endpoint", rid, 400, parsed.error.issues); const ep = { id: randomUUID(), orgId: "org_demo", ...parsed.data }; siemEndpoints.set(ep.id, ep); return ok({ id: ep.id, profile: ep.profile, url: ep.url }, rid, 201); }
