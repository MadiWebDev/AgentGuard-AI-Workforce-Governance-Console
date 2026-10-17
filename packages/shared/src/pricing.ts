
export interface ModelPrice { model: string; provider: string; inputPer1k: number; outputPer1k: number; cachedPer1k?: number; effectiveFrom: string; sourceUrl: string; sourceDate: string; approximate: boolean; }
export const MODEL_PRICING: ModelPrice[] = [
  { model: "gpt-4o", provider: "openai", inputPer1k: 0.0025, outputPer1k: 0.01, cachedPer1k: 0.00125, effectiveFrom: "2024-05-13", sourceUrl: "https://openai.com/api/pricing/", sourceDate: "2026-10-17", approximate: true },
  { model: "gpt-4o-mini", provider: "openai", inputPer1k: 0.00015, outputPer1k: 0.0006, effectiveFrom: "2024-07-18", sourceUrl: "https://openai.com/api/pricing/", sourceDate: "2026-10-17", approximate: true },
  { model: "claude-sonnet-4-5", provider: "anthropic", inputPer1k: 0.003, outputPer1k: 0.015, cachedPer1k: 0.0003, effectiveFrom: "2025-09-29", sourceUrl: "https://www.anthropic.com/pricing", sourceDate: "2026-10-17", approximate: true },
  { model: "claude-haiku-4-5", provider: "anthropic", inputPer1k: 0.001, outputPer1k: 0.005, effectiveFrom: "2025-10-01", sourceUrl: "https://www.anthropic.com/pricing", sourceDate: "2026-10-17", approximate: true },
  { model: "gemini-2.0-flash", provider: "google", inputPer1k: 0.0001, outputPer1k: 0.0004, effectiveFrom: "2025-02-05", sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing", sourceDate: "2026-10-17", approximate: true },
];
export function getPricing(model?: string): ModelPrice | undefined { if (!model) return undefined; return MODEL_PRICING.find(m=>m.model===model) ?? MODEL_PRICING.find(m=>model.startsWith(m.model)); }
export function computeCost(model: string|undefined, tokensIn=0, tokensOut=0, cached=0): number { const p=getPricing(model); if(!p) return 0; const cachedCost = cached>0 ? (cached/1000)*(p.cachedPer1k ?? p.inputPer1k) : 0; const regularIn = Math.max(0, tokensIn-cached); return Number(((regularIn/1000)*p.inputPer1k + (tokensOut/1000)*p.outputPer1k + cachedCost).toFixed(6)); }
