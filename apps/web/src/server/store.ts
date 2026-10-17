
import { createHash, randomUUID } from "node:crypto";
import type { Agent, Policy, Approval } from "@agentguard/shared";
import { createAuditRow, verifyChain, type AuditRow } from "@agentguard/shared";
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
}

export const store = new MemoryStore();
export function resetStore(){ store.orgs.clear(); store.agents.clear(); store.keys.clear(); store.events=[]; store.policies.clear(); store.approvals.clear(); store.audit=[]; store.subscriptions.clear(); store.seenPaddle.clear(); store.seenIdempotency.clear(); store.orgs.set("org_demo",{id:"org_demo",name:"Demo Org",plan:"Team",createdAt:new Date().toISOString()}); }
