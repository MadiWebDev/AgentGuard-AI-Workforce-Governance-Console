# Production Readiness — AgentGuard v1.2.1

Go / no-go checklist. **Verdict: CODE-READY, NOT YET LAUNCHABLE without the user actions below.** The code now fails fast on dangerous configs, but accounts, secrets, infra, a human security review, and legal counsel are still outstanding — no code can substitute for those.

## Go / no-go gates (P1–P10)

| Gate | Verdict | Evidence |
|---|---|---|
| P1 Production env validation | PASS | `validateProductionEnv()` in `packages/shared/src/prod.ts` + `assertProductionEnv()` in `apps/web/src/lib/env.ts`. Prod fails fast on: missing/non-postgres `DATABASE_URL`, missing/short `BETTER_AUTH_SECRET`, missing/non-https/localhost `APP_URL`, missing/short `ENCRYPTION_KEY`, `STORAGE_MODE=local`, `PADDLE_ENV=sandbox` on a prod URL, `KMS_PROVIDER` missing/mock, `ATTESTATION_ISSUER` missing/mock, `SAML_MODE=mock`, `SANDBOX_PROVIDER` missing/local. Tests in `apps/web/tests/prod.test.ts`. Golden check PROD passes. |
| P2 Security headers | PASS | `apps/web/next.config.mjs`: CSP (incl. `frame-ancestors 'none'`), HSTS (production only, preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `output: "standalone"`. Test asserts every header is declared. `pnpm build` green. |
| P3 Secrets hygiene | PASS | `scripts/secret-scan.mjs` (no network) wired into `pnpm verify:all`; scan finds no high-confidence hardcoded secrets. `.gitignore` covers `.env*`, `*.pem`, `*.key`, `id_rsa*`, zips. One real finding fixed: `docker-compose.yml` hardcoded `POSTGRES_PASSWORD: agentguard` → `${POSTGRES_PASSWORD:-agentguard-dev-only}` (dev-only default, documented). |
| P4 Error handling / info leakage | PASS | `serverError()` in `apps/web/src/lib/api.ts` + `formatServerError()` in shared: unknown 500s become generic `Internal error` in production; `ApiError` (controlled codes) passes through. All 24 API routes audited: 500 paths now use `serverError`; remaining `e.message` uses are controlled 4xx/503 `ApiError` codes only. `errorResponse(..., isProduction)` strips 500 messages too. Tests cover prod vs dev formatting. |
| P5 Health / ready honesty | PASS | `/api/ready` now runs real readiness (`getReadiness`): 503 when prod env validation fails or store unreachable; dev reports `{ready:true, mode:"memory-dev"}` explicitly. `/api/health` stays a lightweight liveness check. |
| P6 Logging without PII | PASS | No logger existed in `src/` (nothing logged raw values). Added `safeLogEvent()` / `safeLogMessage()` in shared (redact via the PII pipeline before stringifying). Test feeds PII + a secret-shaped key through and asserts raw values absent. Rule: routes must log only via these helpers. |
| P7 Rate limits + payload limits | PASS (in-memory) | Shared `RateLimiter` token bucket + per-key enforcement on ingest (60/min), policy/check (300/min), gateway (60/min) with 429 + `Retry-After`. Ingest rejects `Content-Length > 1MB` with 413. Production MUST set Upstash vars for a shared limiter — the in-memory fallback is per-process and documented in RUNBOOK + this doc. No live Upstash calls are invented. |
| P8 Dependency audit | UNVERIFIED | `pnpm audit` could not run in this VM: the registry proxy returned 403 `policy_denied` for the audit endpoints (`POST /-/npm/v1/security/audits/quick`). Exact blocker recorded; nothing invented. **User action:** run `pnpm audit` on a machine with registry access before launch and fix findings. |
| P9 Dockerfile / compose / CI | PASS (code) / MANUAL (CI on GitHub) | Dockerfile: multi-stage, non-root `app` user, no secrets in image (`.dockerignore` excludes `.env`), fail-fast `pnpm install --frozen-lockfile` (fallback removed), `output: "standalone"` enabled; runner copies the standalone tree and CMD is `node apps/web/server.js`, matching the observed monorepo layout (`.next/standalone/apps/web/server.js`). `docker build` itself is UNVERIFIED (no Docker in this VM) — run it before launch.. Compose: Postgres + Redis, password via env with dev-only default. CI file `.github/workflows/ci.yml` exists locally and is correct — **it is still NOT on GitHub** (GitHub App 403, workflow scope). Remaining manual step for the user: upload it via the web UI or a local `git push`. |
| P10 Data lifecycle | PASS (contract) | `packages/shared/src/lifecycle.ts`: retention cutoff + expired-event ids per plan, org deletion with 30-day grace (`requestOrgDeletion` / `deletionDue`), GDPR export shape (`buildOrgExport`, PII-redacted by contract). Live row deletion is a DB operation owned by the deployer — see RUNBOOK entry; no live pipeline is fabricated. Retention days per plan: Free 7 / Pro 30 / Team 90 / Enterprise 365. |

## What is CODE-READY
- Fail-fast production config, honest readiness, safe errors, safe logging, headers, rate limiting, payload limits, secret scanning, Dockerfile/compose, lifecycle contract, version consistency (root + web both 1.2.1).

## What still needs USER action (not done by this pass)
1. **Push tags** — `git push --tags` from a clone (tags are local-only: phase-*, feature-*, feature-a*, v1.0.0/v1.1.0/v1.2.0/v1.2.1).
2. **Add CI to GitHub** — upload `.github/workflows/ci.yml` via web UI or local `git push` (App/API 403 is expected).
3. **Create accounts + set env vars** — Paddle, Neon, Upstash, Inngest, R2, Cloudinary, Resend, AI providers, Sentry; fill `.env` from `.env.example` (never commit). Production requires: `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32), `APP_URL` (https, non-localhost), `ENCRYPTION_KEY` (≥32), `STORAGE_MODE=r2+cloudinary`, `PADDLE_ENV=production`, `KMS_PROVIDER=aws|cloudflare`, `ATTESTATION_ISSUER=spire`, `SANDBOX_PROVIDER=docker|firecracker`, Upstash vars.
4. **Point webhooks** — Paddle → `https://<domain>/api/webhooks/paddle`; Cloudinary → `/api/webhooks/cloudinary`.
5. **Deploy** — Vercel; run migrations + seed on Neon; verify demo login; confirm `/api/ready` returns 200 with `mode: "database"`.
6. **Infra** — sandbox infra (seccomp/cgroup limits), SPIRE deployment, OTS/EVM config, DP epsilon choice (default 1.0/window).
7. **Human security review** — have a developer review the audit-chain, policy-engine, billing, sandbox, and attestation code before launch.
8. **Legal counsel** — terms, privacy, DPA, subprocessors, cookies are still `LEGAL TEXT REQUIRED` placeholders. No real legal text was written by this pass.
9. **Dependency audit** — run `pnpm audit` with registry access (P8 blocker above).
10. **Live verification** — Docker/Firecracker, SPIRE, OTS/EVM, Paddle sandbox checkout, Playwright crawl, k6 load test (all UNVERIFIED in the build VM).

## Launch checklist (run on the production host)
```bash
pnpm install --frozen-lockfile
pnpm verify:all            # must be green (includes secret-scan)
curl -s https://<domain>/api/ready   # expect 200, mode "database"
curl -s https://<domain>/api/health  # expect 200
```
If `/api/ready` returns 503, read its `errors` array — it names the exact misconfiguration.
