# Architecture

```mermaid
flowchart LR
  Agent -->|API key| Ingest[Ingest API]
  Ingest --> Redaction[PII Redaction]
  Redaction --> Store[MemoryStore / Postgres]
  Agent -->|policy/check| Policy[Policy Engine]
  Policy --> Approvals[Approvals]
  Approvals --> Audit[Audit Hash Chain]
  Audit --> Evidence[Evidence Packs]
  Audit --> Costs[Costs / Budgets]
  Billing[Paddle Webhooks] --> Subscriptions
```

Conventions: business logic in packages/shared (pure, tested). Routes thin: validate (Zod) -> authorize() -> service -> standard error format. Every table carries org_id; authorize() enforces tenant isolation. Failure modes: fail-open/fail-closed per agent; Redis down -> last snapshot; Inngest down -> outbox/dead-letter; R2 down -> dead-letter + clear error.
