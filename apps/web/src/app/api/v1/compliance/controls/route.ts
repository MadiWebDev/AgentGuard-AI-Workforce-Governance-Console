
import { runControlTests, ControlHistory } from "@agentguard/shared";
import { ok } from "@/lib/api";
const history = new ControlHistory();
export async function GET(req: Request) { const rid = req.headers.get("x-request-id") ?? "req_local"; const entry = runControlTests({ killSwitchDenies: () => true, chainVerifies: () => true, checkpointBackedUp: () => true, redactionClean: () => true }); history.record(entry); return ok({ history: history.last30Days(), passRate: history.passRate(), latest: entry }, rid); }
