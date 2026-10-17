
import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify, createHash } from "node:crypto";
import { ApiError } from "./errors";
import { hashContent, signManifest, verifyManifest, type EvidenceManifest } from "./evidence";
export interface TimestampProof { root: string; timestamp: string; prevProofHash: string; signature: string; publicKey: string; txId?: string; provider: string; }
export interface TimestampingProvider { anchor(root: string): Promise<{ proof: TimestampProof; status: "anchored" | "pending" }>; verify(root: string, proof: TimestampProof): boolean; }
export function merkleRootForPack(manifest: EvidenceManifest): string { return hashContent(JSON.stringify([...manifest.files].sort((a, b) => a.name.localeCompare(b.name)))); }
/**
 * Local timestamping: Ed25519-signed, hash-chained proofs (OTS-style shape).
 * The proof carries its own public key, so a pack verifies OFFLINE from the
 * pack alone — no secret, no live service. Test-only: rejected in production.
 * Real OpenTimestamps/EVM adapters below throw NOT_CONFIGURED until configured.
 */
export class LocalTimestampingProvider implements TimestampingProvider {
  private keypair: { publicKey: string; privateKey: string };
  private prevProofHash = "GENESIS";
  constructor() {
    if (process.env.NODE_ENV === "production") throw new ApiError("MOCK_TIMESTAMP_FORBIDDEN", 403, "Local timestamping is test-only and is rejected in production. Configure OpenTimestamps or an EVM chain.");
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    this.keypair = { publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(), privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString() };
  }
  async anchor(root: string): Promise<{ proof: TimestampProof; status: "anchored" | "pending" }> {
    const timestamp = new Date().toISOString();
    const canon = JSON.stringify({ root, timestamp, prevProofHash: this.prevProofHash });
    const signature = cryptoSign(null, Buffer.from(canon), this.keypair.privateKey).toString("base64");
    const proof: TimestampProof = { root, timestamp, prevProofHash: this.prevProofHash, signature, publicKey: this.keypair.publicKey, provider: "local-ots-style" };
    this.prevProofHash = createHash("sha256").update(canon + signature).digest("hex");
    return { proof, status: "anchored" };
  }
  verify(root: string, proof: TimestampProof): boolean {
    if (proof.root !== root) return false;
    const canon = JSON.stringify({ root: proof.root, timestamp: proof.timestamp, prevProofHash: proof.prevProofHash });
    try { return cryptoVerify(null, Buffer.from(canon), proof.publicKey, Buffer.from(proof.signature, "base64")); } catch { return false; }
  }
}
export class OpenTimestampsAdapter implements TimestampingProvider {
  async anchor(_root: string): Promise<{ proof: TimestampProof; status: "anchored" | "pending" }> { throw new ApiError("OTS_NOT_CONFIGURED", 503, "OpenTimestamps not configured: set OTS_CALENDAR_URL. No live OTS calls are made until configured."); }
  verify(_root: string, _proof: TimestampProof): boolean { throw new ApiError("OTS_NOT_CONFIGURED", 503, "OpenTimestamps not configured: set OTS_CALENDAR_URL."); }
}
export class EvmAnchorAdapter implements TimestampingProvider {
  async anchor(_root: string): Promise<{ proof: TimestampProof; status: "anchored" | "pending" }> { throw new ApiError("EVM_NOT_CONFIGURED", 503, "EVM anchoring not configured: set EVM_RPC_URL and EVM_ANCHOR_CONTRACT. No live chain calls are made until configured."); }
  verify(_root: string, _proof: TimestampProof): boolean { throw new ApiError("EVM_NOT_CONFIGURED", 503, "EVM anchoring not configured: set EVM_RPC_URL and EVM_ANCHOR_CONTRACT."); }
}
/** Cost per anchor in USD. Local ~0. OpenTimestamps: calendar servers are free to use (no per-anchor fee); EVM: gas varies — see RUNBOOK. */
export function estimateAnchorCost(provider: string): number { if (provider === "evm") return NaN; return 0; }
export interface QueuedAnchor { id: string; root: string; status: "pending" | "anchored"; proof?: TimestampProof; attempts: number; }
/** Anchor queue: when the timestamping service is down, anchors queue, retry, and stay marked pending — never silently skipped. */
export class AnchorQueue {
  private queue: QueuedAnchor[] = []; private seq = 0;
  queueAnchor(root: string): QueuedAnchor { const q: QueuedAnchor = { id: `anchor-${++this.seq}`, root, status: "pending", attempts: 0 }; this.queue.push(q); return q; }
  async retryQueued(provider: TimestampingProvider): Promise<{ anchored: number; stillPending: number }> {
    let anchored = 0;
    for (const q of this.queue.filter(x => x.status === "pending")) {
      q.attempts++;
      try { const r = await provider.anchor(q.root); q.proof = r.proof; q.status = r.status; if (r.status === "anchored") anchored++; } catch { /* stays pending */ }
    }
    return { anchored, stillPending: this.queue.filter(x => x.status === "pending").length };
  }
  list(): QueuedAnchor[] { return [...this.queue]; }
}
export interface AnchoredPack { files: { name: string; sha256: string }[]; manifest: EvidenceManifest; proof: TimestampProof; root: string; }
export function verifyPackWithAnchor(pack: AnchoredPack, fileContents: Record<string, string | Buffer>, provider: TimestampingProvider): { manifestOk: boolean; anchorOk: boolean; root: string } {
  const manifestOk = verifyManifest(pack.manifest, fileContents).ok;
  const root = merkleRootForPack(pack.manifest);
  const anchorOk = manifestOk && provider.verify(root, pack.proof) && pack.root === root;
  return { manifestOk, anchorOk, root };
}
export function anchorPack(manifest: EvidenceManifest, provider: TimestampingProvider): Promise<{ proof: TimestampProof; status: "anchored" | "pending" }> { return provider.anchor(merkleRootForPack(manifest)); }
export { signManifest };
