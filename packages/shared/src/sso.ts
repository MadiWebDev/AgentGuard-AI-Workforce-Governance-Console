
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors";
export interface SamlAssertion { issuer: string; audience: string; expiry: number; subject: string; email: string; signature: string; issuedAt: number; }
export interface SsoOrgConfig { orgId: string; issuer: string; audience: string; requireSSO: boolean; roleMapping: Record<string, string>; defaultRole: string; }
export function isMockSamlAllowed(): boolean { return process.env.NODE_ENV !== "production"; }
export function signMockAssertion(input: { issuer: string; audience: string; subject: string; email: string; secret: string; ttlSeconds?: number }): SamlAssertion {
  if (!isMockSamlAllowed()) throw new ApiError("MOCK_SSO_FORBIDDEN", 403, "Mock SAML is test-only and is rejected in production");
  const issuedAt = Date.now(); const expiry = issuedAt + (input.ttlSeconds ?? 300) * 1000;
  const payload = [input.issuer, input.audience, String(expiry), input.subject, input.email].join("|");
  const signature = createHmac("sha256", input.secret).update(payload).digest("hex");
  return { issuer: input.issuer, audience: input.audience, expiry, subject: input.subject, email: input.email, signature, issuedAt };
}
export function verifyMockAssertion(a: SamlAssertion, expected: { audience: string; issuer: string; secret: string }): { ok: boolean; reason?: string } {
  if (!isMockSamlAllowed()) return { ok: false, reason: "mock SAML rejected in production" };
  if (a.audience !== expected.audience) return { ok: false, reason: "audience mismatch" };
  if (a.issuer !== expected.issuer) return { ok: false, reason: "issuer mismatch" };
  if (Date.now() > a.expiry) return { ok: false, reason: "assertion expired" };
  const payload = [a.issuer, a.audience, String(a.expiry), a.subject, a.email].join("|");
  const expectSig = createHmac("sha256", expected.secret).update(payload).digest("hex");
  const aBuf = Buffer.from(a.signature, "hex"); const eBuf = Buffer.from(expectSig, "hex");
  if (aBuf.length !== eBuf.length || !timingSafeEqual(aBuf, eBuf)) return { ok: false, reason: "bad signature" };
  return { ok: true };
}
export function idpInitiatedLoginUrl(baseUrl: string, orgId: string): string { return `${baseUrl.replace(/\/$/, "")}/sso/idp-initiated?orgId=${encodeURIComponent(orgId)}`; }
export function jitProvision(email: string, cfg: SsoOrgConfig): { userId: string; email: string; orgId: string; role: string } {
  const domain = email.split("@")[1] ?? "";
  const role = cfg.roleMapping[domain] ?? cfg.roleMapping[email] ?? cfg.defaultRole;
  return { userId: `jit_${randomUUID()}`, email, orgId: cfg.orgId, role };
}
export function assertPasswordLoginAllowed(cfg: SsoOrgConfig): void {
  if (cfg.requireSSO) throw new ApiError("SSO_REQUIRED", 403, "Password login is blocked: this org requires SSO");
}
export interface SsoSession { id: string; userId: string; orgId: string; createdAt: string; revokedAt: string | null; }
export class SsoSessionStore {
  sessions = new Map<string, SsoSession>();
  create(userId: string, orgId: string): SsoSession { const s: SsoSession = { id: randomUUID(), userId, orgId, createdAt: new Date().toISOString(), revokedAt: null }; this.sessions.set(s.id, s); return s; }
  revokeAllForUser(userId: string): number { let n = 0; for (const s of this.sessions.values()) { if (s.userId === userId && !s.revokedAt) { s.revokedAt = new Date().toISOString(); n++; } } return n; }
  activeForUser(userId: string): SsoSession[] { return [...this.sessions.values()].filter(s => s.userId === userId && !s.revokedAt); }
}
