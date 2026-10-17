
export interface ControlDeps { killSwitchDenies: () => boolean; chainVerifies: () => boolean; checkpointBackedUp: () => boolean; redactionClean: () => boolean; }
export interface ControlResult { id: string; name: string; pass: boolean; durationMs: number; evidence: string; at: string; }
export interface ControlHistoryEntry { runId: string; at: string; controls: ControlResult[]; allPass: boolean; }
export interface ComplianceAlert { alert: boolean; failedIds: string[]; message: string; }
const CONTROLS: { id: string; name: string; run: (d: ControlDeps) => boolean; evidencePass: string; evidenceFail: string }[] = [
  { id: "kill-switch-propagation", name: "Kill-switch propagation < 1s (policy/check denies after quarantine)", run: d => d.killSwitchDenies(), evidencePass: "policy/check returned deny immediately after quarantine", evidenceFail: "policy/check did NOT deny after quarantine" },
  { id: "chain-verification", name: "Audit hash-chain verification", run: d => d.chainVerifies(), evidencePass: "audit chain verified end to end", evidenceFail: "audit chain verification failed" },
  { id: "audit-checkpoint-backup", name: "Audit checkpoint backup exists and verifies", run: d => d.checkpointBackedUp(), evidencePass: "latest audit checkpoint exists and verifies", evidenceFail: "audit checkpoint missing or unverifiable" },
  { id: "redaction-nowhere-leak", name: "Redaction nowhere-leak probe", run: d => d.redactionClean(), evidencePass: "probe PII absent from storage, logs, and exports", evidenceFail: "probe PII found somewhere it must not be" },
];
/** Run every control test. Each control catches its own errors: a broken control flips to fail, never crashes the run. */
export function runControlTests(deps: ControlDeps, runId = `run-${Date.now()}`): ControlHistoryEntry {
  const at = new Date().toISOString();
  const controls: ControlResult[] = CONTROLS.map(c => {
    const t0 = Date.now();
    try {
      const pass = c.run(deps);
      return { id: c.id, name: c.name, pass, durationMs: Date.now() - t0, evidence: pass ? c.evidencePass : c.evidenceFail, at };
    } catch (e) {
      return { id: c.id, name: c.name, pass: false, durationMs: Date.now() - t0, evidence: `${c.evidenceFail}: ${e instanceof Error ? e.message : "error"}`, at };
    }
  });
  return { runId, at, controls, allPass: controls.every(c => c.pass) };
}
export function alertOnFail(entry: ControlHistoryEntry): ComplianceAlert {
  const failedIds = entry.controls.filter(c => !c.pass).map(c => c.id);
  return { alert: failedIds.length > 0, failedIds, message: failedIds.length > 0 ? `Compliance controls failing: ${failedIds.join(", ")}` : "All compliance controls passing" };
}
/** Auditor history: 30-day window, pass rate, evidence artifacts per run. */
export class ControlHistory {
  private entries: ControlHistoryEntry[] = [];
  record(entry: ControlHistoryEntry): void { this.entries.push(entry); }
  last30Days(now = Date.now()): ControlHistoryEntry[] {
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    return this.entries.filter(e => Date.parse(e.at) >= cutoff);
  }
  passRate(now = Date.now()): number {
    const rows = this.last30Days(now);
    if (rows.length === 0) return 1;
    const total = rows.reduce((n, r) => n + r.controls.length, 0);
    const passed = rows.reduce((n, r) => n + r.controls.filter(c => c.pass).length, 0);
    return total === 0 ? 1 : passed / total;
  }
  all(): ControlHistoryEntry[] { return [...this.entries]; }
}
