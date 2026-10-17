
import { z } from "zod";
import { MockAttestationIssuer } from "@agentguard/shared";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ workloadId: z.string().min(1), tier: z.enum(["low", "medium", "high", "critical"]) }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid attestation request", rid, 400, parsed.error.issues); if (process.env.NODE_ENV === "production") return err("MOCK_ATTESTATION_FORBIDDEN", "Mock attestation is test-only", rid, 403); const tok = new MockAttestationIssuer().issue(parsed.data.workloadId, parsed.data.tier); return ok(tok, rid); } catch (e) { return serverError(rid, e); } }
