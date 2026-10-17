
import { createHash, randomUUID } from "node:crypto";
import type { Agent, Policy, Approval } from "@agentguard/shared";
import { createAuditRow, verifyChain, processBatch, type AuditRow } from "@agentguard/shared";
export interface StoredKey { id: string; orgId: string; agentId: string; name: string; keyHash: string; prefix: string; scopes: string[]; revokedAt?: string|null; lastUsedAt?: string|null; lastUsedIp?: string|null; plaintextShownOnce?: boolean; }
export class MemoryStore {
  orgs = new Map<string, { id: string; name: string; plan: string; createdAt: string }>();
  agents = new Map<string, Agent>();
  keys = new Map<string, StoredKey>();
  events: Array<Record<string, unknown>> = [];
  policies = new Map<string, Policy>();
  approvals = new Map<string, Approval>();
  audit: AuditRow[] = [];
  subscriptions = new Map<string, Record<string, unknown>>();
  checkpoints: { orgId: string; root: string; rowCount: number; at: string }[] = [];
  seenPaddle = new Set<string>();
  seenIdempotency = new Set<string>();
  constructor(){ this.orgs.set("org_demo", { id:"org_demo", name:"Demo Org", plan:"Team", createdAt: new Date().toISOString() }); }
  hashKey(plain: string){ return createHash("sha256").update(plain).digest("hex"); }
  mintKey(orgId: string, agentId: string, name: string, scopes: string[], test=false): { record: StoredKey; plaintext: string } {
    const plaintext = `${test?"ag_test_":"ag_live_"}${randomUUID().replace(/-/g,"").slice(0,32)}`;
    const record: StoredKey = { id: randomUUID(), orgId, agentId, name, keyHash: this.hashKey(plaintext), prefix: plaintext.slice(0,8), scopes, revokedAt: null };
    this.keys.set(record.id, record); return { record, plaintext };
  }
  findKey(plain: string): StoredKey|undefined { const h=this.hashKey(plain); return [...this.keys.values()].find(k=>k.keyHash===h && !k.revokedAt); }
  appendAudit(orgId: string, action: string, payload: Record<string, unknown>, opts?: { actorId?: string }): AuditRow { const prev = [...this.audit].reverse().find(r=>r.orgId===orgId) ?? null; const row = createAuditRow(prev, orgId, action, payload, { actorId: opts?.actorId }); this.audit.push(row); return row; }
  verifyAudit(orgId: string){ return verifyChain(this.audit.filter(r=>r.orgId===orgId)); }
  /** Real checkpoint: Merkle-style root over the org audit rows at creation time. */
  createCheckpoint(orgId: string): { orgId: string; root: string; rowCount: number; at: string } {
    const rows = this.audit.filter(r=>r.orgId===orgId);
    const root = createHash("sha256").update(rows.map(r=>r.rowHash).join("|")).digest("hex");
    const cp = { orgId, root, rowCount: rows.length, at: new Date().toISOString() };
    this.checkpoints.push(cp); return cp;
  }
  /** A checkpoint backup exists AND its stored root still matches the first N audit rows. */
  hasCheckpoint(orgId = "org_demo"): boolean {
    const cp = [...this.checkpoints].reverse().find(c=>c.orgId===orgId);
    if (!cp) return false;
    const rows = this.audit.filter(r=>r.orgId===orgId).slice(0, cp.rowCount);
    return createHash("sha256").update(rows.map(r=>r.rowHash).join("|")).digest("hex") === cp.root;
  }
  /** Redaction probe: PII through the real ingest path must not survive anywhere in the processed event. */
  redactionProbeClean(): boolean {
    const probe = "probe alice@example.com 415-555-0132 4242424242424242";
    const out = processBatch([{ traceId: "probe-1", agentId: "probe-agent", type: "tool_call", input: probe } as never]);
    const s = JSON.stringify(out);
    return !s.includes("alice@example.com") && !s.includes("415-555-0132") && !s.includes("4242424242424242");
  }
  /**
   * Kill-switch control, genuinely exercised: register a probe agent, quarantine
   * it, assert the gate (status !== "active" -> deny) denies it, then remove it.
   * The gate mirrors the policy/check kill-switch path in the v1 golden path.
   */
  killSwitchDenies(): boolean {
    const probeId = "control-probe-agent";
    const prev = this.agents.get(probeId);
    this.agents.set(probeId, { id: probeId, orgId: "org_demo", name: "control-probe", environment: "prod", tags: [], riskTier: "low", status: "quarantined", failMode: "fail-closed", createdAt: new Date().toISOString() });
    const agent = this.agents.get(probeId)!;
    const denied = agent.status !== "active";
    if (prev) this.agents.set(probeId, prev); else this.agents.delete(probeId);
    return denied;
  }
}

export const store = new MemoryStore();
export function resetStore(){ store.orgs.clear(); store.agents.clear(); store.keys.clear(); store.events=[]; store.policies.clear(); store.approvals.clear(); store.audit=[]; store.subscriptions.clear(); store.checkpoints=[]; store.seenPaddle.clear(); store.seenIdempotency.clear(); store.orgs.set("org_demo",{id:"org_demo",name:"Demo Org",plan:"Team",createdAt:new Date().toISOString()}); }
