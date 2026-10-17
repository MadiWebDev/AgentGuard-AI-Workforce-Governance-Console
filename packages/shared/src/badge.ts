
import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";

/**
 * C9 — Public trust badge ("Governed by AgentGuard").
 * Signed badge payload {orgId, agentId, trustScore, issuedAt}, Ed25519
 * (same signing pattern as the evidence manifests). verifyBadge checks
 * signature + revocation list. Public endpoint GET /api/badge/verify
 * requires no auth. Revoked orgs verify as {valid:false, reason:"revoked"}.
 */
export interface BadgePayload { orgId: string; agentId: string; trustScore: number; issuedAt: string }
export interface SignedBadge { payload: BadgePayload; signature: string; publicKey: string }

export function generateBadgeKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return { publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(), privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString() };
}
function canonical(payload: BadgePayload): string {
  return JSON.stringify({ orgId: payload.orgId, agentId: payload.agentId, trustScore: payload.trustScore, issuedAt: payload.issuedAt });
}
export function signBadge(payload: BadgePayload, privateKeyPem: string, publicKeyPem: string): SignedBadge {
  const signature = cryptoSign(null, Buffer.from(canonical(payload)), privateKeyPem).toString("base64");
  return { payload, signature, publicKey: publicKeyPem };
}
export function verifyBadge(badge: SignedBadge, revokedOrgIds: ReadonlySet<string>): { valid: boolean; reason: string } {
  if (revokedOrgIds.has(badge.payload.orgId)) return { valid: false, reason: "revoked" };
  if (badge.payload.trustScore < 0 || badge.payload.trustScore > 100) return { valid: false, reason: "invalid-score" };
  try {
    const ok = cryptoVerify(null, Buffer.from(canonical(badge.payload)), badge.publicKey, Buffer.from(badge.signature, "base64"));
    return ok ? { valid: true, reason: "ok" } : { valid: false, reason: "bad-signature" };
  } catch { return { valid: false, reason: "bad-signature" }; }
}
/** Copy-paste embed snippet. The img src points at the public verify endpoint; no JS required. */
export function badgeSnippet(orgId: string, agentId: string, baseUrl = "https://app.agentguard.example"): string {
  const url = `${baseUrl}/api/badge/verify?orgId=${encodeURIComponent(orgId)}&agentId=${encodeURIComponent(agentId)}`;
  return `<a href="${url}"><img src="${url}&format=img" alt="Governed by AgentGuard" /></a>`;
}
