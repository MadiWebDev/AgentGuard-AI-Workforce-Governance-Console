# AgentGuard — AI Workforce Governance Console

Log every agent action, enforce permissions and human approvals, track cost and reliability, and export tamper-evident, audit-ready evidence.

**Current version: 1.2.0** — v1 core + v1.1 enterprise expansion + v1.2 autonomous governance & deep trust.

## What it does

**The golden path (the one thing that must work perfectly):** an agent calls `policy/check` and is allowed, denied, or held for human approval; every action is ingested with PII redacted; every decision lands in a hash-chained audit log; a reviewer can approve or reject; and an auditor can export and independently verify a signed evidence pack.

### v1 — Core
- **Agent registry** — agents, risk tiers, kill switch (pause/quarantine denies immediately), per-agent API keys (`ag_live_…` / `ag_test_…`, hash-only, scoped, rotatable, revocable)
- **Event ingestion** — batched `POST /api/v1/ingest` (≤500 events, idempotency keys), OTLP traces, PII redaction before storage (email, phone, card via Luhn, SSN, API keys/JWT, IBAN), large payloads to R2
- **Policy engine** — one `evaluatePolicy` function, precedence deny > require_approval > rate_limit/spend_cap > allow, versioned rules, simulation, `<150ms p95` target
- **Human approvals** — SLA queue, routing/escalation, mandatory comments, HMAC-signed callbacks, two-person rule for critical tier, self-approval blocked server-side
- **Tamper-evident audit log** — SHA-256 hash chain per org, append-only triggers, checkpoint anchors, verification that names the exact first broken row, evidence packs (PDF + CSV + JSON + Ed25519-signed manifest)
- **Cost & reliability** — spend by agent/workflow/model, budgets/alerts/anomaly detection, trace explorer, editable pricing table
- **Billing** — Paddle Billing (webhooks, idempotent, out-of-order safe, overage metering, dunning UX), plan-limit middleware
- **Add-ons** — content compliance checker, client-proof reporting, support resolution QA
- **SDKs + MCP** — `packages/sdk-ts`, `packages/sdk-python`, `packages/mcp-server` (4 tools: check_policy, request_approval, get_approval_status, log_event)

### v1.1 — Enterprise readiness, intelligence, scale
- **SSO/SAML + SCIM 2.0** — mock-SAML (HMAC, test-only), JIT provisioning, require-SSO enforcement, SCIM Users, deprovision revokes sessions
- **Data residency** — per-org EU/US region, region-pinned buckets/queues, cross-region reads blocked + logged, migration job
- **BYOK encryption** — `KmsProvider` interface, MockKMS (AES-256-GCM, env-gated, rejected in production), AWS/Cloudflare adapters, key rotation + re-encryption
- **Red-team suite** — 5-attack library, scored reports, one-click draft policy from a finding
- **Behavior baselining & drift** — per-agent baselines, z-score drift alerts with offending traces
- **Cost optimizer** — downgrade/cache/batching recommendations with projected savings and quality guardrails
- **SIEM streaming** — generic/Splunk/Datadog, HMAC-signed delivery, exactly-once replay, buffered retry
- **Incident runbooks** — compromised-agent playbook (quarantine → revoke keys → freeze approvals → notify → evidence pack)
- **Policy packs** — EU AI Act, SOC 2, finance DLP, support QA; draft-only install + simulation, separate audited activation
- **Approvals mobile PWA** — Web Push (VAPID), offline decision queue with conflict winner, mobile approve page

### v1.2 — Autonomous governance & deep trust
- **Token-stream inspection (A1)** — streaming LLM output inspected token-by-token against content-guard policies; violations terminate the stream mid-flight, redact the tail, log a `guardrail_triggered` event
- **Sandboxed tool execution (A2)** — `execute_in_sandbox` policy action; LocalSandbox (dev/test) + Docker/Firecracker providers, egress allowlist, CPU/memory/time limits, full stdin/stdout/stderr evidence
- **Agent identity attestation (A3)** — short-lived workload-bound tokens for high/critical tiers; stolen-key replay without attestation is denied + audit-logged; SPIRE-style interface
- **Natural-language policy authoring (A4)** — “blocks prod database writes on weekends” → Zod-validated draft + plain-English explanation + simulation; drafts never auto-activate
- **Policy autopilot (A5)** — nightly proposals from approval decisions + drift findings with evidence counts; two-person approval to loosen deny-class rules; never auto-activates
- **Collusion detection (A6)** — graph analysis for split-bypass patterns (chunked exfiltration, reassembled actions), reconstructed chains naming all agents, opt-in auto-quarantine
- **Public-chain anchoring (A7)** — daily Merkle roots anchored via OpenTimestamps / optional EVM chain; offline pack verification: row → Merkle root → timestamp proof → chain tx
- **Continuous compliance monitoring (A8)** — scheduled control tests (kill-switch, chain, checkpoint backup, redaction probe), 30-day auditor history
- **Private peer benchmarking (A9)** — opt-in anonymized aggregates with differential privacy (epsilon budget 1.0/window), percentile bands, no org identifiable
- **Full lineage tracking (A10)** — model/prompt/tool/policy/SDK versions on every trace, what-changed diffs, lineage block in evidence packs

## Quickstart

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
# docker compose up  # Postgres + Redis for local
```

Health: http://localhost:3000/api/health · Ready: /api/ready · OpenAPI: /api/v1/openapi.json

Copy `.env.example` to `.env` and fill in values. Never commit real secrets. When `DATABASE_URL` is unset, the app runs against an in-memory store (same interfaces) for local dev/tests; see `docs/DECISIONS.md` for the adapter choices.

## Verification (real runs, not claims)

```bash
pnpm verify:golden   # 44 checks: 20 v1 + 15 v1.1 + 9 v1.2 (A9 unit-tested by design — DP randomness)
pnpm test            # 65/65 Vitest (25 v1 core + 12 v1.1 + 28 v1.2)
pnpm verify:all      # typecheck + lint + test + build + golden — must be green
pnpm package         # produces agentguard-v1.2.0.zip (excludes node_modules, .next, dist, coverage, .env, zips)
```

Gate table: R1–R38 in `docs/VERIFICATION.md` (R1–R18 v1, R19–R28 v1.1, R29–R38 v1.2). Measured numbers in `docs/PERFORMANCE.md`: stream-inspect overhead 0.45 ms/call, sandbox cold start 7 ms (LocalSandbox), autopilot 4 ms / 1000 decisions, collusion FPR 0 on 50 normal traces.

## Key API routes

| Method + Path | Purpose |
|---|---|
| `POST /api/v1/ingest` | Batch up to 500 events, idempotent |
| `POST /api/v1/policy/check` | allow / deny / require_approval + reasons |
| `POST /api/v1/policy/simulate` | Replay N events vs a draft policy |
| `POST /api/v1/policies/draft-from-nl` | NL utterance → validated draft + simulation (A4) |
| `POST /api/v1/gateway/stream-inspect` | Token-stream inspection (A1) |
| `POST /api/v1/sandbox/execute` | Sandboxed tool execution (A2) |
| `POST /api/v1/attestation/issue`, `/verify` | Workload attestation (A3) |
| `POST /api/v1/autopilot/run`, `/activate` | Autopilot proposals (A5) |
| `POST /api/v1/collusion/detect` | Collusion detection (A6) |
| `POST /api/v1/anchoring/anchor` | Timestamp anchoring (A7) |
| `POST /api/v1/compliance/run`, `GET /api/v1/compliance/controls` | Control tests (A8) |
| `POST /api/v1/benchmarks/publish` | DP peer benchmarks (A9) |
| `POST /api/v1/lineage/diff` | Lineage diff (A10) |
| `GET /api/v1/openapi.json` | Generated OpenAPI spec |

Full contract: `docs/API.md`. Standard error format everywhere: `{ error: { code, message, details, request_id } }`.

## Architecture

```mermaid
flowchart LR
  Agent --> Ingest[Ingest API]
  Ingest --> Redaction[PII Redaction]
  Redaction --> Store[Store]
  Agent --> Policy[Policy Engine]
  Policy --> Approvals[Approvals]
  Policy --> Sandbox[Sandbox]
  Policy --> Attest[Attestation]
  Approvals --> Audit[Audit Chain]
  Audit --> Evidence[Evidence Packs]
  Audit --> Anchor[Timestamp Anchor]
  Evidence --> Verify[Verify Page]
```

Monorepo: `apps/web` (Next.js 14, App Router, TypeScript strict), `packages/shared` (pure domain logic), `packages/sdk-ts`, `packages/sdk-python`, `packages/mcp-server`, `drizzle/` (schema + seed), `examples/`, `scripts/`, `docs/`, `tests/`. See `docs/ARCHITECTURE.md`.

## Deployment

Vercel + Neon + Upstash + Inngest + Cloudflare R2 + Cloudinary. Set env vars from `.env.example`. See `docs/RUNBOOK.md` and `docs/OPERATOR_HANDBOOK.md`.

Production wiring still required (adapters are env-gated and documented, never faked in production paths):
- **Sandbox infra** — `SANDBOX_PROVIDER=docker|firecracker` + image/config, seccomp/cgroup limits per RUNBOOK. LocalSandbox is dev/test isolation, **not** a security boundary.
- **SPIRE** — install SPIRE server + agent, set `SPIRE_AGENT_ADDRESS` + `SPIRE_TRUST_DOMAIN`.
- **Timestamping** — `OTS_CALENDAR_URL` or `EVM_RPC_URL` + `EVM_ANCHOR_CONTRACT`.
- **SAML IdP** — real IdP issuer/audience, `/sso/idp-initiated?orgId=…`, per-org role mapping (mock SAML is rejected in production).
- **KMS** — `AWS_KMS_KEY_ID` / `CLOUDFLARE_KMS_KEY_ID`; rotate + re-encrypt per RUNBOOK.
- **Billing / email / storage / AI** — Paddle, Resend, R2, Cloudinary, Upstash, Inngest, AI providers, Sentry (see `.env.example`).
- **DP epsilon** — default budget 1.0/window, 0.25/query; do not raise without privacy review.
- **Legal text** — terms, privacy, DPA, subprocessors, cookies pages are `LEGAL TEXT REQUIRED` placeholders; have counsel review before launch.

## Docs

- `docs/API.md`, `docs/SECURITY.md` (STRIDE incl. sandbox escape, attestation theft, collusion, timestamp spoofing), `docs/COMPLIANCE.md`, `docs/DECISIONS.md`, `docs/PERFORMANCE.md`, `docs/RUNBOOK.md`, `docs/VERIFICATION.md` (R1–R38), `docs/KNOWN_ISSUES.md`, `docs/COST_ESTIMATE.md`, `docs/OPERATOR_HANDBOOK.md`, `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`
- `CHANGELOG.md` — per-release entries (1.0.0, 1.1.0, 1.2.0)

## Honest limits

- Live Docker/Firecracker execution, live SPIRE, live OpenTimestamps/EVM anchoring, live Paddle/Neon/Cloudinary/R2/Upstash/Inngest/Resend/AI, Playwright crawl, and k6 load tests were not run in the build VM — adapters + `NOT_CONFIGURED` behavior are tested; live-infra verification is listed as manual in `docs/VERIFICATION.md`.
- `apps/web/package.json` still says 1.0.0 (root package is 1.2.0; pre-existing).
- The GitHub App used for pushes cannot write `.github/workflows/ci.yml` (403, needs workflow scope) — add it via the web UI or a local `git push`.
