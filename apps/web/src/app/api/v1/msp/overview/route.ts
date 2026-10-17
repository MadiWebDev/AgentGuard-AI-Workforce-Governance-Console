import { canAccess, computeHealthScore, rollupAlerts, type DelegatedAdmin, type Msp } from "@agentguard/shared";
import { ok, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
function mspFromHeaders(req: Request): { msp: Msp; admin: DelegatedAdmin } {
  const mspId = req.headers.get("x-msp-id") ?? "msp-1";
  const clientOrgIds = [...store.orgs.keys()];
  const msp: Msp = { id: mspId, name: "Agency", clientOrgIds };
  const admin: DelegatedAdmin = { userId: req.headers.get("x-user-id") ?? "msp-admin", orgId: req.headers.get("x-org-id") ?? "msp-org", mspId: req.headers.get("x-role") === "msp" ? mspId : undefined, scopes: ["clients:read"] };
  return { msp, admin };
}
function orgStats(orgId: string) {
  const rows = store.audit.filter((r) => r.orgId === orgId);
  const alerts = rows.filter((r) => r.action.startsWith("alert.")).length;
  const incidents = rows.filter((r) => r.action.includes("incident")).length;
  return { orgId, alerts, incidents, compliance: 1 };
}
export async function GET(req: Request) {
  const rid = reqId(req.headers);
  try {
    const { msp, admin } = mspFromHeaders(req);
    const visible = msp.clientOrgIds.filter((o) => canAccess(admin, msp, o));
    const clients = visible.map((oid) => ({ ...orgStats(oid), healthScore: computeHealthScore(orgStats(oid)) }));
    const rollup = rollupAlerts(visible, store.audit.filter((r) => r.action.startsWith("alert.")).map((r) => ({ orgId: r.orgId, id: r.id, severity: "low" as const, message: r.action, at: r.createdAt })));
    return ok({ mspId: msp.id, clients, rollup }, rid);
  } catch (e) { return serverError(rid, e); }
}
