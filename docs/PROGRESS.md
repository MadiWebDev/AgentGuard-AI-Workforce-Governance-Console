# Progress

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
