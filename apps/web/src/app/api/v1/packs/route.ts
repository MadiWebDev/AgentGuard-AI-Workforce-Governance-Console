
import { PACKS } from "@agentguard/shared";
import { ok, reqId } from "@/lib/api";
export async function GET(req: Request) { const rid = reqId(req.headers); return ok({ packs: PACKS }, rid); }
