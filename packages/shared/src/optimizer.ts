
export interface OptimizerInput { agentId: string; runs: number; avgCostPerRun: number; errorRate: number; cacheHitRate: number; batchableShare: number; }
export interface Recommendation { id: string; type: "model_downgrade" | "cache_hit" | "batching"; projectedMonthlySavingsUsd: number; risk: "low" | "medium"; applyType: "safe" | "approval_required"; detail: string; }
export function recommendOptimizations(input: OptimizerInput, opts?: { errorThreshold?: number }): Recommendation[] {
  const threshold = opts?.errorThreshold ?? 0.05;
  const monthlyCost = input.runs * input.avgCostPerRun;
  const recs: Recommendation[] = [];
  if (input.errorRate < threshold) recs.push({ id: `${input.agentId}-downgrade`, type: "model_downgrade", projectedMonthlySavingsUsd: Math.round(monthlyCost * 0.3 * 100) / 100, risk: "low", applyType: "approval_required", detail: `Error rate ${(input.errorRate * 100).toFixed(1)}% below ${(threshold * 100).toFixed(0)}% guardrail — downgrade model for ~30% saving.` });
  if (input.cacheHitRate < 0.5) recs.push({ id: `${input.agentId}-cache`, type: "cache_hit", projectedMonthlySavingsUsd: Math.round(monthlyCost * (0.5 - input.cacheHitRate) * 0.8 * 100) / 100, risk: "low", applyType: "safe", detail: "Enable prompt/response caching to lift hit rate toward 50%." });
  if (input.batchableShare > 0.2) recs.push({ id: `${input.agentId}-batch`, type: "batching", projectedMonthlySavingsUsd: Math.round(monthlyCost * input.batchableShare * 0.25 * 100) / 100, risk: "low", applyType: "safe", detail: `Batch ${Math.round(input.batchableShare * 100)}% of calls.` });
  return recs.sort((a, b) => b.projectedMonthlySavingsUsd - a.projectedMonthlySavingsUsd);
}
export function totalSavings(recs: Recommendation[]): number { return Math.round(recs.reduce((a, r) => a + r.projectedMonthlySavingsUsd, 0) * 100) / 100; }
export function applyRecommendation(rec: Recommendation, state: { cachingEnabled: boolean; batchingEnabled: boolean }): { state: { cachingEnabled: boolean; batchingEnabled: boolean }; applied: boolean; requiresApproval: boolean } {
  if (rec.applyType !== "safe") return { state, applied: false, requiresApproval: true };
  const next = { ...state };
  if (rec.type === "cache_hit") next.cachingEnabled = true;
  if (rec.type === "batching") next.batchingEnabled = true;
  return { state: next, applied: true, requiresApproval: false };
}
export function replayWithCache(events: { costUsd: number; cacheable: boolean }[], cachingEnabled: boolean): { originalCost: number; replayCost: number; saved: number } {
  const original = events.reduce((a, e) => a + e.costUsd, 0);
  const replay = events.reduce((a, e) => a + (cachingEnabled && e.cacheable ? e.costUsd * 0.1 : e.costUsd), 0);
  return { originalCost: Math.round(original * 100) / 100, replayCost: Math.round(replay * 100) / 100, saved: Math.round((original - replay) * 100) / 100 };
}
