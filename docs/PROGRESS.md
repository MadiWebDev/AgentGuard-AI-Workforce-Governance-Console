# Progress

## v1.4 start
- Base: v1.3.0 commit c64f30f (tag v1.3.0). Root + web package.json both 1.3.0. v1.4 builds on v1.3.0; no prior work redone.
- Baseline: `pnpm verify:all` green before redesign (6/6: secret-scan + typecheck + lint + test + build + golden 59/59). Clean tree, remote https://github.com/MadiWebDev/AgentGuard-AI-Workforce-Governance-Console.git. Local commits + tags only (no token in VM; parent pushes via GitHub MCP).
- Plan: M3 design system (D1) -> global shell (D2) -> marketing (D3) -> core pages (D4) -> ops pages (D5) -> flows + remaining pages (D6) -> version 1.4.0. Per-batch commits + tags `design-N-<area>`, final tag v1.4.0. Local git only.
- HARD RULE: functionality, APIs, data identical. Visual + UX-flow changes only. Flow improvements recorded in DECISIONS.md.

## v1.4 D1 — design system (commit e3731a1, tag design-1-tokens)
- M3 tokens (globals.css), Tailwind token mapping, m3.tsx primitives, shell.tsx, charts.tsx, /design dev-only gallery, TOKENS.md, PAGE_INVENTORY.md (68 routes), design.test.ts (7 tests). Gates green.

## v1.4 D2 — global shell (commit 2c1832a, tag design-2-shell)
- layout.tsx rewritten: AppShell (app bar, Cmd+K search, theme toggle, notification center, org switcher, user menu), nav rail, mobile bottom nav, drawer, SectionErrorBoundary. Marketing routes hide rail/bottom nav. Gates green.

## v1.4 D3 — marketing (commit 167496d, tag design-3-marketing)
- Home (hero mesh, live policy-demo widget, feature grid, MARKED testimonial placeholders, FAQ), pricing, docs, changelog, security, legal x5 (LEGAL TEXT REQUIRED placeholders kept). Gates green.

## v1.4 D4 — core pages (commit 699fe12, tag design-4-core)
- Overview, agents, agents/[id], traces, traces/[id], policies, policies/[id], policies/nl — real fetches to existing APIs, ConfirmDialog before destructive calls. Gates green.

## v1.4 D5 — ops pages (commit 21fc0d6, tag design-5-ops)
- Approvals, approvals/[id], approvals/[id]/mobile (offline queue), audit, costs, alerts, reports, content, support. Gates green.

## v1.4 D6 — flows + remaining pages (commit c54a553, tag design-6-flows)
- Onboarding, verify-pack, auth (AuthShell + 4 auth pages), marketplace, a2a, brand, portal/[orgId], msp, billing/clients, audits, warehouse, oncall, voice, anchoring, attestation, sandbox, token-stream, autopilot, collusion, compliance, benchmarks, lineage, baseline, redteam, packs, runbooks, settings x11 (incl. density toggle in settings/security persisted to localStorage ag-density).
- Fixes during D6 QA: settings pages regenerated via script had f-string brace damage (crumbs/style) — fixed via sed + full rewrite of security page; compliance passRate missing paren; marketplace Card missing children; home feature-icon fontSize:28 replaced with m3-headline-md class; auth demo buttons made honestly live (inline env-gated notice) instead of dead.
- Design test strengthened: PageHeader coverage enforced on all pages except 5 documented exemptions; no fontSize:28 in any page.
- QA evidence: token-pair contrast 11/11 pairs PASS WCAG AA both themes (computed from globals.css); HTTP crawl 68/69 routes 200 + /design 404-by-design in production; zero div/span onClick; zero fixed widths >= 1000px. Screenshots / axe / Lighthouse UNVERIFIED (Playwright browser download timed out twice — cdn.playwright.dev blocked/slow in VM; axe/Lighthouse not installed). See docs/design/PAGE_INVENTORY.md.
- Environment note: the VM service restarted mid-D6 and wiped the global pnpm install (outside ~); reinstalled pnpm@10.34.7 via npm before continuing. No repo files were affected.

## v1.3 start
- v1.2.0 commit fbcab5c (tag v1.2.0). Actual base: v1.2.1 commit cf36559 (tag v1.2.1) — includes v1.2.0 + README + web-version + prod hardening. v1.3 builds on v1.2.1; v1.2.1 work is NOT redone.
- Baseline: `pnpm verify:all` green before feature work (6/6: secret-scan + typecheck + lint + test + build + golden 45/45). Clean tree, remote https://github.com/MadiWebDev/AgentGuard-AI-Workforce-Governance-Console.git. Local commits + tags only (no token in VM; parent pushes via GitHub MCP).
- Plan: 10 features C1–C10 in 3 waves, per-batch commits + tags `feature-cN-<slug>`, final tag v1.3.0. Local git only.

## v1.3 Wave 1 — C1 Marketplace, C2 A2A, C3 White-label
- C1–C3 shared modules + API routes + UI pages. Tags: feature-c1-marketplace, feature-c2-a2a, feature-c3-whitelabel. Commit c19a6fe.
- Gates on working tree: shared typecheck PASS, v13 tests 24/24 PASS (after 3 test-caught fixes: trust-threshold seed below cap, NOT_CONFIGURED adapters made async so throws become rejections, golden C8 shared-object mutation).

## v1.3 Wave 2 — C4 MSP, C5 Client billing, C6 Scheduled audits
- C4–C6 shared modules + API routes + UI pages. Tags: feature-c4-msp, feature-c5-clientbilling, feature-c6-scheduledaudits. Commit 3fe655c.

## v1.3 Wave 3 — C7 Warehouse, C8 On-call, C9 Badge, C10 Voice
- C7–C10 shared modules + API routes + UI pages + shared index exports + v13 tests + golden extension + bench script. Tags: feature-c7-warehouse, feature-c8-oncall, feature-c9-badge, feature-c10-voice. Commit 29f6a63.
- One typecheck fix in this wave: MSP overview duplicate `orgId` key in object literal.

## v1.3 final
- verify:all green 6/6 (secret-scan + typecheck + lint + test + build + golden). Tests 105/105 (81 + 24 v1.3). Golden 59/59 (21 v1 + 15 v1.1 + 9 v1.2 + 13 v1.3 + 1 PROD; v1 count corrected — 5a–5f is 6 checks, prior docs said 20).
- Measured (scripts/bench-v13.ts): marketplace scoring 0.0004 ms/call, warehouse sync ~185k rows/s (in-memory fake sink), voice barge-in mean 0.02 ms / p95 0 ms (mock STT enforcement only).
- Root + web version 1.3.0; package.sh produces agentguard-v1.3.0.zip. Tag: v1.3.0 (annotated, local only).
- Known limits: live BigQuery/Snowflake, live PagerDuty/Opsgenie, live STT, live custom-domain TLS — UNVERIFIED in VM (adapters + NOT_CONFIGURED behavior tested). Badge public-verify endpoint takes a caller-supplied publicKey — production must pin keys from org records (see SECURITY.md). v1.3 server state (brands, schedules, on-call, warehouse fake) is in-memory dev/test; production persists in Postgres (manual migration step).
- Remaining manual steps (NOT done): push tags, marketplace moderation policy, custom-domain TLS + DNS ownership, warehouse credentials, PagerDuty/Opsgenie keys, STT provider keys.



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
