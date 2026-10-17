export default function Page(){ return (<div><h1 style={{fontSize:28}}>Onboarding — under 5 minutes</h1><ol className="card" style={{lineHeight:2,marginTop:12}}><li>1. Create org (demo: org_demo)</li><li>2. Register first agent</li><li>3. Copy SDK snippet (TS / Python / curl / MCP)</li><li>4. Send a test event — see it in Traces</li></ol><pre className="card" style={{marginTop:12}}>{`import { AgentGuard } from "@agentguard/sdk-ts";
const ag = new AgentGuard({ apiKey: "ag_live_...", baseUrl: "http://localhost:3000" });
await ag.track({ type: "tool_call", traceId: "tr_1", agentId: "agent_1", tool: "search" });
const d = await ag.checkPolicy({ tool: "deploy", cost: 5 });
`}</pre><p style={{fontSize:13,color:"#64748b"}}>Playwright covers signup → onboarding → test event in tests/e2e (manual in this environment).</p></div>); }
