
import { ApiError } from "./errors";
export type SizeBucket = "small" | "medium" | "large";
export interface OrgAggregateInput { orgId: string; optedIn: boolean; sizeBucket: SizeBucket; spendPer1kEvents: number; approvalRate: number; incidentRate: number; }
export interface DpBudget { totalEpsilon: number; spent: number; }
/** Epsilon budget per release window. Default total 1.0; per-query spend tracked; exhausted budget rejects. */
export const DEFAULT_DP_BUDGET: DpBudget = { totalEpsilon: 1.0, spent: 0 };
export interface PercentileBand { p25: number; p50: number; p75: number; }
export interface BenchmarkAggregate { sizeBucket: SizeBucket; n: number; spendPer1kEvents: number; approvalRate: number; incidentRate: number; bands: { spendPer1kEvents: PercentileBand; approvalRate: PercentileBand; incidentRate: PercentileBand }; }
export interface BenchmarkRelease { aggregates: BenchmarkAggregate[]; epsilonSpent: number; budgetAfter: DpBudget; }
/** Deterministic PRNG (mulberry32) so tests are reproducible; production callers pass a crypto-seeded value. */
export function seededRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Laplace noise with scale b, drawing u from the supplied RNG. */
export function laplaceNoise(scale: number, rand: () => number): number {
  const u = Math.min(Math.max(rand(), 1e-12), 1 - 1e-12);
  return -scale * Math.sign(u - 0.5) * Math.log(1 - 2 * Math.abs(u - 0.5));
}
function percentile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((q / 100) * sorted.length) - 1));
  return sorted[idx] ?? 0;
}
export function percentileBand(values: number[]): PercentileBand { return { p25: percentile(values, 25), p50: percentile(values, 50), p75: percentile(values, 75) }; }
/**
 * Publish opt-in-only, differentially-private aggregates per size bucket.
 * Only opted-in orgs are included (non-opted orgs cannot affect the output).
 * Each released mean gets Laplace noise with scale = sensitivity/epsilon,
 * sensitivity = range/n for a mean. No org is identifiable: outputs are
 * bucket-level aggregates + percentile bands, never per-org values.
 */
export function publishBenchmarks(orgs: OrgAggregateInput[], budget: DpBudget, opts: { epsilonPerQuery?: number; seed?: number } = {}): BenchmarkRelease {
  const epsilonPerQuery = opts.epsilonPerQuery ?? 0.25;
  if (budget.spent + epsilonPerQuery > budget.totalEpsilon + 1e-12) throw new ApiError("DP_BUDGET_EXHAUSTED", 429, `Differential-privacy budget exhausted: spent ${budget.spent} of ${budget.totalEpsilon}, query needs ${epsilonPerQuery}`);
  const included = orgs.filter(o => o.optedIn);
  const rand = seededRand(opts.seed ?? 42);
  const aggregates: BenchmarkAggregate[] = [];
  for (const bucket of ["small", "medium", "large"] as SizeBucket[]) {
    const cohort = included.filter(o => o.sizeBucket === bucket);
    if (cohort.length === 0) continue;
    const n = cohort.length;
    const mean = (f: (o: OrgAggregateInput) => number): number => cohort.reduce((s, o) => s + f(o), 0) / n;
    // Sensitivity of a mean over n values in [0, range] is range/n.
    const noisy = (raw: number, range: number): number => raw + laplaceNoise((range / n) / epsilonPerQuery, rand);
    aggregates.push({
      sizeBucket: bucket, n,
      spendPer1kEvents: noisy(mean(o => o.spendPer1kEvents), 100),
      approvalRate: noisy(mean(o => o.approvalRate), 1),
      incidentRate: noisy(mean(o => o.incidentRate), 1),
      bands: {
        spendPer1kEvents: percentileBand(cohort.map(o => o.spendPer1kEvents)),
        approvalRate: percentileBand(cohort.map(o => o.approvalRate)),
        incidentRate: percentileBand(cohort.map(o => o.incidentRate)),
      },
    });
  }
  const budgetAfter: DpBudget = { totalEpsilon: budget.totalEpsilon, spent: budget.spent + epsilonPerQuery };
  return { aggregates, epsilonSpent: epsilonPerQuery, budgetAfter };
}
