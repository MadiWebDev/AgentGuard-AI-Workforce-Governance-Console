
import { ApiError } from "./errors";
export type Region = "EU" | "US";
export function bucketFor(org: { region: Region }): string { return org.region === "EU" ? "eu-bucket" : "us-bucket"; }
export function queueFor(org: { region: Region }): string { return org.region === "EU" ? "eu-queue" : "us-queue"; }
export function authorizeRegion(requestedRegion: Region, orgRegion: Region, orgId: string): { allowed: true } {
  if (requestedRegion !== orgRegion) throw new ApiError("CROSS_REGION_FORBIDDEN", 403, `Cross-region read blocked: org ${orgId} is pinned to ${orgRegion}, requested ${requestedRegion}`);
  return { allowed: true as const };
}
export interface ResidencyRecord { orgId: string; region: Region; keys: string[]; }
export function migrateOrgRegion(org: ResidencyRecord, to: Region): { org: ResidencyRecord; movedKeys: string[]; verified: boolean; audit: { action: string; orgId: string; from: Region; to: Region } } {
  const from = org.region;
  const movedKeys = [...org.keys];
  const next: ResidencyRecord = { orgId: org.orgId, region: to, keys: movedKeys };
  const verified = next.keys.length === org.keys.length && next.keys.every((k, i) => k === org.keys[i]);
  if (!verified) throw new ApiError("MIGRATION_VERIFY_FAILED", 500, "Region migration verification failed");
  return { org: next, movedKeys, verified, audit: { action: "residency.migrated", orgId: org.orgId, from, to } };
}
export function regionForPayload(org: { region: Region }, kind: "payload" | "evidence" | "export"): { bucket: string; queue: string; kind: string } {
  return { bucket: bucketFor(org), queue: queueFor(org), kind };
}
