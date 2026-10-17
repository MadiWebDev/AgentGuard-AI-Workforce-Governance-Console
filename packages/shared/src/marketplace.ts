
import { ApiError } from "./errors";

/**
 * C1 — Agent marketplace with trust scores.
 *
 * Trust is computed ONLY from governance history (incidents, violations,
 * approval compliance, uptime, action counts, chain verification). The input
 * type deliberately has NO self-reported fields (no stars, no marketing copy,
 * no vendor-claimed uptime) — a listing cannot inflate its own score.
 *
 * Weights (documented, sum to 100 at perfect history):
 *   approval compliance (0..1) -> 40 pts
 *   uptime             (0..1) -> 30 pts
 *   clean-history base            -> 30 pts
 *   minus incident penalty: min(20, incidents * 2)
 *   minus violation penalty: min(10, violations * 1)
 */
export interface GovernanceHistory {
  incidents: number;
  violations: number;
  approvalCompliance: number; // 0..1, fraction of approvals that complied with policy
  uptime: number; // 0..1, measured uptime from governance telemetry
  totalActions: number;
  chainVerified: boolean;
}
export const MARKETPLACE_TRUST_THRESHOLD = 60;
export const VERIFIED_GOVERNANCE_THRESHOLD = 80;
export const SCORE_STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export function computeTrustScore(h: GovernanceHistory): number {
  if (h.approvalCompliance < 0 || h.approvalCompliance > 1) throw new ApiError("INVALID_HISTORY", 400, "approvalCompliance must be 0..1");
  if (h.uptime < 0 || h.uptime > 1) throw new ApiError("INVALID_HISTORY", 400, "uptime must be 0..1");
  if (h.incidents < 0 || h.violations < 0 || h.totalActions < 0) throw new ApiError("INVALID_HISTORY", 400, "history counts must be >= 0");
  const raw = h.approvalCompliance * 40 + h.uptime * 30 + 30 - Math.min(20, h.incidents * 2) - Math.min(10, h.violations * 1);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export interface MarketplaceListing {
  id: string;
  agentId: string;
  orgId: string;
  name: string;
  version: string;
  trustScore: number;
  verifiedGovernance: boolean;
  status: "listed" | "rejected";
  lastScoredAt: string;
  versionHistory: { version: string; trustScore: number; at: string }[];
}

export function publishListing(
  agent: { id: string; orgId: string; name: string; version: string },
  history: GovernanceHistory,
  opts?: { threshold?: number; now?: string },
): MarketplaceListing {
  const threshold = opts?.threshold ?? MARKETPLACE_TRUST_THRESHOLD;
  const score = computeTrustScore(history);
  if (score < threshold) throw new ApiError("TRUST_THRESHOLD", 403, `Trust score ${score} below publish threshold ${threshold}`);
  const now = opts?.now ?? new Date().toISOString();
  return {
    id: `listing-${agent.id}`,
    agentId: agent.id,
    orgId: agent.orgId,
    name: agent.name,
    version: agent.version,
    trustScore: score,
    verifiedGovernance: score >= VERIFIED_GOVERNANCE_THRESHOLD && history.chainVerified,
    status: "listed",
    lastScoredAt: now,
    versionHistory: [{ version: agent.version, trustScore: score, at: now }],
  };
}

/** Staleness badge: when the scoring job is down, listings keep the last-known score with a stale flag — never a silently fresh-looking score. */
export function stalenessBadge(listing: MarketplaceListing, nowMs = Date.now()): "fresh" | "stale" {
  return nowMs - Date.parse(listing.lastScoredAt) > SCORE_STALE_AFTER_MS ? "stale" : "fresh";
}

export interface GovernedRegistryEntry {
  id: string;
  agentId: string;
  buyerOrgId: string;
  sellerOrgId: string;
  status: "active";
  governedAt: string;
  trustScoreAtOnboarding: number;
  auditAction: string;
}

/** One-click "govern this agent": creates a governed registry entry in the buyer's org and returns the audit action the caller must log. */
export function buyGovern(
  listing: MarketplaceListing,
  buyerOrgId: string,
  opts?: { now?: string },
): GovernedRegistryEntry {
  if (listing.status !== "listed") throw new ApiError("LISTING_NOT_AVAILABLE", 409, "Listing is not available for purchase");
  if (buyerOrgId === listing.orgId) throw new ApiError("CANNOT_BUY_OWN", 400, "An org cannot buy governance for its own listing");
  const now = opts?.now ?? new Date().toISOString();
  return {
    id: `gov-${listing.agentId}-${buyerOrgId}`,
    agentId: listing.agentId,
    buyerOrgId,
    sellerOrgId: listing.orgId,
    status: "active",
    governedAt: now,
    trustScoreAtOnboarding: listing.trustScore,
    auditAction: "marketplace.buy",
  };
}
