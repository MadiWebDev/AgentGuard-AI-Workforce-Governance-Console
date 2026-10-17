
import { generateKeyPairSync } from "node:crypto";
import { randomUUID } from "node:crypto";
export interface VapidKeys { publicKey: string; privateKey: string; }
export function generateVapidKeys(): VapidKeys {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const pub = publicKey.export({ type: "spki", format: "der" }).toString("base64url");
  const priv = privateKey.export({ type: "pkcs8", format: "der" }).toString("base64url");
  return { publicKey: pub, privateKey: priv };
}
export interface PushSubscription { id: string; userId: string; endpoint: string; createdAt: string; }
export class PushStore {
  subscriptions = new Map<string, PushSubscription>();
  sent: { subscriptionId: string; payload: Record<string, unknown>; at: string }[] = [];
  subscribe(userId: string, endpoint: string): PushSubscription { const s: PushSubscription = { id: randomUUID(), userId, endpoint, createdAt: new Date().toISOString() }; this.subscriptions.set(s.id, s); return s; }
  unsubscribe(id: string): boolean { return this.subscriptions.delete(id); }
  forUser(userId: string): PushSubscription[] { return [...this.subscriptions.values()].filter(s => s.userId === userId); }
}
export interface PushResult { delivered: boolean; subscriptionId: string; mock: boolean; }
export function sendPush(store: PushStore, subscriptionId: string, payload: Record<string, unknown>, opts?: { mock?: boolean }): PushResult {
  const sub = store.subscriptions.get(subscriptionId); if (!sub) throw new Error("Push subscription not found");
  store.sent.push({ subscriptionId, payload, at: new Date().toISOString() });
  return { delivered: true, subscriptionId, mock: opts?.mock ?? true };
}
export interface QueuedDecision { id: string; approvalId: string; userId: string; decision: "approved" | "rejected"; comment: string; queuedAt: string; }
export class OfflineQueue {
  queue: QueuedDecision[] = [];
  queueDecision(approvalId: string, userId: string, decision: "approved" | "rejected", comment: string): QueuedDecision {
    const q: QueuedDecision = { id: randomUUID(), approvalId, userId, decision, comment, queuedAt: new Date().toISOString() };
    this.queue.push(q); return q;
  }
}
export interface DecisionRecord { approvalId: string; decision: "approved" | "rejected"; decidedBy: string; comment: string; }
export function syncOfflineQueue(q: OfflineQueue, existing: Map<string, DecisionRecord>): { applied: QueuedDecision[]; conflicts: { queued: QueuedDecision; winner: DecisionRecord }[] } {
  const applied: QueuedDecision[] = []; const conflicts: { queued: QueuedDecision; winner: DecisionRecord }[] = [];
  for (const item of [...q.queue]) {
    const winner = existing.get(item.approvalId);
    if (winner) { conflicts.push({ queued: item, winner }); }
    else { existing.set(item.approvalId, { approvalId: item.approvalId, decision: item.decision, decidedBy: item.userId, comment: item.comment }); applied.push(item); }
  }
  q.queue = [];
  return { applied, conflicts };
}
