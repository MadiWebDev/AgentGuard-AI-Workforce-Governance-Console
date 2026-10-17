
import { z } from "zod";
import { LocalTimestampingProvider, anchorPack } from "@agentguard/shared";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ manifest: z.object({ files: z.array(z.object({ name: z.string(), sha256: z.string() })), signature: z.string(), publicKey: z.string(), signedAt: z.string() }).passthrough() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid anchor request", rid, 400, parsed.error.issues); if (process.env.NODE_ENV === "production") return err("MOCK_TIMESTAMP_FORBIDDEN", "Local timestamping is test-only", rid, 403); const res = await anchorPack(parsed.data.manifest as never, new LocalTimestampingProvider()); return ok(res, rid); } catch (e) { return serverError(rid, e); } }
