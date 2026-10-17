import { verifyBadge } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { v13 } from "@/server/v13-store";
/** Public badge verification — no auth. Verifies a signed badge payload passed as query params. */
export async function GET(req: Request) {
  const rid = reqId(req.headers);
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("orgId");
    const agentId = url.searchParams.get("agentId");
    const trustScore = url.searchParams.get("trustScore");
    const issuedAt = url.searchParams.get("issuedAt");
    const signature = url.searchParams.get("signature");
    const publicKey = url.searchParams.get("publicKey");
    if (!orgId || !agentId || !trustScore || !issuedAt || !signature || !publicKey) {
      return err("BADGE_INCOMPLETE", "Badge verification requires orgId, agentId, trustScore, issuedAt, signature, publicKey query params", rid, 400);
    }
    const result = verifyBadge({ payload: { orgId, agentId, trustScore: Number(trustScore), issuedAt }, signature, publicKey }, v13.revokedOrgs);
    return ok({ valid: result.valid, reason: result.reason, orgId, agentId }, rid);
  } catch (e) { return serverError(rid, e); }
}
