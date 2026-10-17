# Decisions

- Node 22, Next 14.2, React 18, TypeScript strict, Zod, Vitest.
- Runtime works without live Postgres/Redis: MemoryStore when DATABASE_URL unset. Drizzle schema documents production tables; Neon adapter is a documented production step, not faked live.
- Better Auth / Paddle / Inngest / Upstash / Cloudinary / R2 / Resend / AI providers: typed adapter interfaces + env-gated local adapters (local disk, console email, in-memory queue/cache). Local adapters REJECTED in production (see src/lib/env.ts assertProductionAdapters + docs).
- Versions resolved at build: next 14.2.32, react 18.3.1, zod 3.23.8, vitest 3.2.4, typescript 5.9.3, tailwindcss 3.4.15, tsx 4.20.6.
- Pricing seeded as APPROXIMATE (source URLs + date 2026-10-17 recorded in pricing.ts) — verify against official provider pages before launch.
- No Docker in build VM: docker-compose.yml provided for user machines; tests run without Docker.
- MCP server: minimal stdio JSON-RPC implementing MCP initialize/tools/list/tools/call (no heavy MCP SDK to keep build stable).

## v1.1 decisions
- Mock SAML / Mock KMS / mock SIEM / mock push are env-gated and rejected in production; real adapters (AWS KMS, Cloudflare KMS, Splunk HEC, Datadog, Web Push) are documented stubs or config-gated, never faked in production paths.
- Red-team and pack policies are DRAFT-only; activation is always a separate audited human action.
- SIEM exactly-once uses idempotency keys (siem:endpoint:event) + delivered-state dedupe, not timestamps alone.
- Offline approval conflict resolution: first decision wins; queued conflicting decisions are reported as conflicts, never overwrite.

## v1.2 decisions
- Lockfile prep fix: regenerated via `pnpm install --lockfile-only` in /tmp copy (in-place run failed with EPERM chown in this VM); only change is @types/node@22.10.2 added to mcp-server/sdk-ts/shared importers. Clean-room frozen install now passes.
- v1.2 adapters (env-gated, rejected in production): LocalSandbox (restricted subprocess), MockAttestationIssuer (HMAC short-lived), LocalTimestamping (hash-chained OTS-style proofs, test-only), NL authoring via deterministic parser when no AI provider key (never fabricated results).
- Policy action `execute_in_sandbox` added to PolicyRule action union; drafts (NL/autopilot/packs) never affect policy/check until activated.
- DP epsilon budget: total 1.0 per release window, per-query spend tracked, reject on exhaustion; Laplace noise with fixed seed in tests for determinism.

## v1.2 decisions (continued)
- Token-stream: buffered-window release semantics — tokens are released only after clearing the window; on match only pre-window tokens are released. Window default 20 tokens.
- Sandbox: LocalSandbox env is minimal ({PATH}) via unknown-cast (web @types/node requires NODE_ENV in ProcessEnv); no-shell + argv allowlist + egress pre-check. LocalSandbox is dev/test isolation, not a security boundary.
- Attestation: HMAC covers the raw base64url payload segment (re-serialization canonicalization bug fixed after a tampered-signature test caught Buffer.from hex truncation); signature must match /^[0-9a-f]{64}$/.
- NL authoring: deterministic parser is the default path; AI module path only when a provider key is configured. New rule fields timeWindow + rateLimitPerMinute evaluated in ruleMatches.
- Autopilot: loosen threshold default 5 approvals (all approved); tighten from drift findings; proposals are drafts; activation is versioned + audited.
- Collusion: heuristic detective control (session/exfil grouping), not a preventive guarantee; FPR measured on seeded normal traffic.
- Anchoring: Ed25519 local proofs carry their own public key for offline verification; OTS/EVM are NOT_CONFIGURED adapters.
- Compliance: store checkpoint root is a SHA-256 over audit row hashes at creation; hasCheckpoint re-verifies the first N rows.
- Benchmarking: epsilon total 1.0/window, 0.25/query; seeded mulberry32 RNG in tests for determinism; production callers should seed from crypto randomness.
- Lineage: lineageHash binds lineage into the signed manifest via a lineage.json manifest entry.
- Lockfile prep fix (v1.2-prep): see v1.2 start in PROGRESS.md.

## v1.2.1 production hardening
- Production env validation is fail-fast with an aggregated error (all blocking issues listed at once) rather than one-at-a-time; mock adapters are detected via explicit env flags (STORAGE_MODE, KMS_PROVIDER, ATTESTATION_ISSUER, SAML_MODE, SANDBOX_PROVIDER). Upstash absence is a warning, not a boot failure, because rate limiting has a documented in-memory fallback; production MUST still set Upstash vars for a shared limiter.
- 500 error messages are generic in production (`Internal error`); controlled ApiError codes (4xx/503) keep their messages. Remaining `e.message` uses in routes are controlled 4xx/503 codes only.
- Rate limits (ingest 60/min, policy/check 300/min, gateway 60/min per key) are starting defaults, chosen to be safe for a small launch; tune with real traffic + Upstash.
- CSP uses `style-src 'unsafe-inline'` because Tailwind/inline styles need it; everything else is `'self'`-scoped with `frame-ancestors 'none'`. HSTS is production-only (prevents localhost dev breakage).
- Dockerfile uses `output: "standalone"` to match the CMD; the `|| pnpm install` fallback was removed (lockfile is now in sync since the v1.2 prep fix).
- `pnpm audit` could not run in the build VM (registry proxy 403 on the audit endpoints) — recorded UNVERIFIED, not invented.
- Version policy: root + web both 1.2.1 for this patch release; other packages keep their own 1.0.0 versions (unchanged scope).
