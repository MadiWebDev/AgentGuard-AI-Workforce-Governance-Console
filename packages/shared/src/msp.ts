
import { ApiError } from "./errors";

/**
 * C4 — MSP multi-org console.
 * Agencies manage many client orgs from one pane. Access is enforced in
 * the accessor (canAccess), not just the UI: a client admin of org A
 * cannot read org B data even when calling the accessor directly.
 */
export interface Msp {
  id: string;
  name: string;
  clientOrgIds: string[];
}
export interface DelegatedAdmin {
  userId: string;
  orgId: string; // org this admin belongs to; "msp" scope uses mspId instead
  mspId?: string;
  scopes: string[]; // e.g. ["clients:read", "alerts:read"]
}
export interface ClientOrgStats {
  orgId: string;
  alerts: number;
  incidents: number;
  compliance: number; // 0..1 fraction of controls passing
}

/** MSP admins see all assigned clients; a client admin sees only their own org. */
export function canAccess(admin: DelegatedAdmin, msp: Msp, orgId: string): boolean {
  if (admin.mspId === msp.id && msp.clientOrgIds.includes(orgId)) return true;
  return admin.orgId === orgId;
}

/** Enforced accessor: throws FORBIDDEN for unassigned orgs. Every MSP read path must go through this. */
export function requireAccess<T>(admin: DelegatedAdmin, msp: Msp, orgId: string, data: T): T {
  if (!canAccess(admin, msp, orgId)) throw new ApiError("FORBIDDEN", 403, "Admin is not assigned to this client org");
  return data;
}

export function computeHealthScore(org: ClientOrgStats): number {
  if (org.compliance < 0 || org.compliance > 1) throw new ApiError("INVALID_STATS", 400, "compliance must be 0..1");
  const raw = org.compliance * 60 + 40 - Math.min(25, org.alerts * 2) - Math.min(15, org.incidents * 3);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export interface Alert { orgId: string; id: string; severity: "low" | "medium" | "high" | "critical"; message: string; at: string }

/** Cross-org alert rollup for the MSP pane: counts + latest critical per org. */
export function rollupAlerts(orgs: string[], alerts: Alert[]): { orgId: string; total: number; critical: number; latestAt: string | null }[] {
  return orgs.map((orgId) => {
    const mine = alerts.filter((a) => a.orgId === orgId);
    return {
      orgId,
      total: mine.length,
      critical: mine.filter((a) => a.severity === "critical").length,
      latestAt: mine.length ? mine.map((a) => a.at).sort().at(-1)! : null,
    };
  });
}

/** Nightly recompute: pure function over current stats — same inputs, same scores; changed inputs change scores. */
export function recomputeHealthScores(orgs: ClientOrgStats[]): { orgId: string; healthScore: number; computedAt: string }[] {
  const now = new Date().toISOString();
  return orgs.map((o) => ({ orgId: o.orgId, healthScore: computeHealthScore(o), computedAt: now }));
}
