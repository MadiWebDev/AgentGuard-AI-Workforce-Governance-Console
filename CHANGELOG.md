## 1.2.1 — Production hardening
- Production env validation: fail-fast in production on missing/weak config or any mock adapter (DATABASE_URL, BETTER_AUTH_SECRET, APP_URL https non-localhost, ENCRYPTION_KEY, STORAGE_MODE, PADDLE_ENV, KMS_PROVIDER, ATTESTATION_ISSUER, SAML_MODE, SANDBOX_PROVIDER). Mock SAML / mock push rejected in production routes.
- Security headers: CSP, HSTS (prod-only), Permissions-Policy added; `output: "standalone"` in next.config (matches Dockerfile CMD).
- Error handling: unknown 500s are generic in production; `errorResponse(..., isProduction)` strips 500 messages. All API routes audited.
- Honest readiness: `/api/ready` returns 503 when prod env invalid or store unreachable; dev reports `mode: "memory-dev"`.
- Safe logging helpers (`safeLogEvent` / `safeLogMessage`) that redact PII before logging.
- Rate limiting: shared token-bucket `RateLimiter`, per-key enforcement on ingest (60/min), policy/check (300/min), gateway (60/min), 429 + Retry-After; ingest 1MB cap enforced with 413.
- Secrets hygiene: `scripts/secret-scan.mjs` wired into `verify:all`; `.gitignore` covers `*.pem`, `*.key`, `id_rsa*`; fixed hardcoded `POSTGRES_PASSWORD` in docker-compose (now env var with dev-only default).
- Dockerfile: removed non-frozen `pnpm install` fallback (fail fast).
- Data lifecycle contract: retention cutoff/expired ids, 30-day org-deletion grace, GDPR export shape (PII-redacted).
- `pnpm audit`: UNVERIFIED in build VM (registry proxy 403 on audit endpoints) — run with registry access before launch.
- Versions: root + web bumped to 1.2.1.

## 1.2.0
- A1 token-stream inspection, A2 sandboxed tool execution, A3 attestation, A4 NL policy authoring, A5 autopilot, A6 collusion detection, A7 anchoring, A8 compliance monitoring, A9 DP benchmarking, A10 lineage tracking.
- Prep fix: regenerated pnpm-lock.yaml (frozen-install mismatch fixed; clean-room frozen install + typecheck + build now pass).
- Golden extended to 44 checks (20 v1 + 15 v1.1 + 9 v1.2; A9 unit-tested). Tests 65 (37 v1.1 + 28 v1.2).
- Docs: API, SECURITY (sandbox escape / attestation theft / collusion / timestamp spoofing), COMPLIANCE, RUNBOOK (sandbox, SPIRE, OTS/EVM, DP epsilon), PERFORMANCE (measured numbers), VERIFICATION (R29–R38 + chaos rows).
- A1 token-stream inspection: buffered-window content-guard, mid-flight termination, redacted tail, guardrail_triggered event.
- A2 sandboxed tool execution: LocalSandbox (argv + egress allowlists, timeout kill, evidence capture), Docker/Firecracker NOT_CONFIGURED adapters, policy action execute_in_sandbox.
- A10 full lineage tracking: version snapshots on every trace, what-changed diffs, lineage block in evidence packs.
- A9 private peer benchmarking: opt-in-only DP aggregates (epsilon budget 1.0), percentile bands per size bucket, no org identifiable.
- A8 continuous compliance monitoring: 4 scheduled control tests, 30-day auditor history, pass rate, fail alerts; real store checkpoint + probe support.
- A7 public-chain anchoring: Ed25519 hash-chained timestamp proofs, offline pack verification, anchor queue with pending/retry, OTS + EVM NOT_CONFIGURED adapters.
- A6 cross-agent collusion detection: chunked-exfiltration + split-bypass graph analysis, reconstructed chains, opt-in auto-quarantine, FPR measured on normal traffic.
- A5 policy autopilot: draft proposals from approval decisions + drift findings, evidence counts, two-person rule for loosening deny rules, never auto-activates.
- A4 natural-language policy authoring: deterministic parser for 5 sample utterances, Zod-validated drafts, explanation + simulation diff, drafts never auto-active.
- A3 agent identity attestation: MockAttestationIssuer (HMAC, short-lived, workload-bound), SPIRE adapter NOT_CONFIGURED, high/critical gate, fail-mode on issuer-down.

# Changelog

## v1.1.0
- F1 SSO/SAML (mock, HMAC-signed, test-only) + SCIM v2 Users, JIT provisioning, requireSSO, deprovision revokes sessions.
- F2 Data residency: EU/US bucket+queue routing, cross-region 403 + audit, region migration.
- F3 BYOK: MockKms (env-gated, rejected in production), AWS/Cloudflare adapters (NOT_CONFIGURED), rotation + re-encryption.
- F4 Red-team attack library + draft-only policy drafts.
- F5 Baselining + drift alerts (|z|>3).
- F6 Optimizer recommendations with quality guardrail + cache replay.
- F7 SIEM (generic/Splunk/Datadog), HMAC-signed delivery, exactly-once replay, buffered retry.
- F8 Compromised-agent runbook with verified ordered steps + evidence pack.
- F9 Prebuilt policy packs (EU AI Act, SOC 2, finance DLP, support QA): draft-only install + simulation, separate audited activation.
- F10 PWA + push (mock in dev/test), offline decision queue with conflict winner, mobile approve page.


## 1.0.0
- Initial v1: golden path, ingest, policy, approvals, audit, costs, billing adapters, add-ons, SDKs, MCP.
