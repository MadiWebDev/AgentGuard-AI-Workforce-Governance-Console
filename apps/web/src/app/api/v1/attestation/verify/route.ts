
import { z } from "zod";
import { MockAttestationIssuer } from "@agentguard/shared";
import { ok, err, reqId } from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ token: z.string().min(1) }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid attestation verify request", rid, 400, parsed.error.issues); if (process.env.NODE_ENV === "production") return err("MOCK_ATTESTATION_FORBIDDEN", "Mock attestation is test-only", rid, 403); return ok(new MockAttestationIssuer().verify(parsed.data.token), rid); } catch (e) { return err("INTERNAL_ERROR", e instanceof Error ? e.message : "error", rid, 500); } }
