import { canAccess, recomputeHealthScores, type DelegatedAdmin, type Msp } from "@agentguard/shared";
import { ok, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
export async function GET(req: Request) {
  const rid = reqId(req.headers);
  try {
    const mspId = req.headers.get("x-msp-id") ?? "msp-1";
    const clientOrgIds = [...store.orgs.keys()];
    const msp: Msp = { id: mspId, name: "Agency", clientOrgIds };
    const admin: DelegatedAdmin = { userId: req.headers.get("x-user-id") ?? "msp-admin", orgId: req.headers.get("x-org-id") ?? "msp-org", mspId: req.headers.get("x-role") === "msp" ? mspId : undefined, scopes: ["clients:read"] };
    const visible = clientOrgIds.filter((o) => canAccess(admin, msp, o));
    const stats = visible.map((orgId) => {
      const rows = store.audit.filter((r) => r.orgId === orgId);
      return { orgId, alerts: rows.filter((r) => r.action.startsWith("alert.")).length, incidents: rows.filter((r) => r.action.includes("incident")).length, compliance: 1 };
    });
    return ok({ mspId, clients: recomputeHealthScores(stats) }, rid);
  } catch (e) { return serverError(rid, e); }
}
