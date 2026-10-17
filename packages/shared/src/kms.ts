
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { ApiError } from "./errors";
export interface EncryptedPack { ciphertext: string; iv: string; tag: string; keyVersion: number; orgId: string; }
export interface KmsProvider { encrypt(orgId: string, plaintext: string): Promise<EncryptedPack>; decrypt(pack: EncryptedPack): Promise<string>; rotate(orgId: string): Promise<number>; }
function assertMockAllowed(): void {
  if (process.env.NODE_ENV === "production") throw new ApiError("MOCK_KMS_FORBIDDEN", 403, "Mock KMS is test-only and is rejected in production. Configure AWS KMS or Cloudflare KMS.");
}
export class MockKms implements KmsProvider {
  private keys = new Map<string, Map<number, Buffer>>();
  private current = new Map<string, number>();
  constructor() { assertMockAllowed(); }
  private keyFor(orgId: string, version: number): Buffer {
    let org = this.keys.get(orgId); if (!org) { org = new Map(); this.keys.set(orgId, org); }
    let k = org.get(version); if (!k) { k = randomBytes(32); org.set(version, k); }
    return k;
  }
  currentVersion(orgId: string): number { return this.current.get(orgId) ?? 1; }
  async encrypt(orgId: string, plaintext: string): Promise<EncryptedPack> {
    const v = this.currentVersion(orgId); const key = this.keyFor(orgId, v);
    const iv = randomBytes(12); const c = createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([c.update(plaintext, "utf8"), c.final()]);
    return { ciphertext: enc.toString("base64"), iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), keyVersion: v, orgId };
  }
  async decrypt(pack: EncryptedPack): Promise<string> {
    const key = this.keyFor(pack.orgId, pack.keyVersion);
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(pack.iv, "base64")); d.setAuthTag(Buffer.from(pack.tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(pack.ciphertext, "base64")), d.final()]).toString("utf8");
  }
  async rotate(orgId: string): Promise<number> { const next = this.currentVersion(orgId) + 1; this.current.set(orgId, next); this.keyFor(orgId, next); return next; }
  hasVersion(orgId: string, version: number): boolean { return this.keys.get(orgId)?.has(version) ?? false; }
}
export class AwsKmsAdapter implements KmsProvider {
  async encrypt(): Promise<EncryptedPack> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "AWS KMS not configured: set AWS_KMS_KEY_ID and AWS_REGION. No live calls are made by this adapter until configured."); }
  async decrypt(): Promise<string> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "AWS KMS not configured: set AWS_KMS_KEY_ID and AWS_REGION."); }
  async rotate(): Promise<number> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "AWS KMS not configured."); }
}
export class CloudflareKmsAdapter implements KmsProvider {
  async encrypt(): Promise<EncryptedPack> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "Cloudflare KMS not configured: set CLOUDFLARE_KMS_KEY_ID. No live calls are made by this adapter until configured."); }
  async decrypt(): Promise<string> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "Cloudflare KMS not configured."); }
  async rotate(): Promise<number> { throw new ApiError("KMS_NOT_CONFIGURED", 503, "Cloudflare KMS not configured."); }
}
export async function encryptSecret(kms: KmsProvider, orgId: string, plaintext: string): Promise<EncryptedPack> { return kms.encrypt(orgId, plaintext); }
export async function decryptSecret(kms: KmsProvider, pack: EncryptedPack): Promise<string> { return kms.decrypt(pack); }
export async function reEncryptAll(kms: KmsProvider, packs: EncryptedPack[]): Promise<EncryptedPack[]> {
  const out: EncryptedPack[] = [];
  for (const p of packs) { const plain = await kms.decrypt(p); out.push(await kms.encrypt(p.orgId, plain)); }
  return out;
}
/** Only revoke an old key version after every pack has been re-encrypted to a newer version. */
export function revokeOldVersion(packs: EncryptedPack[], oldVersion: number): { revoked: boolean; remainingOnOld: number } {
  const remaining = packs.filter(p => p.keyVersion === oldVersion).length;
  if (remaining > 0) return { revoked: false, remainingOnOld: remaining };
  return { revoked: true, remainingOnOld: 0 };
}
