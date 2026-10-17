
export interface TraceAction { traceId: string; agentId: string; action: string; tool?: string; sessionId?: string; exfilId?: string; at?: string; metadata?: Record<string, unknown>; }
export interface CollusionAlert { id: string; pattern: "chunked_exfiltration" | "split_bypass"; agents: string[]; reconstructedSequence: string[]; severity: "high" | "medium"; detail: string; quarantined: boolean; }
export interface CollusionResult { alerts: CollusionAlert[]; quarantinedAgentIds: string[]; audit: { action: string; agentId: string; at: string }[]; }
function isChunk(t: TraceAction): boolean { return t.action === "exfiltrate_chunk" || t.action === "send_chunk" || (t.metadata?.chunkIndex !== undefined); }
function isReassembly(t: TraceAction): boolean { return t.action === "reassemble" || t.action === "send_external" || t.action === "exfiltrate"; }
function sortedByTime(ts: TraceAction[]): TraceAction[] { return [...ts].sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "") || a.traceId.localeCompare(b.traceId)); }
/**
 * Graph analysis over traces. Two bypass patterns:
 *  1. chunked_exfiltration — >=2 agents emit chunks sharing one exfilId/sessionId,
 *     and one agent reassembles/sends them out.
 *  2. split_bypass — one agent reads a secret, a DIFFERENT agent sends externally
 *     in the same session: together they equal a denied exfiltration.
 * Auto-quarantine is opt-in per org (autoQuarantine flag); otherwise alert only.
 */
export function detectCollusion(traces: TraceAction[], opts: { autoQuarantine?: boolean } = {}): CollusionResult {
  const alerts: CollusionAlert[] = [];
  const byGroup = new Map<string, TraceAction[]>();
  for (const t of traces) {
    const key = t.exfilId ?? t.sessionId ?? null;
    if (!key) continue;
    byGroup.set(key, [...(byGroup.get(key) ?? []), t]);
  }
  for (const [key, group] of [...byGroup.entries()].sort()) {
    const chunks = group.filter(isChunk);
    const chunkAgents = [...new Set(chunks.map(c => c.agentId))].sort();
    const reassembly = group.filter(isReassembly);
    if (chunks.length >= 2 && chunkAgents.length >= 2 && reassembly.length >= 1) {
      const agents = [...new Set([...chunkAgents, ...reassembly.map(r => r.agentId)])].sort();
      alerts.push({ id: `coll-chunk-${key}`, pattern: "chunked_exfiltration", agents, reconstructedSequence: sortedByTime(group).map(g => g.traceId), severity: "high", detail: `Chunked exfiltration ${key}: ${chunks.length} chunks from ${chunkAgents.length} agents reassembled by ${reassembly.map(r => r.agentId).join(", ")}`, quarantined: false });
    }
    const readers = group.filter(t => t.action === "read_secret" || t.tool === "read-secret");
    const senders = group.filter(t => t.action === "send_external" || t.action === "exfiltrate");
    for (const r of readers) {
      for (const s of senders) {
        if (r.agentId === s.agentId) continue;
        const agents = [r.agentId, s.agentId].sort();
        if (alerts.some(a => a.pattern === "split_bypass" && a.agents.join(",") === agents.join(",") && a.reconstructedSequence.includes(r.traceId))) continue;
        alerts.push({ id: `coll-split-${key}-${r.traceId}-${s.traceId}`, pattern: "split_bypass", agents, reconstructedSequence: sortedByTime([r, s]).map(g => g.traceId), severity: "high", detail: `Split bypass in session ${key}: ${r.agentId} read a secret, ${s.agentId} sent externally — together a denied exfiltration`, quarantined: false });
      }
    }
  }
  const quarantinedAgentIds = opts.autoQuarantine ? [...new Set(alerts.flatMap(a => a.agents))].sort() : [];
  for (const a of alerts) a.quarantined = quarantinedAgentIds.length > 0 && a.agents.every(g => quarantinedAgentIds.includes(g));
  const audit = quarantinedAgentIds.map(agentId => ({ action: "collusion.auto_quarantine", agentId, at: new Date().toISOString() }));
  return { alerts, quarantinedAgentIds, audit };
}
/** False-positive rate on normal traffic = alerts / traces (each alert on normal traffic is a false positive). */
export function falsePositiveRate(normalTraces: TraceAction[], alerts: CollusionAlert[]): number {
  if (normalTraces.length === 0) return 0;
  return alerts.length / normalTraces.length;
}
