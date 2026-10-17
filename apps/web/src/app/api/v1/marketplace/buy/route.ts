import { z } from "zod";
import { buyGovern, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
const bodySchema = z.object({ listing: z.object({ id: z.string(), agentId: z.string(), orgId: z.string(), name: z.string(), version: z.string(), trustScore: z.number(), verifiedGovernance: z.boolean(), status: z.string(), lastScoredAt: z.string(), versionHistory: z.array(z.object({ version: z.string(), trustScore: z.number(), at: z.string() })) }), buyerOrgId: z.string() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid buy body", rid, 400, parsed.error.issues);
    const entry = buyGovern(parsed.data.listing as never, parsed.data.buyerOrgId);
    store.agents.set(entry.agentId, { id: entry.agentId, orgId: entry.buyerOrgId, name: parsed.data.listing.name, environment: "prod", tags: ["marketplace"], riskTier: "medium", status: "active", failMode: "fail-closed", createdAt: new Date().toISOString() });
    store.appendAudit(entry.buyerOrgId, entry.auditAction, { agentId: entry.agentId, sellerOrgId: entry.sellerOrgId, trustScore: entry.trustScoreAtOnboarding });
    return ok({ entry }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
