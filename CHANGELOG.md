## 1.4.0 — Complete UI/UX Redesign (Material Design 3)
- Full M3 design system: tokens (light + dark, indigo #4F46E5 seed), elevation, shape, type scale, motion with prefers-reduced-motion, state layers, density (comfortable/compact persisted in localStorage). Hand-built primitives (no new deps; shadcn/Radix were never installed). Dev-only /design gallery (404 in production).
- Global shell: app bar (Cmd+K search, theme toggle, notification center, org switcher, user menu), nav rail, mobile bottom nav, drawer, breadcrumbs + PageHeader on every page, toasts, ConfirmDialog before destructive calls, skeletons, honest empty states, per-section error boundaries.
- All 68 routes redesigned: marketing (hero, live policy-demo widget, MARKED testimonial placeholders), core (overview, agents, traces, policies), ops (approvals, audit, costs, alerts, reports, content, support), flows (onboarding wizard, verify-pack, auth, marketplace, A2A, brand, portal, MSP, billing/clients, audits, warehouse, on-call, voice, anchoring, attestation, sandbox, token-stream, autopilot, collusion, compliance, benchmarks, lineage, baseline, redteam, packs, runbooks, settings x11).
- HARD RULE honored: no API route, response shape, domain logic, auth, billing, audit, or policy semantics changed. Auth demo buttons now show an honest env-gated notice instead of being dead (DECISIONS.md).
- QA: token-pair contrast 11/11 PASS WCAG AA (light + dark, computed); HTTP crawl 68/69 routes 200 + /design 404-by-design; design test strengthened (PageHeader coverage, no fontSize:28). Screenshots / axe / Lighthouse UNVERIFIED — Playwright browser download blocked in VM (see PAGE_INVENTORY.md). Tests 112/112, golden 59/59, verify:all 6/6.

## 1.3.0 — Ecosystem & Growth
- C1 marketplace: trust scores from governance history only (never self-reported), publish threshold 60, verified badge 80 + chain verified, buyer onboarding creates a governed registry entry; staleness badge when scoring job is down.
- C2 A2A governance: per-pair allow/deny/require-approval, content guards, exact-cent cost attribution (largest-remainder, sums exactly), message audit records linking the full trace.
- C3 white-label: per-org brand (logo/colors/domain/branded email), client portal scoped to one org, leakCheck asserts no AgentGuard branding; custom-domain TLS documented in RUNBOOK.
- C4 MSP console: cross-org alert rollup, per-client health scores (nightly recompute), delegated admins with scoped permissions, enforced cross-org isolation (adversarial test).
- C5 client billing: integer-cent metering/invoices/margins reconciling to the penny; hand-rolled valid PDF invoices; invoices audit-logged.
- C6 scheduled audits: weekly/monthly schedules, real control tests, signed evidence packs, email/portal delivery + delivery log; runDueSchedules test hook.
- C7 warehouse sync: WarehouseSink (Postgres parameterized INSERTs + injected DbClient, FakeDbClient in tests), BigQuery/Snowflake NOT_CONFIGURED adapters, documented schema (docs/WAREHOUSE_SCHEMA.md), exactly-once backfill + buffered recovery.
- C8 on-call: MockOnCall (dev/test, 503 in prod), PagerDuty/Opsgenie NOT_CONFIGURED adapters, SLA-breach escalation + decision resolution, round trip audit-logged.
- C9 trust badge: Ed25519-signed badge payload, public verify endpoint (no auth), tamper fails, revoked orgs invalid, copy-paste HTML snippet.
- C10 voice governance: STT provider interface (MockStt scripted fixtures dev/test, RealSttAdapter NOT_CONFIGURED), transcript enforcement + barge-in (warn/terminate), guardrail_triggered evidence with audio segment, PII-redacted transcripts, STT-down fail modes.
- Golden extended to 59 checks (21 v1 + 15 v1.1 + 9 v1.2 + 13 v1.3 + 1 PROD; v1 count corrected — 5a–5f is 6 checks). Tests 105/105 (81 + 24 v1.3). Chaos rows: warehouse down (buffered/backfill/exactly-once), STT down (fail-mode), scoring job down (staleness badge).
- Measured (scripts/bench-v13.ts): marketplace scoring 0.0004 ms/call, warehouse sync ~185k rows/s (in-memory fake sink), voice barge-in mean 0.02 ms / p95 0 ms (mock STT enforcement only; real STT latency UNVERIFIED).
- Docs: API, SECURITY (marketplace gaming, A2A spoofing, white-label phishing, badge forgery, voice impersonation), COMPLIANCE, RUNBOOK (moderation, TLS, warehouse creds, PagerDuty/Opsgenie keys, STT keys), DECISIONS, VERIFICATION (R39–R48 + P1–P10 re-verified), PERFORMANCE, PROGRESS, README, WAREHOUSE_SCHEMA.md, .env.example.
- Versions: root + web bumped to 1.3.0. Manual steps still open: marketplace moderation policy, custom-domain TLS + DNS ownership, warehouse credentials, PagerDuty/Opsgenie keys, STT provider keys (see RUNBOOK).

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
