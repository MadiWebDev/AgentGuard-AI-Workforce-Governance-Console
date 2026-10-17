# Performance

Budgets: policy/check p95 <150ms, ingest 500-batch <400ms, dashboards <300ms at 10M events, LCP <2.0s.
Measured in this build environment: UNMEASURED for live HTTP p95 (no load-test harness run in VM) — core evaluatePolicy is a pure in-memory function (microseconds for typical rule sets); verify:golden runs in <2s. Run k6/autocannon against a deployed instance and record real numbers here before launch. Do not invent numbers.
