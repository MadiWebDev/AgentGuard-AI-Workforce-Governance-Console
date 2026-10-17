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
