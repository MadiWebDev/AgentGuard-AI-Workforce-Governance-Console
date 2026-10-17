
import { createHmac, timingSafeEqual } from "node:crypto";
import { PADDLE_TIMESTAMP_TOLERANCE_MS } from "./constants";
export interface PaddleEvent { eventId: string; eventType: string; occurredAt: string; data: { subscriptionId?: string; customerId?: string; priceId?: string; status?: string; orgId?: string; [k: string]: unknown }; }
export function parsePaddleSignature(header: string): { ts: number; h1: string } | null { const parts = Object.fromEntries(header.split(";").map(s=>{ const [k,v]=s.split("="); return [k?.trim(), v?.trim()]; })); if (!parts.ts || !parts.h1) return null; return { ts: Number(parts.ts), h1: parts.h1 }; }
export function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string, now = Date.now()): boolean { const parsed = parsePaddleSignature(signatureHeader); if (!parsed) return false; if (Math.abs(now - parsed.ts*1000) > PADDLE_TIMESTAMP_TOLERANCE_MS) return false; const expected = createHmac("sha256", secret).update(`${parsed.ts}:${rawBody}`).digest("hex"); if (expected.length!==parsed.h1.length) return false; try { return timingSafeEqual(Buffer.from(expected), Buffer.from(parsed.h1)); } catch { return false; } }
export interface SubscriptionState { orgId: string; paddleCustomerId?: string; paddleSubscriptionId?: string; priceId?: string; plan: string; status: string; currentPeriodEnd?: string; lastEventAt: string; }
export function applyPaddleEvent(current: SubscriptionState|null, event: PaddleEvent, seenEventIds: Set<string>): { state: SubscriptionState|null; changed: boolean; reason?: string } {
  if (seenEventIds.has(event.eventId)) return { state: current, changed: false, reason: "duplicate event" };
  if (current && new Date(event.occurredAt).getTime() < new Date(current.lastEventAt).getTime()) return { state: current, changed: false, reason: "out-of-order" };
  seenEventIds.add(event.eventId);
  const base: SubscriptionState = current ?? { orgId: String(event.data.orgId ?? "unknown"), plan: "Free", status: "inactive", lastEventAt: event.occurredAt };
  const next: SubscriptionState = { ...base, lastEventAt: event.occurredAt };
  switch (event.eventType) {
    case "subscription.created": case "subscription.activated": next.status="active"; next.paddleSubscriptionId=String(event.data.subscriptionId ?? next.paddleSubscriptionId ?? ""); next.paddleCustomerId=String(event.data.customerId ?? next.paddleCustomerId ?? ""); if(event.data.priceId) next.priceId=String(event.data.priceId); if(event.data.plan) next.plan=String(event.data.plan); break;
    case "subscription.updated": next.status=String(event.data.status ?? next.status); if(event.data.priceId) next.priceId=String(event.data.priceId); if(event.data.plan) next.plan=String(event.data.plan); break;
    case "subscription.past_due": next.status="past_due"; break;
    case "subscription.paused": next.status="paused"; break;
    case "subscription.resumed": next.status="active"; break;
    case "subscription.canceled": next.status="canceled"; break;
    case "transaction.completed": break;
    case "transaction.payment_failed": next.status="past_due"; break;
    default: break;
  }
  return { state: next, changed: true };
}
