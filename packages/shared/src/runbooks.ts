
import { randomUUID } from "node:crypto";
export interface RunbookStep { name: string; status: "pending" | "done" | "failed"; startedAt: string | null; endedAt: string | null; error?: string; }
export interface RunbookExecution { id: string; kind: "compromised-agent"; agentId: string; orgId: string; steps: RunbookStep[]; audit: string[]; startedAt: string; endedAt: string | null; evidencePackId: string | null; }
export interface CompromisedAgentContext { agentExists: boolean; pendingApprovalIds: string[]; stakeholderEmails: string[]; }
export function runCompromisedAgentRunbook(input: { agentId: string; orgId: string }, ctx: CompromisedAgentContext, effects: { quarantine: () => boolean; revokeKeys: () => number; freezeApprovals: (ids: string[]) => number; notify: (emails: string[]) => number; openEvidencePack: () => string }): RunbookExecution {
  const now = () => new Date().toISOString();
  const exec: RunbookExecution = { id: randomUUID(), kind: "compromised-agent", agentId: input.agentId, orgId: input.orgId, steps: [], audit: [], startedAt: now(), endedAt: null, evidencePackId: null };
  const step = (name: string, fn: () => string): void => {
    const s: RunbookStep = { name, status: "pending", startedAt: now(), endedAt: null };
    exec.steps.push(s);
    try { const detail = fn(); s.status = "done"; s.endedAt = now(); exec.audit.push(`runbook.${name}:${detail}`); }
    catch (e) { s.status = "failed"; s.endedAt = now(); s.error = e instanceof Error ? e.message : "failed"; exec.audit.push(`runbook.${name}:failed`); }
  };
  step("quarantine_agent", () => { if (!ctx.agentExists) throw new Error("agent not found"); if (!effects.quarantine()) throw new Error("quarantine failed"); return "quarantined"; });
  step("revoke_keys", () => `revoked=${effects.revokeKeys()}`);
  step("freeze_pending_approvals", () => `frozen=${effects.freezeApprovals(ctx.pendingApprovalIds)}`);
  step("notify_stakeholders", () => `notified=${effects.notify(ctx.stakeholderEmails)}`);
  step("open_incident_evidence_pack", () => { const id = effects.openEvidencePack(); exec.evidencePackId = id; return `pack=${id}`; });
  exec.endedAt = now();
  return exec;
}
export class RunbookHistory {
  executions: RunbookExecution[] = [];
  record(e: RunbookExecution): void { this.executions.push(e); }
  list(orgId: string): RunbookExecution[] { return this.executions.filter(e => e.orgId === orgId); }
  allStepsDone(e: RunbookExecution): boolean { return e.steps.length === 5 && e.steps.every(s => s.status === "done"); }
}
