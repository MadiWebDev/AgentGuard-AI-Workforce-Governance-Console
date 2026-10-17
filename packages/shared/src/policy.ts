
import type { PolicyRule } from "./types";
export interface PolicyInput { tool?: string; cost?: number; environment?: string; riskTier?: string; tags?: string[]; agentId?: string; orgId?: string; args?: Record<string, unknown>; inputText?: string; time?: Date; }
export interface PolicyDecision { decision: "allow"|"deny"|"require_approval"|"rate_limit"|"spend_cap"; reason: string; matched_rule_ids: string[]; }
function globMatch(glob: string, s: string): boolean { const re = new RegExp("^"+glob.replace(/[.+^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*").replace(/\?/g,".")+"$"); return re.test(s); }
function getPath(obj: unknown, path: string): unknown { const parts = path.replace(/^\$\.?/,"").split(".").filter(Boolean); let cur: unknown = obj; for (const p of parts) { if (cur && typeof cur==="object") cur = (cur as Record<string, unknown>)[p]; else return undefined; } return cur; }
const PRECEDENCE: Record<string, number> = { deny: 0, require_approval: 1, rate_limit: 2, spend_cap: 2, content_guard: 0, allow: 3 };
export function ruleMatches(rule: PolicyRule, input: PolicyInput): boolean {
  if (rule.toolGlob && input.tool && !globMatch(rule.toolGlob, input.tool)) return false;
  if (rule.toolGlob && !input.tool) return false;
  if (rule.costThreshold !== undefined && (input.cost ?? 0) < rule.costThreshold) return false;
  if (rule.environment && rule.environment !== input.environment) return false;
  if (rule.riskTier && rule.riskTier !== input.riskTier) return false;
  if (rule.dataSensitivity && !(input.tags ?? []).includes(rule.dataSensitivity)) return false;
  if (rule.argumentPredicate) { const v = getPath({ args: input.args, tool: input.tool }, rule.argumentPredicate.path); if (rule.argumentPredicate.equals !== undefined && v !== rule.argumentPredicate.equals) return false; if (rule.argumentPredicate.contains !== undefined && (typeof v!=="string" || !v.includes(rule.argumentPredicate.contains))) return false; }
  if (rule.contentPattern && input.inputText) { try { if (!new RegExp(rule.contentPattern).test(input.inputText)) return false; } catch { return false; } }
  if (rule.contentPattern && !input.inputText && !rule.argumentPredicate && !rule.toolGlob && rule.costThreshold===undefined) return false;
  return true;
}
export function evaluatePolicy(rules: PolicyRule[], input: PolicyInput): PolicyDecision {
  const matched = rules.filter(r=>ruleMatches(r, input));
  if (matched.length===0) return { decision: "allow", reason: "No matching rules; default allow", matched_rule_ids: [] };
  const sorted = [...matched].sort((a,b)=>{ const pa=PRECEDENCE[a.action]??3, pb=PRECEDENCE[b.action]??3; if(pa!==pb) return pa-pb; if(a.priority!==b.priority) return b.priority-a.priority; return a.id.localeCompare(b.id); });
  const top = sorted[0]!;
  const decision = top.action==="content_guard" ? "deny" : (top.action as PolicyDecision["decision"]);
  return { decision, reason: `Matched rule ${top.id} (${top.action})`, matched_rule_ids: matched.map(r=>r.id) };
}
