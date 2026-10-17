
import { z } from "zod";
import { installPack, simulatePack } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, err, reqId, serverError} from "@/lib/api";
export async function POST(req: Request) { const rid = reqId(req.headers); try { const body = await req.json().catch(() => null); const parsed = z.object({ packId: z.string(), recentEvents: z.array(z.object({ tool: z.string().optional(), cost: z.number().optional(), environment: z.string().optional(), riskTier: z.string().optional() })).optional() }).safeParse(body); if (!parsed.success) return err("VALIDATION_ERROR", "Invalid pack install", rid, 400, parsed.error.issues); const inst = installPack(parsed.data.packId, "org_demo"); const sim = simulatePack(inst, parsed.data.recentEvents ?? [{ tool: "deploy-prod", environment: "prod" }]); store.appendAudit("org_demo", "pack.installed", { packId: parsed.data.packId, drafts: inst.draftPolicies.length }); return ok({ install: inst, simulation: sim }, rid); } catch (e) { return serverError(rid, e); } }
