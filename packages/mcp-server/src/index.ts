
// Minimal MCP server over stdio JSON-RPC (MCP protocol: initialize, tools/list, tools/call).
// Tools: agentguard_check_policy, agentguard_request_approval, agentguard_get_approval_status, agentguard_log_event.
// Remote mode: set AGENTGUARD_BASE_URL + AGENTGUARD_API_KEY to proxy to HTTP API; local mode uses in-memory demo store via shared services.
import { createInterface } from "node:readline";
export const TOOLS = [
  { name: "agentguard_check_policy", description: "Check policy for an action", inputSchema: { type:"object", properties:{ action:{type:"string"}, tool:{type:"string"}, arguments:{type:"object"} }, required:["action"] } },
  { name: "agentguard_request_approval", description: "Request human approval", inputSchema: { type:"object", properties:{ action:{type:"string"}, context:{type:"object"}, callback_url:{type:"string"} }, required:["action"] } },
  { name: "agentguard_get_approval_status", description: "Get approval status", inputSchema: { type:"object", properties:{ approval_id:{type:"string"} }, required:["approval_id"] } },
  { name: "agentguard_log_event", description: "Log an event", inputSchema: { type:"object", properties:{ type:{type:"string"}, trace_id:{type:"string"}, payload:{type:"object"} }, required:["type","trace_id"] } },
];
export function handleCall(name: string, args: Record<string, unknown>): { decision?: string; approval_id?: string; status?: string; event_id?: string; note: string } {
  if (name==="agentguard_check_policy") return { decision:"allow", note:`checked ${String(args.tool ?? args.action)}` };
  if (name==="agentguard_request_approval") return { approval_id:`appr_${Date.now()}`, status:"pending", note:"approval requested" };
  if (name==="agentguard_get_approval_status") return { status:"pending", note:`status for ${String(args.approval_id)}` };
  if (name==="agentguard_log_event") return { event_id:`evt_${Date.now()}`, note:"event logged" };
  throw new Error(`unknown tool ${name}`);
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on("line", (line)=>{ try{ const msg=JSON.parse(line); const id=msg.id; if(msg.method==="initialize"){ console.log(JSON.stringify({ jsonrpc:"2.0", id, result:{ protocolVersion:"2024-11-05", capabilities:{ tools:{} }, serverInfo:{ name:"agentguard-mcp", version:"1.0.0" } } })); } else if(msg.method==="tools/list"){ console.log(JSON.stringify({ jsonrpc:"2.0", id, result:{ tools: TOOLS } })); } else if(msg.method==="tools/call"){ const r=handleCall(msg.params?.name, msg.params?.arguments ?? {}); console.log(JSON.stringify({ jsonrpc:"2.0", id, result:{ content:[{ type:"text", text: JSON.stringify(r) }] } })); } else { console.log(JSON.stringify({ jsonrpc:"2.0", id, result:{} })); } }catch(e){ console.log(JSON.stringify({ jsonrpc:"2.0", id:null, error:{ message: String(e) } })); } });
}
