
import { z } from "zod";
import { lineageDiff } from "@agentguard/shared";
import { ok, err, reqId, serverError} from "@/lib/api";
const lineageSchema = z.object({ modelVersion: z.string(), promptTemplateVersion: z.string(), toolVersions: z.record(z.string()), policyVersion: z.number(), sdkVersion: z.string() });
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => ({})); const parsed = z.object({ old: lineageSchema, new: lineageSchema }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid lineage diff request", rid, 400, parsed.error.issues); return ok(lineageDiff(parsed.data.old, parsed.data.new), rid); } catch (e) { return serverError(rid, e); } }
