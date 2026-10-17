# AgentGuard MCP Server

Config for Claude Desktop:
```json
{ "mcpServers": { "agentguard": { "command": "node", "args": ["packages/mcp-server/dist/index.js"], "env": { "AGENTGUARD_API_KEY": "ag_live_..." } } } }
```
Tools: agentguard_check_policy, agentguard_request_approval, agentguard_get_approval_status, agentguard_log_event.
