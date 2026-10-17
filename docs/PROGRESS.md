# Progress

## Production-ready start (v1.2.1)
- Start HEAD: d1fe4b9 (v1.2.0 tag fbcab5c + README e2ce245 + web version d1fe4b9). `pnpm verify:all` green before hardening (PASS 5/5: secret-scan not yet wired).
- Audit findings (verified by reading code, not assumed):
  - REAL GAPS: (1) env validation only rejected STORAGE_MODE=local in prod — no DATABASE_URL/secret/APP_URL/ENCRYPTION_KEY/mock checks; (2) next.config missing CSP, HSTS, Permissions-Policy; `output: "standalone"` missing while Dockerfile CMD referenced `standalone/server.js`; (3) 24 API routes leaked `e.message` on 500s; (4) `/api/ready` was a static always-ready stub; (5) no logger at all (no PII logging, but also no safe-logging helper); (6) zero per-key rate limiting on ingest/policy-check/gateway; ingest had no byte-size enforcement in-route; (7) docker-compose hardcoded `POSTGRES_PASSWORD: agentguard`; (8) `.gitignore` missing `*.pem`/`*.key`; (9) Dockerfile had a non-frozen `pnpm install` fallback; (10) retention/GDPR existed only in docs, no code contract.
  - ALREADY FINE: no hardcoded high-confidence secrets in code (secret grep clean except the compose password above); PII redaction before storage; hash-chained audit; `pnpm install --frozen-lockfile` clean-room PASS (v1.2 prep fix); no `any` in domain code; no skipped tests.
  - UNVERIFIED: `pnpm audit` — registry proxy 403 on audit endpoints (exact blocker in PRODUCTION_READINESS.md P8).
- Dockerfile CMD bug caught during verification: with `output: "standalone"` the server lands at `.next/standalone/apps/web/server.js` in this monorepo, but the old CMD pointed at `apps/web/.next/standalone/server.js` (would fail on boot). Fixed: runner copies the standalone tree + static + public, CMD is `node apps/web/server.js`. `docker build` itself remains UNVERIFIED (no Docker in VM).
- Plan: fix the 10 gaps above, keep all 44 golden checks passing (+1 prod gate), `verify:all` green, tag v1.2.1, package zip. Local commits only.

## Production-ready complete (v1.2.1)
- verify:all green 6/6 (secret-scan + typecheck + lint + test + build + golden). Tests 81/81 (65 + 16 new prod tests). Golden 45/45 (44 + 1 PROD env gate).
- Production gates P1–P10 in docs/VERIFICATION.md: P1–P7, P9 (code), P10 PASS; P8 UNVERIFIED (pnpm audit blocked by registry proxy 403); P9 CI still NOT on GitHub (App 403) — remaining manual step.
- Version: root + web both 1.2.1. Tag v1.2.1 (annotated, local only). Zip agentguard-v1.2.1.zip via scripts/package.sh; clean-room test recorded in the v1.2.1 report.
- Remaining manual steps (NOT done): push tags, add CI to GitHub, accounts/env/Paddle/Vercel, infra (sandbox/SPIRE/OTS), human security review, legal counsel, pnpm audit with registry access, live verification (Docker build, SPIRE, OTS/EVM, Paddle checkout, Playwright, k6).


## v1.2 start
- v1.1.0 commit 10a2e6aa57cacb4b1af32288df8702307dfd6ec8, base green (`pnpm verify:all` PASS 5/5 before feature work).
- Prep fix: lockfile mismatch FIXED. Root cause: `pnpm-lock.yaml` listed `packages/mcp-server`, `packages/sdk-ts`, `packages/shared` as `{}` but their tsconfigs (via base `types:["node"]`) need `@types/node@22.10.2` as devDep. `pnpm install --lockfile-only` in a /tmp copy regenerated the lockfile (+24 lines, only that addition). Clean-room `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build` now PASS (previously BLOCKED). Commit: `fix(v1.2-prep): regenerate lockfile`.
- Plan: 10 features A1-A10 in 3 waves, per-batch commits + tags `feature-aN-<slug>`, final tag v1.2.0. Local git only, never push (no token in VM).

## v1.2 Wave 1 — A1 Token-stream, A2 Sandbox, A3 Attestation
- A1: token-stream inspection (buffered windows, mid-flight termination, redacted tail, guardrail_triggered event, overhead benchmark). Tag: feature-a1-token-stream.
- A2: sandboxed tool execution (LocalSandbox: no-shell argv allowlist, egress allowlist pre-check, timeout kill, full evidence capture; Docker/Firecracker adapters NOT_CONFIGURED; policy action execute_in_sandbox). Tag: feature-a2-sandbox.
- A3: attestation (MockAttestationIssuer HMAC short-lived, bound to workload+tier; SPIRE adapter NOT_CONFIGURED; high/critical gate; issuer-down follows fail-mode). Tag: feature-a3-attestation.
- Fixes during Wave 1: attestation HMAC now covers the raw payload segment + strict 64-hex signature (a tampered-signature test caught Buffer.from hex truncation); sandbox env cast via unknown (web @types/node requires NODE_ENV in ProcessEnv).
- Gates: typecheck PASS, lint PASS, test 48/48 PASS (37 v1.1 + 11 v1.2 Wave 1), build PASS.

## v1.2 Wave 2 — A4 NL authoring
- A4: deterministic NL -> policy draft (5 sample utterances), plain-English explanation, auto-simulation vs recent events, timeWindow (weekend) + rateLimitPerMinute rule fields with ruleMatches evaluation. Drafts never affect policy/check until activated. Tag: feature-a4-nl-policy.
- Gates: typecheck PASS, test 50/50 PASS.

## v1.2 Wave 2 — A5 Autopilot
- A5: nightly autopilot learns from approval decisions + drift findings, returns draft proposals with evidence counts; loosening a deny-class rule requires two-person approval; activation goes through the versioned change flow; autopilot never auto-activates. Tag: feature-a5-autopilot.
- Gates: typecheck PASS, test 52/52 PASS.

## v1.2 Wave 2 — A6 Collusion
- A6: graph analysis over traces — chunked_exfiltration + split_bypass patterns, reconstructed sequences naming all agents, opt-in auto-quarantine with audit entries, falsePositiveRate helper (0 on 50 normal seeded traces). Tag: feature-a6-collusion.
- Gates: typecheck PASS, test 55/55 PASS.

## v1.2 Wave 3 — A7 Anchoring
- A7: Ed25519-signed hash-chained timestamp proofs (verify offline from pack alone via proof-carried public key), merkleRootForPack + verifyPackWithAnchor, AnchorQueue (down -> pending, retried, never silently skipped), OpenTimestamps + EVM adapters NOT_CONFIGURED. Tag: feature-a7-anchoring.
- Fix during A7: adapter anchor/verify signatures now accept (root, proof) to match the TimestampingProvider interface.
- Gates: typecheck PASS, test 57/57 PASS.

## v1.2 Wave 3 — A8 Compliance
- A8: runControlTests (kill-switch, chain verification, checkpoint backup, redaction nowhere-leak; each control catches its own errors), ControlHistory 30-day window + pass rate, alertOnFail. Store gained real checkpoint support (root over audit rows, verified on read) + redactionProbeClean through the real ingest path + killSwitchDenies that genuinely quarantines a probe agent and asserts the gate denies it (an earlier tautological lambda was caught and replaced).
- Gates: typecheck PASS, test 60/60 PASS.

## v1.2 Wave 3 — A9 Benchmarking
- A9: opt-in-only DP aggregates (Laplace noise, sensitivity = range/n, epsilon budget 1.0/window, tracked spend, rejection on exhaustion), percentile bands per size bucket, no per-org values. Tests: opted-out exclusion (identical output), remove-one-org delta within sensitivity/epsilon bound (same-seed noise cancels), budget accounting. Tag: feature-a9-benchmarking.
- Gates: typecheck PASS, test 63/63 PASS.

## v1.2 Wave 3 — A10 Lineage
- A10: Lineage {modelVersion, promptTemplateVersion, toolVersions, policyVersion, sdkVersion} attached to traces (optional, backward-compatible), lineageDiff with per-field + per-tool changes, packWithLineage binds lineage hash into the signed manifest, verifyPackWithLineage checks both. Tag: feature-a10-lineage.
- Gates: typecheck PASS, test 65/65 PASS.

## v1.2 final
- verify:all green; golden extended (v1 20/20 + v1.1 15/15 + v1.2 9/9 checks; A9 unit-tested). Root version 1.2.0; package.sh produces agentguard-v1.2.0.zip. Tag: v1.2.0 (annotated, local only).
- Measured: stream-inspect 0.45 ms/call (500 tokens), sandbox cold start 7 ms (local echo), autopilot 4 ms / 1000 decisions.
- Known limits: Docker/Firecracker live execution, live OTS/EVM anchoring, live SPIRE, live k6 p95 — UNVERIFIED in VM (adapters + NOT_CONFIGURED behavior tested). See VERIFICATION.md.

## v1.1 start
- v1.0.0 commit a6f352faa0ec1160c08767d5a38caa11fb9079b7, base green (`pnpm verify:all` PASS), clean tree. PROGRESS.md HEAD corrected from stale d1e4cf7.
- Plan: 10 features in 3 waves, per-batch commits + tags feature-N-<slug>, final tag v1.1.0. Local git only, never push (no token in VM).

## v1.1 Wave 1 — F1 SSO/SCIM, F2 Residency, F3 BYOK
- F1: mock-SAML HMAC assertions, JIT provisioning, requireSSO blocks password login, SCIM v2 Users CRUD + deprovision revokes sessions, audit-logged. Tag: feature-1-sso-scim.
- F2: EU/US bucket+queue routing, cross-region 403 + audit, region migration with verification, settings/residency page + layout badge. Tag: feature-2-residency.
- F3: MockKms AES-256-GCM per-org key versions (rejected in production), AWS/Cloudflare adapters throw NOT_CONFIGURED, re-encrypt + revoke-only-after-re-encrypt. Tag: feature-3-byok.

## v1.1 Wave 2 — F4 Red-team, F5 Baselining, F6 Optimizer
- F4: 5-attack library, runRedTeam + draft-only policies, /api/v1/redteam/run + /redteam page. Tag: feature-4-redteam.
- F5: baselines (cost mean/std, latency p50/p95, error rate), drift |z|>3 alerts with trace ids, /baseline page. Tag: feature-5-baseline.
- F6: recommendations with quality guardrail (model downgrade only if errorRate below threshold), safe apply, cache replay. Tag: feature-6-optimizer.

## v1.1 Wave 3 — F7 SIEM, F8 Runbooks, F9 Packs, F10 PWA/Push
- F7: generic/Splunk/Datadog profiles, HMAC-signed delivery + replay window, exactly-once replay, buffered retry, /api/v1/siem/*, scripts/siem-load.mjs. Tag: feature-7-siem.
- F8: compromised-agent runbook (quarantine → revoke keys → freeze approvals → notify → evidence pack), history store, /api/v1/runbooks/compromised-agent + /runbooks page. Tag: feature-8-runbooks.
- F9: 4 versioned packs, install draft-only + simulation, separate audited activation, /api/v1/packs/* + /packs page. Tag: feature-9-packs.
- F10: VAPID keys, push subscribe/send (mock in dev/test), offline queue + conflict winner, PWA manifest + service worker, mobile approve page with mandatory comment. Tag: feature-10-pwa.

## v1.1 final
- verify:all green, golden extended (v1 20/20 kept + v1.1 checks), root version 1.1.0, package.sh produces agentguard-v1.1.0.zip. Tag: v1.1.0 (annotated, local only).

- Phases 1-9 complete. Final HEAD: d1e4cf7ae8e590df82e1ad0df764b33bee2a77ca
- Tags: phase-1-complete .. phase-9-complete, v1.0.0 (after packaging)
- Gates (real runs in this VM): typecheck PASS, lint PASS, test 25/25 PASS (Vitest) + 3/3 Python unittest PASS, build PASS (Next 54 routes), verify:golden PASS (20/20 checks), verify:all PASS (5/5 steps)
- Live server verified: /api/health 200, /api/ready 200, POST /api/v1/policy/check allow, POST /api/v1/ingest accepted=1 redacted=1, /api/v1/openapi.json served
- Push pending: parent pushes via GitHub MCP (no token in this VM). Remote: https://github.com/MadiWebDev/AgentGuard-AI-Workforce-Governance-Console.git
- Manual verification required: live Paddle/Neon/Cloudinary/R2/Upstash/Inngest/Resend/AI, Docker, Playwright crawl, k6 load test, fresh-clone test.

## Git log
```
d1e4cf7 chore: include remaining shared package files
afed27e feat(phase-9): Python SDK, MCP server, tests, verification, docs, packaging
38ecfd8 feat(phase-8): marketing, onboarding, dashboards, settings, public pages
b298958 feat(phase-7): add-on modules (content, support QA, reports) + AI evals
ca61afb feat(phase-6): Paddle billing webhooks, SSRF guard, subscriptions
d2ffd73 feat(phase-5): costs, pricing table, plans, gateway mode
bba97c3 feat(phase-4): hash-chained audit, evidence packs, Ed25519 manifests
3967487 feat(phase-3): policy engine, approvals, kill switch, SSE
b545ace feat(phase-2): ingest, PII redaction, storage router, SDK-TS
0bc7853 feat(phase-1): monorepo scaffold, auth adapters, tenancy, RLS docs, health/ready

```
