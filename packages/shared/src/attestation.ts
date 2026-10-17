
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { ApiError } from "./errors";
import type { RiskTier } from "./types";
export interface AttestedToken { token: string; workloadId: string; tier: RiskTier; issuedAt: number; expiresAt: number; }
export interface AttestationVerifyResult { ok: boolean; workloadId?: string; tier?: RiskTier; reason?: "invalid_signature" | "expired" | "malformed" | "issuer_down"; }
export interface AttestationIssuer { issue(workloadId: string, tier: RiskTier, ttlMs?: number): AttestedToken; verify(token: string): AttestationVerifyResult; }
function assertMockAllowed(): void {
  if (process.env.NODE_ENV === "production") throw new ApiError("MOCK_ATTESTATION_FORBIDDEN", 403, "Mock attestation issuer is test-only and is rejected in production. Configure SPIRE/SPIFFE.");
}
/** Mock issuer: HMAC-signed, short-lived tokens bound to workloadId + tier. Test/dev only. */
export class MockAttestationIssuer implements AttestationIssuer {
  private secret: string;
  constructor(secret = "attestation-test-secret") { assertMockAllowed(); this.secret = secret; }
  issue(workloadId: string, tier: RiskTier, ttlMs = 5 * 60 * 1000): AttestedToken {
    const issuedAt = Date.now(); const expiresAt = issuedAt + ttlMs;
    const payload = JSON.stringify({ workloadId, tier, issuedAt, expiresAt, jti: randomUUID() });
    const segment = Buffer.from(payload).toString("base64url");
    const sig = createHmac("sha256", this.secret).update(segment).digest("hex");
    return { token: `${segment}.${sig}`, workloadId, tier, issuedAt, expiresAt };
  }
  verify(token: string): AttestationVerifyResult {
    const parts = token.split(".");
    if (parts.length !== 2) return { ok: false, reason: "malformed" };
    const segment = parts[0] ?? "";
    const sigPart = parts[1] ?? "";
    if (!/^[0-9a-f]{64}$/.test(sigPart)) return { ok: false, reason: "invalid_signature" };
    let payload: { workloadId: string; tier: RiskTier; issuedAt: number; expiresAt: number };
    try { payload = JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as typeof payload; } catch { return { ok: false, reason: "malformed" }; }
    if (Buffer.from(JSON.stringify(payload)).toString("base64url") !== segment) return { ok: false, reason: "malformed" };
    const expect = createHmac("sha256", this.secret).update(segment).digest("hex");
    const a = Buffer.from(parts[1] ?? "", "hex"); const b = Buffer.from(expect, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "invalid_signature" };
    if (Date.now() > payload.expiresAt) return { ok: false, reason: "expired", workloadId: payload.workloadId, tier: payload.tier };
    return { ok: true, workloadId: payload.workloadId, tier: payload.tier };
  }
}
/** SPIFFE/SPIRE adapter: throws until a real SPIRE agent endpoint is configured. */
export class SpireIssuerAdapter implements AttestationIssuer {
  issue(_workloadId: string, _tier: RiskTier, _ttlMs?: number): AttestedToken { throw new ApiError("ATTESTATION_NOT_CONFIGURED", 503, "SPIRE not configured: set SPIRE_AGENT_ADDRESS and SPIRE_TRUST_DOMAIN. No live SPIRE calls are made until configured."); }
  verify(_token: string): AttestationVerifyResult { throw new ApiError("ATTESTATION_NOT_CONFIGURED", 503, "SPIRE not configured: set SPIRE_AGENT_ADDRESS and SPIRE_TRUST_DOMAIN."); }
}
export function attestationRequired(tier: RiskTier): boolean { return tier === "high" || tier === "critical"; }
export interface AttestedCallInput { tier: RiskTier; apiKeyValid: boolean; attestationToken?: string; issuer?: AttestationIssuer; issuerDown?: boolean; failMode?: "fail-open" | "fail-closed"; }
export interface AttestedCallResult { allowed: boolean; reason: string; auditAction?: string; }
/**
 * Gate for policy/check + ingest on high/critical tiers. Low/medium tiers
 * keep API-key-only auth. Issuer-down follows the agent's fail-mode.
 */
export function authorizeAttestedCall(input: AttestedCallInput): AttestedCallResult {
  if (!input.apiKeyValid) return { allowed: false, reason: "invalid API key", auditAction: "attestation.api_key_invalid" };
  if (!attestationRequired(input.tier)) return { allowed: true, reason: "attestation not required for tier" };
  if (input.issuerDown) {
    if (input.failMode === "fail-open") return { allowed: true, reason: "attestation issuer down; fail-open", auditAction: "attestation.issuer_down_fail_open" };
    return { allowed: false, reason: "attestation issuer down; fail-closed", auditAction: "attestation.issuer_down_fail_closed" };
  }
  if (!input.attestationToken) return { allowed: false, reason: "attestation required for high/critical tier", auditAction: "attestation.missing" };
  if (!input.issuer) return { allowed: false, reason: "attestation issuer unavailable", auditAction: "attestation.issuer_unavailable" };
  const v = input.issuer.verify(input.attestationToken);
  if (!v.ok) return { allowed: false, reason: `attestation ${v.reason ?? "invalid"}`, auditAction: `attestation.${v.reason ?? "invalid"}` };
  return { allowed: true, reason: "attested" };
}
