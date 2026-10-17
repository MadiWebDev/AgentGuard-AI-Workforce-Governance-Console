
import { hashContent, signManifest, verifyManifest, type EvidenceManifest } from "./evidence";
export interface Lineage { modelVersion: string; promptTemplateVersion: string; toolVersions: Record<string, string>; policyVersion: number; sdkVersion: string; }
export interface TraceWithLineage { traceId: string; lineage?: Lineage; [key: string]: unknown; }
export interface LineageChange { field: string; from: string; to: string; }
export interface LineageDiff { changedFields: string[]; changes: LineageChange[]; summary: string; }
/** Attach lineage to a trace/event record. Backward-compatible: lineage is optional on older records. */
export function attachLineage<T extends { traceId: string }>(trace: T, lineage: Lineage): T & { lineage: Lineage } { return { ...trace, lineage }; }
/** Diff two lineage snapshots: "what changed" for the trace view. */
export function lineageDiff(oldL: Lineage, newL: Lineage): LineageDiff {
  const changes: LineageChange[] = [];
  const check = (field: string, from: string, to: string): void => { if (from !== to) changes.push({ field, from, to }); };
  check("modelVersion", oldL.modelVersion, newL.modelVersion);
  check("promptTemplateVersion", oldL.promptTemplateVersion, newL.promptTemplateVersion);
  check("policyVersion", String(oldL.policyVersion), String(newL.policyVersion));
  check("sdkVersion", oldL.sdkVersion, newL.sdkVersion);
  const tools = [...new Set([...Object.keys(oldL.toolVersions), ...Object.keys(newL.toolVersions)])].sort();
  for (const tool of tools) check(`toolVersions.${tool}`, oldL.toolVersions[tool] ?? "(absent)", newL.toolVersions[tool] ?? "(absent)");
  return { changedFields: changes.map(c => c.field), changes, summary: changes.length === 0 ? "No lineage changes" : `Lineage changed: ${changes.map(c => `${c.field} ${c.from} -> ${c.to}`).join("; ")}` };
}
export interface LineagePack { files: { name: string; sha256: string }[]; manifest: EvidenceManifest; lineage: Lineage; lineageHash: string; }
/** Evidence pack with a lineage block: the lineage hash binds the lineage to the signed manifest. */
export function packWithLineage(files: { name: string; sha256: string }[], lineage: Lineage, privateKeyPem: string, publicKeyPem: string): LineagePack {
  const lineageHash = hashContent(JSON.stringify(lineage));
  const manifest = signManifest([...files, { name: "lineage.json", sha256: lineageHash }], privateKeyPem, publicKeyPem);
  return { files: [...files, { name: "lineage.json", sha256: lineageHash }], manifest, lineage, lineageHash };
}
export function verifyPackWithLineage(pack: LineagePack, fileContents: Record<string, string | Buffer>): { manifestOk: boolean; lineageOk: boolean } {
  const manifestOk = verifyManifest(pack.manifest, { ...fileContents, "lineage.json": JSON.stringify(pack.lineage) }).ok;
  const lineageOk = hashContent(JSON.stringify(pack.lineage)) === pack.lineageHash && pack.manifest.files.some(f => f.name === "lineage.json" && f.sha256 === pack.lineageHash);
  return { manifestOk, lineageOk };
}
