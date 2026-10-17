
import { z } from "zod";
import { ApiError } from "@agentguard/shared";
import { scimStore } from "@/server/v11-state";
import { store } from "@/server/store";
import { ok, err, reqId } from "@/lib/api";
function auth(req: Request, rid: string) { const t = process.env.SCIM_TOKEN ?? "scim-test-token"; const h = req.headers.get("authorization") ?? ""; if (h !== `Bearer ${t}`) return err("SCIM_UNAUTHORIZED", "Invalid SCIM bearer token", rid, 401); return null; }
export async function GET(req: Request) { const rid = reqId(req.headers); const a = auth(req, rid); if (a) return a; const orgId = req.headers.get("x-org-id") ?? "org_demo"; return ok({ users: scimStore.list(orgId) }, rid); }
export async function POST(req: Request) { const rid = reqId(req.headers); const a = auth(req, rid); if (a) return a; try { const body = await req.json().catch(() => null); const parsed = z.object({ userName: z.string(), email: z.string().email(), displayName: z.string().optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid SCIM user", rid, 400, parsed.error.issues); const orgId = req.headers.get("x-org-id") ?? "org_demo"; const u = scimStore.create(orgId, parsed.data); store.appendAudit(orgId, "scim.user.created", { userId: u.id }); return ok(u, rid, 201); } catch (e) { if (e instanceof ApiError) return err(e.code, e.message, rid, e.status); return err("INTERNAL_ERROR", "error", rid, 500); } }
