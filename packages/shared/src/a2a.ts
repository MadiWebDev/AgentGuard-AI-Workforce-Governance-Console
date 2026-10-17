
import { ApiError } from "./errors";
import { redactText } from "./redaction";

/**
 * C2 — Agent-to-agent (A2A) protocol governance.
 * Pair policies gate inter-agent messages; content guards scan payloads;
 * costs are attributed across the chain in integer cents so the split
 * always sums exactly to the total; every delivery gets an audit record
 * linking the full multi-agent trace.
 */
export interface A2APairPolicy {
  fromAgent: string;
  toAgent: string;
  action: "allow" | "deny" | "require_approval";
  contentGuards: string[]; // regex sources applied to the payload
  conditions?: string[]; // human-readable conditions logged when approved-with-conditions
}
export interface A2AMessage {
  traceId: string;
  fromAgent: string;
  toAgent: string;
  payload: string;
  costUsd: number;
}
export interface A2ACheck {
  allowed: boolean;
  requiresApproval: boolean;
  matchedRule: string;
  guardHit?: string;
  conditions?: string[];
  redactedPayload: string;
  redactionCount: number;
}

export function checkA2AMessage(policy: A2APairPolicy | undefined, message: A2AMessage): A2ACheck {
  if (policy && (policy.fromAgent !== message.fromAgent || policy.toAgent !== message.toAgent)) {
    throw new ApiError("POLICY_PAIR_MISMATCH", 400, "Pair policy does not match message endpoints");
  }
  const redacted = redactText(message.payload);
  // Content guards: regex + PII-class detection. A guard hit blocks delivery regardless of pair action.
  if (policy) {
    for (const src of policy.contentGuards) {
      let re: RegExp;
      try { re = new RegExp(src); } catch { throw new ApiError("INVALID_GUARD", 400, `Invalid content-guard regex: ${src}`); }
      if (re.test(message.payload)) {
        return { allowed: false, requiresApproval: false, matchedRule: "content-guard", guardHit: src, redactedPayload: redacted.redacted, redactionCount: redacted.count };
      }
    }
  }
  if (redacted.count > 0 && policy?.contentGuards.includes("pii")) {
    return { allowed: false, requiresApproval: false, matchedRule: "content-guard", guardHit: "pii", redactedPayload: redacted.redacted, redactionCount: redacted.count };
  }
  if (!policy) return { allowed: true, requiresApproval: false, matchedRule: "default-allow", redactedPayload: redacted.redacted, redactionCount: redacted.count };
  if (policy.action === "deny") return { allowed: false, requiresApproval: false, matchedRule: "pair-deny", redactedPayload: redacted.redacted, redactionCount: redacted.count };
  if (policy.action === "require_approval") {
    return { allowed: false, requiresApproval: true, matchedRule: "pair-require-approval", conditions: policy.conditions ?? [], redactedPayload: redacted.redacted, redactionCount: redacted.count };
  }
  return { allowed: true, requiresApproval: false, matchedRule: "pair-allow", conditions: policy.conditions ?? [], redactedPayload: redacted.redacted, redactionCount: redacted.count };
}

/** Split a total cost across chain segments by weight, in integer cents. The returned per-agent cents sum EXACTLY to totalCents (largest remainder). */
export function attributeCost(segments: { agentId: string; weight: number }[], totalCents: number): { perAgentCents: Record<string, number>; totalCents: number } {
  if (segments.length === 0) throw new ApiError("EMPTY_CHAIN", 400, "Cost attribution requires at least one chain segment");
  if (totalCents < 0) throw new ApiError("NEGATIVE_COST", 400, "Total cost must be >= 0");
  const totalWeight = segments.reduce((s, x) => s + x.weight, 0);
  if (totalWeight <= 0) throw new ApiError("INVALID_WEIGHTS", 400, "Chain weights must sum > 0");
  const raw = segments.map((s) => ({ agentId: s.agentId, exact: (totalCents * s.weight) / totalWeight }));
  const floors = raw.map((r) => Math.floor(r.exact));
  let remainder = totalCents - floors.reduce((s, x) => s + x, 0);
  const order = raw.map((r, i) => ({ i, frac: r.exact - Math.floor(r.exact) })).sort((a, b) => b.frac - a.frac);
  for (const o of order) { if (remainder <= 0) break; floors[o.i] = (floors[o.i] ?? 0) + 1; remainder--; }
  const perAgentCents: Record<string, number> = {};
  raw.forEach((r, i) => { perAgentCents[r.agentId] = (perAgentCents[r.agentId] ?? 0) + floors[i]!; });
  return { perAgentCents, totalCents };
}

export interface A2AAuditRecord {
  traceId: string;
  hops: { fromAgent: string; toAgent: string; allowed: boolean; matchedRule: string; conditions?: string[] }[];
  totalCostCents: number;
  perAgentCents: Record<string, number>;
  createdAt: string;
}
export function createA2AAuditRecord(traceId: string, hops: A2AAuditRecord["hops"], totalCostCents: number, perAgentCents: Record<string, number>): A2AAuditRecord {
  const sum = Object.values(perAgentCents).reduce((s, x) => s + x, 0);
  if (sum !== totalCostCents) throw new ApiError("COST_MISMATCH", 400, "Per-agent costs must sum to the total");
  return { traceId, hops, totalCostCents, perAgentCents, createdAt: new Date().toISOString() };
}
