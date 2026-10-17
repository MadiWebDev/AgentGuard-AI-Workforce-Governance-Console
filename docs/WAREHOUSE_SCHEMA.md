# Warehouse schema (C7)

Warehouse sync writes three tables. All tables have an `idempotency_key` primary key (or unique constraint) — the sync layer dedupes on it and the INSERT uses `ON CONFLICT (idempotency_key) DO NOTHING`, so backfills are exactly-once.

## warehouse_events
| Column | Type | Notes |
|---|---|---|
| idempotency_key | text PK | `events:<traceId>:<seq>` (caller-assigned; must be stable across retries) |
| trace_id | text | AgentGuard trace id |
| agent_id | text | |
| org_id | text | |
| type | text | event type (e.g. tool_call) |
| input_redacted | text | PII-redacted input |
| output_redacted | text | PII-redacted output |
| model | text | |
| tokens_in | integer | |
| tokens_out | integer | |
| cost_usd | numeric | |
| created_at | timestamptz | |

## warehouse_audit
| Column | Type | Notes |
|---|---|---|
| idempotency_key | text PK | `audit:<rowId>` |
| row_id | text | AgentGuard audit row id |
| org_id | text | |
| action | text | e.g. policy.checked, marketplace.buy |
| payload_json | jsonb | audit payload |
| prev_hash | text | hash-chain previous hash |
| row_hash | text | hash-chain row hash |
| created_at | timestamptz | |

## warehouse_costs
| Column | Type | Notes |
|---|---|---|
| idempotency_key | text PK | `costs:<orgId>:<period>:<agentId>` |
| org_id | text | |
| agent_id | text | |
| period | text | e.g. 2026-10 |
| total_cost_usd | numeric | |
| event_count | integer | |
| created_at | timestamptz | |

Postgres DDL (deployers: run against the customer warehouse):

```sql
CREATE TABLE IF NOT EXISTS warehouse_events (
  idempotency_key text PRIMARY KEY, trace_id text, agent_id text, org_id text,
  type text, input_redacted text, output_redacted text, model text,
  tokens_in integer, tokens_out integer, cost_usd numeric, created_at timestamptz
);
CREATE TABLE IF NOT EXISTS warehouse_audit (
  idempotency_key text PRIMARY KEY, row_id text, org_id text, action text,
  payload_json jsonb, prev_hash text, row_hash text, created_at timestamptz
);
CREATE TABLE IF NOT EXISTS warehouse_costs (
  idempotency_key text PRIMARY KEY, org_id text, agent_id text, period text,
  total_cost_usd numeric, event_count integer, created_at timestamptz
);
```

BigQuery / Snowflake: same tables/columns (map `jsonb` → JSON, `timestamptz` → TIMESTAMP, `numeric` → NUMERIC/FLOAT). Adapters throw NOT_CONFIGURED until credentials are set (see RUNBOOK).
