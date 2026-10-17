import { z } from "zod";
import { checkVoiceCall, MockStt, RealSttAdapter, ApiError } from "@agentguard/shared";
import { ok, err, reqId, serverError } from "@/lib/api";
import { store } from "@/server/store";
const bodySchema = z.object({ audioBase64: z.string(), policies: z.array(z.object({ id: z.string(), pattern: z.string(), action: z.enum(["warn", "terminate"]), message: z.string() })), segmentId: z.string().optional(), orgId: z.string().optional() });
export async function POST(req: Request) {
  const rid = reqId(req.headers);
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return err("VALIDATION_ERROR", "Invalid voice body", rid, 400, parsed.error.issues);
    const useReal = process.env.STT_PROVIDER === "real";
    if (process.env.NODE_ENV === "production" && !useReal) return err("STT_MOCK_FORBIDDEN", "MockStt is dev/test-only. Configure a real STT provider (STT_PROVIDER=real + STT_API_KEY) for production.", rid, 503);
    const stt = useReal ? new RealSttAdapter() : new MockStt();
    const { enforcement, evidence, latencyMs } = await checkVoiceCall(stt, parsed.data.audioBase64, parsed.data.policies, parsed.data.segmentId);
    if (enforcement.guardrailEvent) {
      store.appendAudit(parsed.data.orgId ?? "org_demo", "guardrail_triggered", { ruleId: enforcement.matchedRule, segmentId: evidence.segmentId, redactedTranscript: evidence.redactedTranscript });
    }
    return ok({ enforcement, evidence: { segmentId: evidence.segmentId, redactedTranscript: evidence.redactedTranscript, guardrailEvent: evidence.guardrailEvent }, latencyMs }, rid);
  } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return serverError(rid, e); }
}
