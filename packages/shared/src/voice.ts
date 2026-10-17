
import { ApiError } from "./errors";
import { redactText } from "./redaction";

/**
 * C10 — Voice agent governance.
 * Streaming STT behind a provider interface; policy enforcement on the
 * transcript; violation triggers barge-in (warn / terminate) and logs a
 * guardrail_triggered event with the audio segment preserved as evidence.
 * Transcripts are redacted via the existing PII pipeline before storage.
 */
export interface SttSegment { text: string; startMs: number; endMs: number }
export interface SttResult { transcript: string; segments: SttSegment[] }
export interface SttProvider { name: string; transcribe(audioBase64: string): Promise<SttResult>; }

/** Mock STT for dev/test: decodes a scripted transcript carried in the test fixture. The fixture format is `script:<transcript>` base64-encoded. */
export class MockStt implements SttProvider {
  name = "mock";
  async transcribe(audioBase64: string): Promise<SttResult> {
    let decoded = "";
    try { decoded = Buffer.from(audioBase64, "base64").toString("utf-8"); } catch { throw new ApiError("INVALID_AUDIO", 400, "Audio chunk must be base64"); }
    if (!decoded.startsWith("script:")) throw new ApiError("MOCK_STT_SCRIPT_REQUIRED", 400, "MockStt expects a base64-encoded `script:<transcript>` fixture");
    const transcript = decoded.slice("script:".length);
    return { transcript, segments: [{ text: transcript, startMs: 0, endMs: transcript.length * 20 }] };
  }
}
export class RealSttAdapter implements SttProvider {
  name = "real";
  async transcribe(_audioBase64: string): Promise<SttResult> {
    throw new ApiError("STT_NOT_CONFIGURED", 503, "STT provider not configured: set STT_PROVIDER + STT_API_KEY. No live transcription is performed until configured.");
  }
}

export interface VoiceGuardPolicy { id: string; pattern: string; action: "warn" | "terminate"; message: string }
export interface VoiceEnforcement {
  violation: boolean;
  matchedRule?: string;
  bargeIn: boolean;
  bargeInAction?: { type: "warn" | "terminate"; message: string };
  redactedTranscript: string;
  redactionCount: number;
  guardrailEvent: { type: "guardrail_triggered"; ruleId?: string; at: string } | null;
}

export function enforceVoiceTranscript(transcript: string, policies: VoiceGuardPolicy[]): VoiceEnforcement {
  const redacted = redactText(transcript);
  for (const p of policies) {
    let re: RegExp;
    try { re = new RegExp(p.pattern, "i"); } catch { throw new ApiError("INVALID_VOICE_PATTERN", 400, `Invalid voice guard regex: ${p.pattern}`); }
    if (re.test(transcript)) {
      return {
        violation: true,
        matchedRule: p.id,
        bargeIn: true,
        bargeInAction: { type: p.action, message: p.message },
        redactedTranscript: redacted.redacted,
        redactionCount: redacted.count,
        guardrailEvent: { type: "guardrail_triggered", ruleId: p.id, at: new Date().toISOString() },
      };
    }
  }
  return { violation: false, bargeIn: false, redactedTranscript: redacted.redacted, redactionCount: redacted.count, guardrailEvent: null };
}

export interface AudioEvidence { segmentId: string; audioBase64: string; transcript: string; redactedTranscript: string; guardrailEvent: VoiceEnforcement["guardrailEvent"]; }

/** Full voice check: transcribe -> enforce -> preserve audio segment as evidence. Returns wall-clock latency for PERFORMANCE.md. */
export async function checkVoiceCall(
  stt: SttProvider,
  audioBase64: string,
  policies: VoiceGuardPolicy[],
  segmentId = `seg-${Date.now()}`,
): Promise<{ enforcement: VoiceEnforcement; evidence: AudioEvidence; latencyMs: number }> {
  const t0 = Date.now();
  let result: SttResult;
  try { result = await stt.transcribe(audioBase64); }
  catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("STT_FAILED", 502, "STT provider failed");
  }
  const enforcement = enforceVoiceTranscript(result.transcript, policies);
  const latencyMs = Date.now() - t0;
  const evidence: AudioEvidence = {
    segmentId,
    audioBase64,
    transcript: result.transcript,
    redactedTranscript: enforcement.redactedTranscript,
    guardrailEvent: enforcement.guardrailEvent,
  };
  return { enforcement, evidence, latencyMs };
}

/**
 * STT-down fail mode. failMode "fail-closed" blocks the call leg;
 * "fail-open" lets the call continue UNGOVERNED only when explicitly
 * configured — and the result is always flagged ungoverned.
 */
export function sttDownDecision(failMode: "fail-closed" | "fail-open"): { allowed: boolean; ungoverned: boolean; reason: string } {
  if (failMode === "fail-open") return { allowed: true, ungoverned: true, reason: "STT down; call continues UNGOVERNED per explicit fail-open configuration" };
  return { allowed: false, ungoverned: false, reason: "STT down; call leg blocked (fail-closed)" };
}
