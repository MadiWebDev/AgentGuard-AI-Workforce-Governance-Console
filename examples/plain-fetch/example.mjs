// Plain fetch example — runnable against local stack
const res = await fetch("http://localhost:3000/api/v1/ingest", { method:"POST", headers:{ "content-type":"application/json", "x-api-key": process.env.AGENTGUARD_API_KEY ?? "demo" }, body: JSON.stringify({ events:[{ traceId:"tr_1", agentId:"agent_1", type:"tool_call" }] }) });
console.log("ingest", res.status, await res.text());
