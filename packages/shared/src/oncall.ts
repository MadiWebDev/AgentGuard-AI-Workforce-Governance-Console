
import { ApiError } from "./errors";

/**
 * C8 — On-call integrations (PagerDuty / Opsgenie).
 * SLA-breaching approvals escalate to an on-call incident; the approver's
 * decision resolves it. The full round trip is audit-logged by the caller
 * via the returned auditAction values. MockOnCall is in-memory for
 * dev/test; PagerDuty/Opsgenie adapters throw NOT_CONFIGURED without keys.
 */
export interface OnCallIncident {
  id: string;
  title: string;
  urgency: "low" | "high";
  approverId: string;
  status: "triggered" | "acknowledged" | "resolved";
  approvalId: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}
export interface OnCallProvider {
  name: string;
  createIncident(input: { title: string; urgency: "low" | "high"; approverId: string; approvalId: string }): Promise<OnCallIncident>;
  resolveIncident(id: string, resolution: string): Promise<OnCallIncident>;
  getIncident(id: string): Promise<OnCallIncident | null>;
}
export class MockOnCall implements OnCallProvider {
  name = "mock";
  private incidents = new Map<string, OnCallIncident>();
  private seq = 0;
  async createIncident(input: { title: string; urgency: "low" | "high"; approverId: string; approvalId: string }): Promise<OnCallIncident> {
    const inc: OnCallIncident = { id: `inc-${++this.seq}`, ...input, status: "triggered", createdAt: new Date().toISOString() };
    this.incidents.set(inc.id, inc);
    return inc;
  }
  async resolveIncident(id: string, resolution: string): Promise<OnCallIncident> {
    const inc = this.incidents.get(id);
    if (!inc) throw new ApiError("INCIDENT_NOT_FOUND", 404, `On-call incident ${id} not found`);
    inc.status = "resolved"; inc.resolvedAt = new Date().toISOString(); inc.resolution = resolution;
    return inc;
  }
  async getIncident(id: string): Promise<OnCallIncident | null> { return this.incidents.get(id) ?? null; }
}
export class PagerDutyAdapter implements OnCallProvider {
  name = "pagerduty";
  private notConfigured(): never { throw new ApiError("PAGERDUTY_NOT_CONFIGURED", 503, "PagerDuty not configured: set PAGERDUTY_API_KEY + PAGERDUTY_SERVICE_ID. No live PagerDuty calls are made until configured."); }
  async createIncident(_i: { title: string; urgency: "low" | "high"; approverId: string; approvalId: string }): Promise<OnCallIncident> { this.notConfigured(); }
  async resolveIncident(_id: string, _r: string): Promise<OnCallIncident> { this.notConfigured(); }
  async getIncident(_id: string): Promise<OnCallIncident | null> { this.notConfigured(); }
}
export class OpsgenieAdapter implements OnCallProvider {
  name = "opsgenie";
  private notConfigured(): never { throw new ApiError("OPSGENIE_NOT_CONFIGURED", 503, "Opsgenie not configured: set OPSGENIE_API_KEY. No live Opsgenie calls are made until configured."); }
  async createIncident(_i: { title: string; urgency: "low" | "high"; approverId: string; approvalId: string }): Promise<OnCallIncident> { this.notConfigured(); }
  async resolveIncident(_id: string, _r: string): Promise<OnCallIncident> { this.notConfigured(); }
  async getIncident(_id: string): Promise<OnCallIncident | null> { this.notConfigured(); }
}

export interface ApprovalForEscalation { id: string; orgId: string; agentId: string; action: string; riskTier: string; createdAt: string; slaMinutes: number }

/** SLA breach check: approval older than slaMinutes and still undecided. */
export function isSlaBreached(approval: ApprovalForEscalation, nowMs = Date.now()): boolean {
  return nowMs - Date.parse(approval.createdAt) > approval.slaMinutes * 60_000;
}

export async function createOnCallIncident(
  provider: OnCallProvider,
  approval: ApprovalForEscalation,
  approverId: string,
): Promise<{ incident: OnCallIncident; auditAction: string }> {
  const incident = await provider.createIncident({
    title: `Approval SLA breached: ${approval.action} (agent ${approval.agentId}, ${approval.riskTier})`,
    urgency: approval.riskTier === "critical" ? "high" : "low",
    approverId,
    approvalId: approval.id,
  });
  return { incident, auditAction: "oncall.incident.created" };
}

export async function resolveOnCallIncident(
  provider: OnCallProvider,
  incidentId: string,
  decision: "approved" | "denied",
): Promise<{ incident: OnCallIncident; auditAction: string }> {
  const incident = await provider.resolveIncident(incidentId, `Approval ${decision}`);
  return { incident, auditAction: "oncall.incident.resolved" };
}
