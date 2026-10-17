
import type { PlanLimits } from "./plans";

/** Data lifecycle: retention enforcement, GDPR export shape, org deletion with grace. Pure + testable. Live deletion of rows is a DB operation owned by the deployer (see RUNBOOK); these functions define the contract, they do not fabricate a live pipeline. */
export function retentionCutoffDays(plan: PlanLimits): number { return plan.retentionDays; }
export function retentionCutoffIso(plan: PlanLimits, now = new Date()): string {
  return new Date(now.getTime() - plan.retentionDays * 24 * 60 * 60 * 1000).toISOString();
}
/** Returns the ids of events older than the plan retention cutoff. Callers delete exactly these rows. */
export function expiredEventIds(events: Array<{ id: string; createdAt: string }>, plan: PlanLimits, now = new Date()): string[] {
  const cutoff = new Date(now.getTime() - plan.retentionDays * 24 * 60 * 60 * 1000).getTime();
  return events.filter((e) => new Date(e.createdAt).getTime() < cutoff).map((e) => e.id);
}
export interface DeletionRequest { orgId: string; requestedAt: string; graceEndsAt: string; status: "pending_grace" | "deleted"; graceDays: number; }
export const ORG_DELETION_GRACE_DAYS = 30;
export function requestOrgDeletion(orgId: string, now = new Date(), graceDays = ORG_DELETION_GRACE_DAYS): DeletionRequest {
  return { orgId, requestedAt: now.toISOString(), graceEndsAt: new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000).toISOString(), status: "pending_grace", graceDays };
}
export function deletionDue(req: DeletionRequest, now = new Date()): boolean {
  return req.status === "pending_grace" && now.getTime() >= new Date(req.graceEndsAt).getTime();
}
/** GDPR export shape: counts + redacted sample structure. Never includes raw PII — callers must redact event payloads with redactObject before filling `events`. */
export interface OrgExport { orgId: string; exportedAt: string; counts: { agents: number; events: number; approvals: number; auditRows: number }; events: unknown[]; note: string; }
export function buildOrgExport(orgId: string, counts: OrgExport["counts"], redactedEvents: unknown[]): OrgExport {
  return { orgId, exportedAt: new Date().toISOString(), counts, events: redactedEvents, note: "Event payloads in this export are PII-redacted. Raw values are never exported." };
}
