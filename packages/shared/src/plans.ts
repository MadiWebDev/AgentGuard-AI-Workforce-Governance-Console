
export type PlanName = "Free"|"Pro"|"Team"|"Enterprise";
export interface PlanLimits { agents: number| "unlimited"; eventsPerMonth: number; retentionDays: number; addons: boolean; priceMonthly: number; priceYearly: number; }
export const PLANS: Record<PlanName, PlanLimits> = {
  Free: { agents: 1, eventsPerMonth: 10000, retentionDays: 7, addons: false, priceMonthly: 0, priceYearly: 0 },
  Pro: { agents: 10, eventsPerMonth: 250000, retentionDays: 30, addons: false, priceMonthly: 49, priceYearly: 490 },
  Team: { agents: "unlimited", eventsPerMonth: 2000000, retentionDays: 90, addons: true, priceMonthly: 199, priceYearly: 1990 },
  Enterprise: { agents: "unlimited", eventsPerMonth: Number.MAX_SAFE_INTEGER, retentionDays: 365, addons: true, priceMonthly: 0, priceYearly: 0 },
};
export function getPlanLimits(plan: string): PlanLimits { const p = (PLANS as Record<string, PlanLimits>)[plan]; return p ?? PLANS.Free; }
export function isFeatureAllowed(plan: string, feature: "addons"|"gateway"|"evidence"): boolean { if (feature==="addons") return getPlanLimits(plan).addons; return true; }
export function overageUnits(eventsUsed: number, plan: string): number { const lim = getPlanLimits(plan).eventsPerMonth; if (eventsUsed<=lim) return 0; return Math.ceil((eventsUsed-lim)/10000); }
