
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export type SiemProfile = "generic_https" | "splunk_hec" | "datadog";
export interface SiemEndpoint { id: string; orgId: string; profile: SiemProfile; url: string; secret: string; }
export interface SignedDelivery { id: string; endpointId: string; eventId: string; payload: Record<string, unknown>; signature: string; timestamp: number; idempotencyKey: string; }
export function signDelivery(endpoint: SiemEndpoint, eventId: string, payload: Record<string, unknown>, timestamp = Date.now()): SignedDelivery {
  const body = JSON.stringify({ eventId, payload, timestamp });
  const signature = createHmac("sha256", endpoint.secret).update(body).digest("hex");
  return { id: randomUUID(), endpointId: endpoint.id, eventId, payload, signature, timestamp, idempotencyKey: `siem:${endpoint.id}:${eventId}` };
}
export function verifyDelivery(endpoint: SiemEndpoint, d: SignedDelivery, now = Date.now(), replayWindowMs = 5 * 60 * 1000): boolean {
  if (Math.abs(now - d.timestamp) > replayWindowMs) return false;
  const body = JSON.stringify({ eventId: d.eventId, payload: d.payload, timestamp: d.timestamp });
  const expect = createHmac("sha256", endpoint.secret).update(body).digest("hex");
  const a = Buffer.from(d.signature, "hex"); const b = Buffer.from(expect, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
export interface DeliveryRecord { delivery: SignedDelivery; status: "delivered" | "buffered" | "failed"; attempts: number; deliveredAt: string | null; }
export class SiemDeliveryLog {
  records = new Map<string, DeliveryRecord>();
  seenKeys = new Set<string>();
  deliver(endpoint: SiemEndpoint, eventId: string, payload: Record<string, unknown>, endpointUp: boolean): { record: DeliveryRecord; duplicate: boolean } {
    const key = `siem:${endpoint.id}:${eventId}`;
    const existing = [...this.records.values()].find(r => r.delivery.idempotencyKey === key && r.status === "delivered");
    if (existing) return { record: existing, duplicate: true };
    const d = signDelivery(endpoint, eventId, payload);
    const rec: DeliveryRecord = { delivery: d, status: endpointUp ? "delivered" : "buffered", attempts: 1, deliveredAt: endpointUp ? new Date().toISOString() : null };
    this.records.set(d.id, rec); this.seenKeys.add(key);
    return { record: rec, duplicate: false };
  }
  retryBuffered(): number { let n = 0; for (const r of this.records.values()) { if (r.status === "buffered") { r.status = "delivered"; r.attempts++; r.deliveredAt = new Date().toISOString(); n++; } } return n; }
  replayFrom(endpoint: SiemEndpoint, fromTs: number, events: { eventId: string; payload: Record<string, unknown>; ts: number }[], endpointUp: boolean): { delivered: number; duplicatesSkipped: number } {
    let delivered = 0; let duplicatesSkipped = 0;
    for (const e of events.filter(x => x.ts >= fromTs)) {
      const key = `siem:${endpoint.id}:${e.eventId}`;
      if (this.seenKeys.has(key) && [...this.records.values()].some(r => r.delivery.idempotencyKey === key && r.status === "delivered")) { duplicatesSkipped++; continue; }
      const res = this.deliver(endpoint, e.eventId, e.payload, endpointUp); if (!res.duplicate) delivered++;
    }
    return { delivered, duplicatesSkipped };
  }
  redeliver(deliveryId: string): DeliveryRecord | null { const r = this.records.get(deliveryId); if (!r) return null; r.attempts++; r.status = "delivered"; r.deliveredAt = new Date().toISOString(); return r; }
  list(): DeliveryRecord[] { return [...this.records.values()]; }
}
