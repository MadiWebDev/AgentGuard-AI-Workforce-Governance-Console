# @agentguard/sdk-ts

```ts
import { AgentGuard } from "@agentguard/sdk-ts";
const ag = new AgentGuard({ apiKey: "ag_live_..." });
await ag.track({ type: "tool_call", traceId: "tr_1", agentId: "agent_1" });
const d = await ag.checkPolicy({ tool: "deploy" });
```
