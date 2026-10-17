# API

Base: /api/v1. Auth: agent key via x-api-key (scopes ingest, policy:check) or session headers (x-user-id, x-org-id, x-role) in demo/dev. Production: Better Auth session.

| Method | Path | Purpose |
|---|---|---|
| POST | /api/v1/ingest | batch <=500, <=1MB, idempotent |
| POST | /api/v1/policy/check | allow/deny/require_approval |
| POST | /api/v1/policy/simulate | replay events vs draft |
| GET/POST | /api/v1/agents | registry |
| POST | /api/v1/agents/[id]/pause, /quarantine | kill switch |
| GET/POST | /api/v1/approvals | queue + request |
| POST | /api/v1/approvals/[id]/approve, /reject | decide (comment required) |
| GET | /api/v1/audit/verify | chain verification |
| POST | /api/v1/audit/export | evidence export |
| GET | /api/v1/costs/summary | cost monitor |
| POST | /api/v1/evidence-packs | generate pack |
| GET | /api/v1/openapi.json | OpenAPI 3.1 |
| POST | /api/v1/gateway/[...path] | LLM proxy (policy + log) |
| POST | /api/webhooks/paddle | Paddle webhooks (HMAC) |
| GET | /api/sse/approvals, /api/sse/traces | SSE |

Error format: { error: { code, message, details, request_id } }. Deprecation: v1 stable; breaking changes -> v2 with 6-month notice.
