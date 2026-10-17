
import { ApiError } from "./errors";
import type { Policy, PolicyRule } from "./types";
import { evaluatePolicy, type PolicyInput } from "./policy";
export const SAMPLE_UTTERANCES = [
  "Write a policy that blocks prod database writes on weekends",
  "Require approval for prod deploys over $100",
  "Deny tool fetch-url in prod",
  "Rate limit tool search-web to 10 per minute",
  "Require approval for critical tier actions",
] as const;
export interface NlSimulationDiff { eventIndex: number; before: string; after: string; changed: boolean; }
export interface NlSimulation { eventsEvaluated: number; wouldBlock: number; wouldRequireApproval: number; wouldAllow: number; diffs: NlSimulationDiff[]; }
export interface NlDraftResult { policy: Policy; explanation: string; simulation: NlSimulation; }
function validateRule(rule: PolicyRule): void {
  if (!["allow", "deny", "require_approval", "rate_limit", "spend_cap", "content_guard", "execute_in_sandbox"].includes(rule.action)) throw new ApiError("NL_INVALID_RULE", 400, `Unknown action ${rule.action}`);
  if (!Number.isInteger(rule.priority)) throw new ApiError("NL_INVALID_RULE", 400, "Rule priority must be an integer");
}
function simulate(rule: PolicyRule, events: PolicyInput[], activeRules: PolicyRule[]): NlSimulation {
  const diffs: NlSimulationDiff[] = [];
  let wouldBlock = 0, wouldRequireApproval = 0, wouldAllow = 0;
  events.forEach((e, i) => {
    const before = evaluatePolicy(activeRules, e).decision;
    const after = evaluatePolicy([...activeRules, rule], e).decision;
    if (after === "deny") wouldBlock++;
    else if (after === "require_approval") wouldRequireApproval++;
    else wouldAllow++;
    diffs.push({ eventIndex: i, before, after, changed: before !== after });
  });
  return { eventsEvaluated: events.length, wouldBlock, wouldRequireApproval, wouldAllow, diffs };
}
interface Parsed { rule: PolicyRule; explanation: string; }
function parseUtterance(u: string): Parsed {
  const s = u.toLowerCase();
  // 1. prod database writes on weekends
  if (/block|deny/.test(s) && /prod/.test(s) && /database|\bdb\b/.test(s) && /write/.test(s) && /weekend/.test(s)) {
    return { rule: { id: "nl-db-weekend", action: "deny", priority: 90, toolGlob: "db-*", environment: "prod", timeWindow: { daysOfWeek: [0, 6] } }, explanation: "Deny database writes (tools matching db-*) in prod on weekends (Sat/Sun UTC). Draft only — activate explicitly to enforce." };
  }
  // 2. approval for prod deploys over $N
  const deployCost = s.match(/require approval.*prod.*deploy.*\$(\d+(?:\.\d+)?)|deploy.*over \$(\d+(?:\.\d+)?)/);
  if (/require approval/.test(s) && /prod/.test(s) && /deploy/.test(s) && /\$\d+/.test(s)) {
    const amt = deployCost ? Number(deployCost[1] ?? deployCost[2] ?? 0) : 0;
    return { rule: { id: "nl-deploy-approval", action: "require_approval", priority: 80, toolGlob: "deploy*", environment: "prod", costThreshold: amt }, explanation: `Require human approval for prod deploys (tools matching deploy*) costing over $${amt}. Draft only — activate explicitly to enforce.` };
  }
  // 3. deny tool X in prod
  const denyTool = s.match(/deny tool ([a-z0-9_*-]+) in prod/);
  if (denyTool) {
    const tool = denyTool[1] ?? "";
    return { rule: { id: `nl-deny-${tool}`, action: "deny", priority: 90, toolGlob: tool, environment: "prod" }, explanation: `Deny tool ${tool} in prod. Draft only — activate explicitly to enforce.` };
  }
  // 4. rate limit tool Y to N/min
  const rate = s.match(/rate limit tool ([a-z0-9_*-]+) to (\d+) per minute/);
  if (rate) {
    const tool = rate[1] ?? ""; const n = Number(rate[2] ?? 0);
    return { rule: { id: `nl-rate-${tool}`, action: "rate_limit", priority: 70, toolGlob: tool, rateLimitPerMinute: n }, explanation: `Rate-limit tool ${tool} to ${n} calls per minute. Draft only — activate explicitly to enforce.` };
  }
  // 5. approval for critical tier actions
  if (/require approval/.test(s) && /critical/.test(s)) {
    return { rule: { id: "nl-critical-approval", action: "require_approval", priority: 85, riskTier: "critical" }, explanation: "Require human approval for all critical-tier actions. Draft only — activate explicitly to enforce." };
  }
  throw new ApiError("NL_NO_MATCH", 400, `Could not parse utterance into a policy rule. Supported patterns: ${SAMPLE_UTTERANCES.join(" | ")}`, { utterance: u });
}
/**
 * Deterministic NL -> policy draft. When an AI provider key is configured the
 * caller may use the AI module instead; with no key this parser is the path
 * (never fabricated results). The draft NEVER affects policy/check until
 * explicitly activated: activation reads only status==="active" policies.
 */
export function draftPolicyFromUtterance(utterance: string, recentEvents: PolicyInput[] = [], activeRules: PolicyRule[] = []): NlDraftResult {
  const { rule, explanation } = parseUtterance(utterance);
  validateRule(rule);
  const policy: Policy = { id: `nl-draft-${rule.id}`, orgId: "org_demo", name: `NL draft: ${utterance.slice(0, 60)}`, version: 1, status: "draft", rules: [rule], changeNote: `Draft from natural-language utterance: "${utterance}". Requires explicit activation.`, createdAt: new Date().toISOString() };
  return { policy, explanation, simulation: simulate(rule, recentEvents, activeRules) };
}
