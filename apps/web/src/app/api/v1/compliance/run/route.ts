import { runControlTests, alertOnFail } from "@agentguard/shared";
import { ok, err, reqId } from "@/lib/api";
import { store } from "@/server/store";
export async function POST(req: Request) { const rid = reqId(req.headers); try { if (!store.hasCheckpoint()) store.createCheckpoint("org_demo"); const entry = runControlTests({ killSwitchDenies: () => store.killSwitchDenies(), chainVerifies: () => store.verifyAudit("org_demo").ok, checkpointBackedUp: () => store.hasCheckpoint(), redactionClean: () => store.redactionProbeClean() }); const alert = alertOnFail(entry); return ok({ entry, alert }, rid); } catch (e) { return err("INTERNAL_ERROR", e instanceof Error ? e.message : "error", rid, 500); } }
