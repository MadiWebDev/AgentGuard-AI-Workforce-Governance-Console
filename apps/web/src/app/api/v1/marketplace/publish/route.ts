import { z } from "zod";
import { publishListing, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
const historySchema = z.object({ incidents: z.number(), violations: z.number(), approvalCompliance: z.number(), uptime: z.number(), totalActions: z.number(), chainVerified: z.boolean() });
const bodySchema = z.object({ agent: z.object({ id: z.string(), orgId: z.string(), name: z.string(), version: z.string() }), history: historySchema, threshold: z.number().optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid publish body", rid, 400, parsed.error.issues);
    const listing = publishListing(parsed.data.agent, parsed.data.history, { threshold: parsed.data.threshold });
    return ok({ listing }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
