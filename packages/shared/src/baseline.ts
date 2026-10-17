
export interface RunEvent { traceId: string; tool: string; costUsd: number; latencyMs: number; error: boolean; }
export interface Baseline { tools: string[]; costPerRun: { mean: number; std: number }; latency: { p50: number; p95: number }; errorRate: number; sampleSize: number; }
function mean(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function std(xs: number[], m: number): number { return xs.length ? Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) : 0; }
function percentile(sorted: number[], p: number): number { if (!sorted.length) return 0; const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length)); return sorted[i] ?? 0; }
export function computeBaseline(events: RunEvent[]): Baseline {
  const costs = events.map(e => e.costUsd); const lat = [...events.map(e => e.latencyMs)].sort((a, b) => a - b);
  const cm = mean(costs);
  return { tools: [...new Set(events.map(e => e.tool))].sort(), costPerRun: { mean: cm, std: std(costs, cm) }, latency: { p50: percentile(lat, 50), p95: percentile(lat, 95) }, errorRate: events.length ? events.filter(e => e.error).length / events.length : 0, sampleSize: events.length };
}
export interface DriftAlert { dimension: string; z: number; detail: string; traceIds: string[]; }
export function detectDrift(baseline: Baseline, recent: RunEvent[]): DriftAlert[] {
  const alerts: DriftAlert[] = [];
  if (!recent.length) return alerts;
  const rc = computeBaseline(recent);
  const costZ = baseline.costPerRun.std > 0 ? (rc.costPerRun.mean - baseline.costPerRun.mean) / baseline.costPerRun.std : (rc.costPerRun.mean > baseline.costPerRun.mean * 2 ? 10 : 0);
  if (Math.abs(costZ) > 3) alerts.push({ dimension: "costPerRun", z: Math.round(costZ * 100) / 100, detail: `Mean cost moved from ${baseline.costPerRun.mean.toFixed(4)} to ${rc.costPerRun.mean.toFixed(4)}`, traceIds: recent.map(r => r.traceId) });
  const newTools = rc.tools.filter(t => !baseline.tools.includes(t));
  if (newTools.length) alerts.push({ dimension: "tools", z: 10, detail: `New tools observed: ${newTools.join(", ")}`, traceIds: recent.filter(r => newTools.includes(r.tool)).map(r => r.traceId) });
  const errZ = rc.errorRate - baseline.errorRate;
  if (errZ > 0.2) alerts.push({ dimension: "errorRate", z: Math.round(errZ * 100) / 100, detail: `Error rate rose from ${baseline.errorRate.toFixed(2)} to ${rc.errorRate.toFixed(2)}`, traceIds: recent.filter(r => r.error).map(r => r.traceId) });
  const latZ = baseline.latency.p95 > 0 ? (rc.latency.p95 - baseline.latency.p95) / baseline.latency.p95 : 0;
  if (latZ > 2) alerts.push({ dimension: "latencyP95", z: Math.round(latZ * 100) / 100, detail: `p95 latency rose from ${baseline.latency.p95}ms to ${rc.latency.p95}ms`, traceIds: recent.map(r => r.traceId) });
  return alerts;
}
export function runNightlyBaselines(groups: Record<string, RunEvent[]>): Record<string, Baseline> {
  const out: Record<string, Baseline> = {};
  for (const [k, v] of Object.entries(groups)) out[k] = computeBaseline(v);
  return out;
}
