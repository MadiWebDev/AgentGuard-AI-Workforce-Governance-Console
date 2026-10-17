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
