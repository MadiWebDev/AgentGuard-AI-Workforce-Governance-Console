# Performance

Budgets: policy/check p95 <150ms, ingest 500-batch <400ms, dashboards <300ms at 10M events, LCP <2.0s.
Measured in this build environment: UNMEASURED for live HTTP p95 (no load-test harness run in VM) — core evaluatePolicy is a pure in-memory function (microseconds for typical rule sets); verify:golden runs in <2s. Run k6/autocannon against a deployed instance and record real numbers here before launch. Do not invent numbers.

## v1.1 measurements
- SIEM load simulation: scripts/siem-load.mjs signs 10,000 deliveries in-process; see run output in VERIFICATION.md (chaos/throughput row). In-memory signing is not network throughput — production SIEM throughput is UNVERIFIED against a live endpoint (no live Splunk/Datadog in VM).

## v1.2 measurements (real, from scripts/bench-v12.ts in this VM)
- Stream-inspect overhead: avg 0.4500 ms/call over 200 runs (500 tokens, 1 guard policy). Per-token cost is sub-microsecond at this scale; the windowed regex scan is O(tokens x policies).
- Sandbox cold start: 7 ms for LocalSandbox echo (process spawn + capture). Docker/Firecracker cold start is UNVERIFIED in this VM (no Docker) — measure on deployed infra before launch; expect 100ms–2s depending on provider.
- Autopilot runtime: 4 ms for 1000 decisions + 1 drift finding -> 3 proposals (in-memory grouping).
- Collusion FPR on normal seeded traffic: 0 (0 alerts / 50 normal traces) — recorded in v12 tests; re-measure on production traffic before tuning thresholds.

## v1.3 measurements (real, from scripts/bench-v13.ts in this VM)
- Marketplace scoring: 10,000 computeTrustScore computations in 4 ms (0.0004 ms/call). Pure arithmetic — scoring is never the bottleneck.
- Warehouse sync: 5,000 rows backfilled in 27 ms (~185,185 rows/s) against the in-memory FakeDbClient sink. This measures sync-layer overhead (dedupe + statement generation), NOT live Postgres/BigQuery/Snowflake throughput — measure against a real warehouse before launch.
- Voice barge-in latency (mock STT, transcribe+enforce): mean 0.020 ms, p95 0 ms over 200 calls. This measures enforcement only — real STT network latency dominates in production and is UNVERIFIED in this VM (no live STT provider); measure with a real provider before launch.
