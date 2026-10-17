
import { ApiError } from "./errors";
export interface GuardPolicy { id: string; pattern: string; }
export interface GuardrailEvent { type: "guardrail_triggered"; matchedRuleId: string; tokensConsumed: number; tokensAllowed: number; redacted: boolean; at: string; }
export interface StreamInspectResult { terminated: boolean; outputTokens: string[]; matchedRuleId?: string; redactedTranscript: string; guardrailEvent: GuardrailEvent | null; tokensConsumed: number; tokensAllowed: number; }
export interface StreamInspectOptions { windowTokens?: number; guardPolicies: GuardPolicy[]; }
/**
 * Token-stream inspection. Tokens are only *released* after they clear a
 * buffered window (default 20 tokens). When a window matches a content-guard
 * pattern, the stream terminates mid-flight: only pre-window tokens are
 * released, the tail is redacted, and a guardrail_triggered event is returned.
 * The disallowed text therefore never appears in full in the output.
 */
export function inspectStream(tokens: string[], opts: StreamInspectOptions): StreamInspectResult {
  const windowTokens = opts.windowTokens ?? 20;
  if (!Number.isInteger(windowTokens) || windowTokens < 1) throw new ApiError("INVALID_WINDOW", 400, "windowTokens must be a positive integer");
  for (let i = 0; i < tokens.length; i++) {
    const start = Math.max(0, i - windowTokens + 1);
    const windowText = tokens.slice(start, i + 1).join("");
    for (const gp of opts.guardPolicies) {
      let re: RegExp;
      try { re = new RegExp(gp.pattern); } catch { continue; }
      if (re.test(windowText)) {
        const released = tokens.slice(0, start);
        const redactedTranscript = released.join("") + "[REDACTED — STREAM TERMINATED BY GUARDRAIL: safe completion]";
        return { terminated: true, outputTokens: released, matchedRuleId: gp.id, redactedTranscript, guardrailEvent: { type: "guardrail_triggered", matchedRuleId: gp.id, tokensConsumed: i + 1, tokensAllowed: released.length, redacted: true, at: new Date().toISOString() }, tokensConsumed: i + 1, tokensAllowed: released.length };
      }
    }
  }
  return { terminated: false, outputTokens: [...tokens], matchedRuleId: undefined, redactedTranscript: tokens.join(""), guardrailEvent: null, tokensConsumed: tokens.length, tokensAllowed: tokens.length };
}
/** Micro-benchmark: average ms per inspectStream call over `runs` runs. */
export function measureInspectOverhead(tokens: string[], opts: StreamInspectOptions, runs = 200): { avgMs: number; runs: number } {
  const t0 = Date.now();
  for (let i = 0; i < runs; i++) inspectStream(tokens, opts);
  return { avgMs: (Date.now() - t0) / runs, runs };
}
