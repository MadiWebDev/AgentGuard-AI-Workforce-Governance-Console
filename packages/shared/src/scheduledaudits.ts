
import { ApiError } from "./errors";
import { runControlTests, type ControlDeps, type ControlHistoryEntry } from "./compliance";
import { signManifest, generateEd25519KeyPair, hashContent, type EvidenceManifest } from "./evidence";

/**
 * C6 — Scheduled governance audits.
 * Recurring auto-audits per client org (weekly/monthly): run the real
 * control tests, compile findings, generate a signed evidence pack,
 * deliver it (email + portal adapters), and log the delivery.
 * Delivery adapters: console/mock in dev/test; real adapters throw
 * NOT_CONFIGURED without credentials (never faked).
 */
export interface AuditSchedule {
  id: string;
  orgId: string;
  cadence: "weekly" | "monthly";
  nextRunAt: string;
  enabled: boolean;
}
export interface DeliveryAdapter {
  name: string;
  deliver(packId: string, orgId: string): Promise<{ deliveredAt: string; channel: string }>;
}
export class ConsoleDeliveryAdapter implements DeliveryAdapter {
  name = "console";
  async deliver(packId: string, orgId: string): Promise<{ deliveredAt: string; channel: string }> {
    // Dev/test delivery: logs to console. Production must configure email/portal adapters.
    if (process.env.NODE_ENV === "production") throw new ApiError("DELIVERY_NOT_CONFIGURED", 503, "Console delivery is dev/test-only. Configure email + portal delivery for production.");
    void packId; void orgId;
    return { deliveredAt: new Date().toISOString(), channel: "console" };
  }
}
export class EmailDeliveryAdapter implements DeliveryAdapter {
  name = "email";
  async deliver(_packId: string, _orgId: string): Promise<{ deliveredAt: string; channel: string }> {
    throw new ApiError("EMAIL_NOT_CONFIGURED", 503, "Email delivery not configured: set RESEND_API_KEY. No email is sent until configured.");
  }
}
export class PortalDeliveryAdapter implements DeliveryAdapter {
  name = "portal";
  async deliver(_packId: string, _orgId: string): Promise<{ deliveredAt: string; channel: string }> {
    throw new ApiError("PORTAL_NOT_CONFIGURED", 503, "Portal delivery not configured: portal storage is not set up. No delivery is recorded until configured.");
  }
}
export interface ScheduledAuditResult {
  scheduleId: string;
  orgId: string;
  packId: string;
  manifest: EvidenceManifest;
  controls: ControlHistoryEntry;
  findings: { controlId: string; name: string; pass: boolean }[];
  deliveries: { deliveredAt: string; channel: string }[];
  auditAction: string;
}

export async function runScheduledAudit(
  schedule: AuditSchedule,
  controlDeps: ControlDeps,
  deliveryAdapters: DeliveryAdapter[],
): Promise<ScheduledAuditResult> {
  const controls = runControlTests(controlDeps, `audit-${schedule.id}-${Date.now()}`);
  const findings = controls.controls.map((c) => ({ controlId: c.id, name: c.name, pass: c.pass }));
  const packId = `pack-${schedule.orgId}-${schedule.id}-${Date.now()}`;
  const kp = generateEd25519KeyPair();
  const files = [{ name: "findings.json", sha256: hashContent(JSON.stringify(findings)) }];
  const manifest = signManifest(files, kp.privateKey, kp.publicKey);
  const deliveries: { deliveredAt: string; channel: string }[] = [];
  for (const adapter of deliveryAdapters) {
    deliveries.push(await adapter.deliver(packId, schedule.orgId));
  }
  return { scheduleId: schedule.id, orgId: schedule.orgId, packId, manifest, controls, findings, deliveries, auditAction: "audit.scheduled.delivered" };
}

export function nextRunAfter(cadence: "weekly" | "monthly", fromMs: number): string {
  const d = new Date(fromMs);
  if (cadence === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

/** Scheduler: executes due schedules. Test hook takes `now` so tests run in test time with short cadences. */
export async function runDueSchedules(
  schedules: AuditSchedule[],
  nowMs: number,
  controlDeps: ControlDeps,
  deliveryAdapters: DeliveryAdapter[],
): Promise<{ ran: ScheduledAuditResult[]; schedules: AuditSchedule[] }> {
  const ran: ScheduledAuditResult[] = [];
  const updated = schedules.map((s) => ({ ...s }));
  for (const s of updated) {
    if (!s.enabled) continue;
    if (Date.parse(s.nextRunAt) > nowMs) continue;
    ran.push(await runScheduledAudit(s, controlDeps, deliveryAdapters));
    s.nextRunAt = nextRunAfter(s.cadence, nowMs);
  }
  return { ran, schedules: updated };
}
