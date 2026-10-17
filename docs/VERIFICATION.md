# Verification (R1-R18)

| Gate | Verdict | Evidence |
|---|---|---|
| R1 Golden path | PASS | pnpm verify:golden exit 0 |
| R2 Policy p95 <150ms | UNVERIFIED (live) | pure function microseconds; k6 required on deploy |
| R3 Ingest 500-batch <400ms | UNVERIFIED (live) | same — load test on deploy |
| R4 Kill switch <1s | PASS (logic) | paused agent -> deny in policy/check route |
| R5 No PII leak | PASS | redaction tests assert raw absent |
| R6 Chain verifies; tamper exact row | PASS | audit tests |
| R7 Evidence verifies; modified fails | PASS | evidence tests + golden |
| R8 Two-person + self-block | PASS | approvals tests + golden |
| R9 Webhook HMAC/replay/out-of-order | PASS | paddle tests |
| R10 Paddle flows | PASS (logic) | applyPaddleEvent tests |
| R11 No double-charge | PASS (logic) | idempotency via seen event ids; live Paddle charge needs sandbox |
| R12 200-parallel audit appends | PASS (logic) | sequential seq test 200 rows single chain |
| R13 Tenant isolation | PASS | authorize tests + cross-tenant route checks |
| R14 verify:all green | PASS | pnpm verify:all |
| R15 Fresh-clone | MANUAL | run documented commands in clean clone |
| R16 Chaos matrix | PARTIAL | adapters documented; live chaos needs deployed deps |
| R17 Route crawl zero console errors | MANUAL | pages are static JSX; Playwright crawl not run in VM |
| R18 Zip clean-room | PASS/attempt | scripts/package.sh + verify in temp dir |

Manual verification required: live Paddle/Neon/Cloudinary/R2/Upstash/Inngest/Resend/AI, Docker, Playwright crawl, k6 load test.

## v1.1 verification (R19–R28)
- R19 SSO/SCIM: golden F1 + v11.test.ts F1 PASS (mock-SAML verify, bypass fails, deprovision race → one terminal state, sessions revoked).
- R20 Residency: golden F2 + v11 F2 PASS (EU bucket, cross-region 403, migration verifies).
- R21 BYOK: golden F3 + v11 F3 PASS (rotation old+new verify, revoke only after re-encrypt, AWS adapter NOT_CONFIGURED).
- R22 Red-team: golden F4 + v11 F4 PASS (permissive agent ≥1 finding + draft; strict policy clean).
- R23 Baselining: golden F5 + v11 F5 PASS (10x-cost + new-tool anomaly → drift alert with trace id).
- R24 Optimizer: golden F6 + v11 F6 PASS (non-zero savings; cache replay reduces cost; downgrade blocked above error guardrail).
- R25 SIEM: golden F7 + v11 F7 PASS (signed delivery, exactly-once replay, buffered retry never lost). Load: scripts/siem-load.mjs (see run output).
- R26 Runbooks: golden F8 + v11 F8 PASS (5 ordered steps done, evidence pack id).
- R27 Packs: golden F9 + v11 F9 PASS (draft-only install, simulation wouldBlock=1, separate audited activation).
- R28 PWA/Push: golden F10 + v11 F10 PASS (mocked push delivers, offline sync, conflict winner).
- R1–R18 (v1): re-verified via golden 20/20 + core.test.ts 25/25 in the same verify:all run.

## v1.1 chaos rows
- KMS down: fail-closed for new encryptions, reads continue (design + adapter NOT_CONFIGURED behavior; no live KMS in VM).
- SIEM down: buffered/retried/never lost (v11 F7 test: buffered → retryBuffered → delivered).
- Push down: fallback email (documented in RUNBOOK.md; mock push in dev/test).

## v1.2 verification (R29–R38)
- R29 Token-stream (A1): golden A1 + v12 A1 PASS (stream cut within window, disallowed text never in full, guardrail event + rule id + redacted transcript; overhead 0.45 ms/call measured).
- R30 Sandbox (A2): golden A2 + v12 A2 PASS (egress block pre-execution, timeout kill, evidence capture, Docker NOT_CONFIGURED). Docker/Firecracker live execution UNVERIFIED (no Docker in VM).
- R31 Attestation (A3): golden A3 + v12 A3 PASS (stolen-key replay denied + audited, expiry forces re-issuance, tampered signature fails after HMAC-segment fix, issuer-down follows fail-mode, SPIRE NOT_CONFIGURED).
- R32 NL authoring (A4): golden A4 + v12 A4 PASS (5 utterances -> valid drafts, simulation diffs, weekend rule fires Sat not Mon, draft cannot affect policy/check).
- R33 Autopilot (A5): golden A5 + v12 A5 PASS (37-approval history -> proposal with evidenceCount 37 in unit test; golden uses 10; two-person rule enforced; never auto-activates; activation versioned + audited).
- R34 Collusion (A6): golden A6 + v12 A6 PASS (chunked + split-bypass alerts name all agents, reconstructed sequences, opt-in auto-quarantine, FPR 0 on 50 normal traces).
- R35 Anchoring (A7): golden A7 + v12 A7 PASS (anchor + offline pack verification, tampered root fails, queue/retry/pending never silently skipped, OTS NOT_CONFIGURED). Live OTS/EVM anchoring UNVERIFIED (no live chain in VM).
- R36 Compliance (A8): golden A8 + v12 A8 PASS (4 controls, history, 30-day window, broken control flips to fail + alert; store checkpoint + probe are real, not tautological).
- R37 Benchmarking (A9): v12 A9 PASS (opted-out exclusion identical output, remove-one-org delta within sensitivity/epsilon bound, budget accounting + exhaustion rejects). No golden check by design (DP randomness) — unit tests cover it.
- R38 Lineage (A10): golden A10 + v12 A10 PASS (prompt-upgrade diff entry, lineage attaches to traces, pack contains lineage block and verifies, tampered lineage fails).
- R1–R28: re-verified via verify:all (golden 20/20 v1 + 15/15 v1.1 + 9/9 v1.2 checks + tests) in the same run.

## v1.2 chaos rows
- Sandbox provider down: fail-closed for sandbox actions, clear error (Docker/Firecracker NOT_CONFIGURED behavior; live provider failure UNVERIFIED without Docker).
- Attestation issuer down: fail per agent fail-mode (v12 A3 test: fail-open allows + audits, fail-closed denies).
- Timestamping service down: anchor queued, retried, marked pending — never silently skipped (v12 A7 test).

## Production gates (P1–P10) — v1.2.1
- P1 Production env validation: PASS (validateProductionEnv + assertProductionEnv; prod.test.ts; golden PROD check).
- P2 Security headers: PASS (CSP, HSTS prod-only, Permissions-Policy, nosniff, referrer, frame deny; config test; build green with `output: "standalone"`).
- P3 Secrets hygiene: PASS (secret-scan wired into verify:all, scan clean; .gitignore covers .env*/pem/key; compose password fixed).
- P4 Error handling: PASS (serverError/formatServerError generic 500s in prod; 24 routes audited; remaining e.message uses are controlled 4xx/503 codes).
- P5 Ready honesty: PASS (getReadiness; /api/ready 503 on invalid prod env / unreachable store; dev reports memory-dev mode).
- P6 Logging without PII: PASS (safeLogEvent/safeLogMessage redact via PII pipeline; test asserts raw values absent; no other logger in src/).
- P7 Rate limits + payload limits: PASS in-memory (token bucket; ingest 60/min + 1MB 413; policy/check 300/min; gateway 60/min; 429 + Retry-After). Production MUST set Upstash vars for a shared limiter.
- P8 Dependency audit: UNVERIFIED — `pnpm audit` blocked by registry proxy 403 on audit endpoints in this VM. Run with registry access before launch.
- P9 Dockerfile/compose/CI: PASS code (multi-stage, non-root, no secrets in image, fail-fast frozen install, standalone CMD match; compose env password). CI file still NOT on GitHub (App 403) — remaining manual step.
- P10 Data lifecycle: PASS contract (retentionCutoff/expiredEventIds, 30-day deletion grace, GDPR export shape; live deletion is a deployer DB operation per RUNBOOK).
- R1–R38: re-verified via the same verify:all run (golden 45/45 incl. new PROD check + tests 81/81).

## v1.3 verification (R39–R48)
- R39 Marketplace (C1): golden C1 + v13 C1 PASS (publish below threshold → TRUST_THRESHOLD; seeded incidents lower score; buyer onboarding creates governed registry entry; self-reported fields ignored).
- R40 A2A (C2): golden C2 + v13 C2 PASS (denied pair cannot exchange; approved-with-conditions logs conditions; content guard blocks; cost split sums exactly to total in integer cents).
- R41 White-label (C3): golden C3 + v13 C3 PASS (branded render carries brand + leakCheck clean; invalid domain rejected; portal data scoped to one org).
- R42 MSP (C4): golden C4 + v13 C4 PASS (MSP admin sees all assigned clients; client admin blocked from org B by enforced accessor; health score recomputes on changed inputs; rollup aggregates).
- R43 Client billing (C5): golden C5 + v13 C5 PASS (seeded usage → hand-computed invoice 700 + 70 tax = 770; margins reconcile to the penny; PDF starts %PDF with %%EOF).
- R44 Scheduled audits (C6): golden C6 + v13 C6 PASS (due schedule runs end-to-end in test time: findings + signed pack + delivery log; not-due schedules do not run).
- R45 Warehouse (C7): golden C7 + v13 C7 PASS (seeded events land in test sink with documented schema; backfill counts match; duplicate backfill writes 0 — exactly-once).
- R46 On-call (C8): golden C8 + v13 C8 PASS (SLA breach → mock incident; decision resolves; round trip audit-logged; PagerDuty adapter NOT_CONFIGURED).
- R47 Trust badge (C9): golden C9 + v13 C9 PASS (badge verifies; tampered payload fails; revoked org invalid; snippet contains embed link).
- R48 Voice (C10): golden C10 + v13 C10 PASS (seeded violating utterance → barge-in terminate + guardrail_triggered + redacted transcript + audio evidence; clean utterance passes; STT-down fail modes; real STT NOT_CONFIGURED).
- R1–R38: re-verified via the same verify:all run (golden 59/59 incl. 13 new v1.3 check lines + PROD check; tests 105/105).
- P1–P10: re-verified via the same verify:all run — P1–P7, P9 (code), P10 PASS; P8 UNVERIFIED (pnpm audit still blocked by registry proxy 403, same as v1.2.1); P9 CI still NOT on GitHub (App 403) — remaining manual step. New v1.3 routes keep prod gates: mock on-call/voice/warehouse adapters return 503 in production; mock STT rejected in prod.

## v1.3 chaos rows
- Warehouse sink down: rows buffer (BufferedWarehouseSync), flush on recovery, dedupe on idempotency keys — never lost, never double-written (v13 C7 test: buffered → flush path + duplicate backfill writes 0).
- STT provider down: fail per configured mode — fail-closed blocks the call leg; fail-open continues UNGOVERNED only when explicitly configured and is always flagged ungoverned (v13 C10 test).
- Marketplace scoring job down: listings show last-known score with staleness badge (stale after 24h) — never a silently fresh-looking score (v13 C1 test).
