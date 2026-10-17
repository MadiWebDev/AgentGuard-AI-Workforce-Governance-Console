
import { ApiError } from "./errors";
import type { Policy, PolicyRule } from "./types";
export interface ApprovalDecisionRecord { action: string; tool?: string; environment?: string; riskTier?: string; agentId?: string; decision: "approved" | "rejected"; at?: string; }
export interface DriftFindingInput { agentId: string; tool?: string; dimension: string; traceIds: string[]; }
export interface AutopilotProposal { id: string; orgId: string; name: string; version: number; type: "tighten" | "loosen"; targetRuleId?: string; draftRule: PolicyRule; evidence: string; evidenceCount: number; requiresTwoPerson: boolean; status: "draft"; createdAt: string; }
export interface AutopilotInput { decisions: ApprovalDecisionRecord[]; driftFindings: DriftFindingInput[]; activeRules?: PolicyRule[]; orgId?: string; loosenThreshold?: number; }
const LOOSEN_DEFAULT = 5;
function groupKey(d: ApprovalDecisionRecord): string { return [d.tool ?? d.action, d.environment ?? "any"].join("|"); }
/**
 * Nightly autopilot: learns ONLY from approval decisions + drift findings and
 * returns DRAFT proposals with evidence. It NEVER auto-activates anything:
 * activation requires an explicit call to activateAutopilotProposal.
 */
export function learnFromDecisions(input: AutopilotInput): AutopilotProposal[] {
  const orgId = input.orgId ?? "org_demo";
  const threshold = input.loosenThreshold ?? LOOSEN_DEFAULT;
  const proposals: AutopilotProposal[] = [];
  // Loosen: a (tool, env) whose approval-gated actions were ALL approved >= threshold times.
  const byKey = new Map<string, ApprovalDecisionRecord[]>();
  for (const d of input.decisions) { const k = groupKey(d); byKey.set(k, [...(byKey.get(k) ?? []), d]); }
  for (const [key, rows] of [...byKey.entries()].sort()) {
    if (rows.length < threshold) continue;
    if (!rows.every(r => r.decision === "approved")) continue;
    const first = rows[0]!;
    const [tool, env] = key.split("|");
    const target = (input.activeRules ?? []).find(r => r.toolGlob === tool && (r.action === "deny" || r.action === "require_approval"));
    const loosensDeny = target?.action === "deny";
    proposals.push({ id: `ap-loosen-${tool}-${env}`, orgId, name: `Loosen ${tool} in ${env}`, version: 1, type: "loosen", targetRuleId: target?.id, draftRule: { id: `ap-allow-${tool}-${env}`, action: "allow", priority: 50, toolGlob: tool, environment: env === "any" ? undefined : env }, evidence: `${rows.length} similar actions were all approved`, evidenceCount: rows.length, requiresTwoPerson: loosensDeny, status: "draft", createdAt: new Date().toISOString() });
  }
  // Tighten: drift findings -> require_approval drafts for the anomalous tool.
  for (const f of input.driftFindings) {
    const tool = f.tool ?? "unknown-tool";
    proposals.push({ id: `ap-tighten-${f.agentId}-${tool}`, orgId, name: `Tighten ${tool} after drift`, version: 1, type: "tighten", draftRule: { id: `ap-tighten-${tool}`, action: "require_approval", priority: 85, toolGlob: tool }, evidence: `Drift finding on ${f.dimension} for agent ${f.agentId} (${f.traceIds.length} trace(s))`, evidenceCount: f.traceIds.length, requiresTwoPerson: false, status: "draft", createdAt: new Date().toISOString() });
  }
  return proposals;
}
/** Activation goes through the normal versioned change flow. Loosening a deny-class rule needs two distinct approvers. */
export function activateAutopilotProposal(proposal: AutopilotProposal, approvers: string[]): { policy: Policy; audit: { action: string; proposalId: string; approvers: string[]; at: string } } {
  if (proposal.status !== "draft") throw new ApiError("AUTOPILOT_NOT_DRAFT", 400, "Only draft proposals can be activated");
  if (proposal.requiresTwoPerson) {
    const distinct = [...new Set(approvers)];
    if (distinct.length < 2) throw new ApiError("AUTOPILOT_TWO_PERSON_REQUIRED", 403, "Loosening a deny-class rule requires two distinct approvers");
  } else if (approvers.length < 1) throw new ApiError("AUTOPILOT_APPROVER_REQUIRED", 403, "Activation requires at least one approver");
  const policy: Policy = { id: `policy-${proposal.id}`, orgId: proposal.orgId, name: proposal.name, version: proposal.version + 1, status: "active", rules: [proposal.draftRule], changeNote: `Activated autopilot proposal ${proposal.id}: ${proposal.evidence}`, createdAt: new Date().toISOString() };
  return { policy, audit: { action: "autopilot.proposal.activated", proposalId: proposal.id, approvers: [...new Set(approvers)], at: new Date().toISOString() } };
}
