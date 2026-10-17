
import type { Policy, PolicyRule } from "./types";
export interface Pack { id: string; version: string; name: string; description: string; policies: { name: string; rules: PolicyRule[] }[]; }
export const PACKS: Pack[] = [
  { id: "eu-ai-act-oversight", version: "1.0.0", name: "EU AI Act Oversight", description: "Human oversight for high-risk agent actions.", policies: [{ name: "EU AI Act — human oversight", rules: [{ id: "eu-oversight-1", action: "require_approval", priority: 90, riskTier: "high" }] }] },
  { id: "soc2-baseline", version: "1.0.0", name: "SOC 2 Baseline", description: "Baseline deny rules for production deploys and sensitive data.", policies: [{ name: "SOC 2 — prod deploy guard", rules: [{ id: "soc2-1", action: "deny", priority: 90, toolGlob: "deploy*", environment: "prod" }] }] },
  { id: "finance-dlp", version: "1.0.0", name: "Finance DLP", description: "Block exfiltration of financial data.", policies: [{ name: "Finance DLP", rules: [{ id: "fin-1", action: "deny", priority: 95, dataSensitivity: "financial" }] }] },
  { id: "support-qa-starter", version: "1.0.0", name: "Support QA Starter", description: "Approval for high-cost support actions.", policies: [{ name: "Support QA", rules: [{ id: "sup-1", action: "require_approval", priority: 50, costThreshold: 5 }] }] },
];
export function getPack(packId: string): Pack | undefined { return PACKS.find(p => p.id === packId); }
export interface PackInstall { packId: string; version: string; draftPolicies: Policy[]; }
export function installPack(packId: string, orgId: string): PackInstall {
  const pack = getPack(packId); if (!pack) throw new Error(`Unknown pack: ${packId}`);
  const draftPolicies: Policy[] = pack.policies.map((p, i) => ({ id: `pack-${packId}-${i}`, orgId, name: p.name, version: 1, status: "draft", rules: p.rules, changeNote: `Installed from pack ${packId}@${pack.version} as DRAFT — not active until explicitly activated.`, createdAt: new Date().toISOString() }));
  return { packId, version: pack.version, draftPolicies };
}
export interface PackSimulation { wouldBlock: number; wouldRequireApproval: number; diffs: string[]; }
export function simulatePack(pack: PackInstall, recentEvents: { tool?: string; cost?: number; environment?: string; riskTier?: string }[]): PackSimulation {
  const rules = pack.draftPolicies.flatMap(p => p.rules);
  let wouldBlock = 0; let wouldRequireApproval = 0; const diffs: string[] = [];
  for (const ev of recentEvents) {
    for (const r of rules) {
      const toolHit = !r.toolGlob || (ev.tool !== undefined && new RegExp("^" + r.toolGlob.replace(/\*/g, ".*") + "$").test(ev.tool));
      const envHit = !r.environment || r.environment === ev.environment;
      const costHit = r.costThreshold === undefined || (ev.cost ?? 0) >= r.costThreshold;
      const riskHit = !r.riskTier || r.riskTier === ev.riskTier;
      if (toolHit && envHit && costHit && riskHit) { if (r.action === "deny") wouldBlock++; if (r.action === "require_approval") wouldRequireApproval++; }
    }
  }
  diffs.push(`${pack.draftPolicies.length} draft polic(ies), ${rules.length} rule(s) would block ${wouldBlock} and require approval for ${wouldRequireApproval} of ${recentEvents.length} recent events.`);
  return { wouldBlock, wouldRequireApproval, diffs };
}
export function activatePackDraft(draft: Policy, actorId: string): { policy: Policy; audit: { action: string; policyId: string; actorId: string } } {
  if (draft.status !== "draft") throw new Error("Only draft policies can be activated");
  const policy: Policy = { ...draft, status: "active" };
  return { policy, audit: { action: "pack.draft.activated", policyId: draft.id, actorId } };
}
