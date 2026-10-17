# Decisions

## v1.4 design decisions
- HARD RULE: no behavior change. API routes, response shapes, domain logic in packages/shared, auth, billing, audit, policy semantics are untouched. Only visual + UX-flow changes. Flow improvements (shell nav, drawers, stepper, confirm-before-destructive-call) recorded here with before/after.
- Brand seed: indigo #4F46E5 (no canonical brand color existed — the old CSS used slate #0f172a for buttons). M3 light + dark roles derived from this seed; documented in docs/design/TOKENS.md.
- Fonts: system stack styled to the M3 type scale (Inter/Plus Jakarta Sans first in the stack when installed, IBM Plex Mono for code/keys when installed). NO external font CDN — the CSP is `font-src 'self' data:` and a CDN would violate it. No new font dependency; next/font/google would download at build time and fails offline, so the system stack is the honest choice.
- shadcn/ui + Radix were NOT actually installed in this repo (no components.json, no @/components/ui, no Radix deps). Adding them would be a framework/dependency change, so M3 primitives are hand-built in apps/web/src/components/ to M3 specs instead. No new CSS framework, no new deps.
- Theme: `.dark` class on <html>, toggled by a client ThemeProvider reading localStorage + prefers-color-scheme. No inline theme script (CSP `script-src 'self'` blocks inline scripts) — a brief first-paint flash to light theme is the accepted tradeoff; theme persists in localStorage (`ag-theme`) and density in `ag-density`.
- /design gallery is dev-only: renders 404 when NODE_ENV === "production" (via notFound()), never exposed in production.
- Testimonials on marketing: placeholders are visibly MARKED as placeholders, no fake customer names/logos/stats. The hero stats ticker is labeled "demo" unless fed by a real API response.
- Confirm-before-destructive: pause/quarantine/revoke/delete actions now show a ConfirmDialog BEFORE the existing API call fires. The API call itself is unchanged; only the confirmation step was added.
- Destructive-action, wizard-stepper, drawer-vs-page, and bottom-sheet-on-mobile changes are UX-flow only; underlying routes/calls unchanged.
- Screenshots/axe/Lighthouse: attempted with real tools; if the VM blocks browser install or a tool, the item is recorded UNVERIFIED with the exact blocker — never fabricated.
- D6 PageHeader exemptions: the marketing home (hero pattern) and the 4 auth pages (AuthShell centered-card pattern) do not use PageHeader. The design test encodes exactly these 5 exemptions; every other page uses PageHeader. Forcing PageHeader into the hero/auth layouts would worsen those layouts, not improve them.
- D6 auth demo buttons: login/signup/magic-link/verify-2fa submit buttons were dead (type="button", no handler, form with no action). They now submit the form client-side and show an honest inline notice ("Demo form — auth is env-gated … No session is created") instead of doing nothing. "Use a magic link instead" is now a real link to /magic-link. No auth behavior changed: no session is created, no email is sent, no account is created — the notice says so. Recorded because a visual fix (dead button) touched the auth flow's UX.
- D6 QA tooling outcome: Playwright browser download timed out twice (cdn.playwright.dev unreachable/slow in VM); axe-core and Lighthouse not installed and would need the same blocked download. Screenshots/axe/Lighthouse are UNVERIFIED with that blocker; substitute evidence used instead (token-pair contrast computed from globals.css, HTTP crawl of all routes, static checks for div-onClick / fixed widths). No screenshots, axe scores, or Lighthouse numbers are claimed.
- Token naming: inverse pair is `--m3-inverse-on-surface` / `--m3-inverse-surface` (M3-correct), not `on-inverse-surface`. Contrast script initially looked up the wrong key and reported MISSING; corrected to the real token names (light 11.65, dark 10.17, both PASS AA).

## v1.3 decisions

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

## v1.3 decisions
- Trust score weights: approvalCompliance*40 + uptime*30 + clean-history base 30 − min(20, incidents*2) − min(10, violations*1), clamped 0..100. Publish threshold 60, verified badge 80 + chain verified. Stale after 24h (last-known score + staleness badge when the scoring job is down).
- A2A cost attribution in integer cents with largest-remainder rounding so per-agent splits sum EXACTLY to the total. Content guards: regex + PII-class; a guard hit blocks delivery regardless of pair action.
- White-label: brand validation requires #rrggbb colors, http(s) logo, email From; custom domains must be public hostnames with a TLD. leakCheck stringifies rendered output and asserts no "AgentGuard".
- MSP: access enforced in requireAccess (throws FORBIDDEN); health score = compliance*60 + 40 − min(25, alerts*2) − min(15, incidents*3).
- Client billing: ALL money integer cents; tax via integer basis points (rounded once); PDF via a hand-rolled minimal PDF 1.4 writer (no heavy dep) producing a real %PDF file with xref table.
- Scheduled audits reuse v1.2 runControlTests + Ed25519 evidence manifests; delivery adapters: console (dev/test-only, throws in prod), email/portal NOT_CONFIGURED stubs.
- Warehouse: PostgresSink executes parameterized INSERTs with ON CONFLICT DO NOTHING against an injected DbClient; tests use FakeDbClient. BigQuery/Snowflake adapters throw NOT_CONFIGURED. Backfill is exactly-once via sink-level idempotency dedupe + DB conflict guard.
- On-call: MockOnCall in-memory for dev/test (503 in prod routes); PagerDuty/Opsgenie adapters throw NOT_CONFIGURED without keys (documented stubs, no live calls).
- Trust badge: Ed25519 (same pattern as evidence manifests) chosen over HMAC so verification is public-key based with no shared secret. Caveat documented in SECURITY.md: the public verify endpoint takes a caller-supplied publicKey; production should pin keys from org records.
- Voice: MockStt decodes base64 `script:<transcript>` fixtures (dev/test-only, 503 in prod); RealSttAdapter throws NOT_CONFIGURED without STT_PROVIDER/STT_API_KEY. Barge-in actions: warn | terminate. STT-down fail-open is explicit-only and always flagged ungoverned.
- v1.3 in-memory server state (brands, schedules, on-call, warehouse fake) lives in apps/web/src/server/v13-store.ts for dev/test; production persists in Postgres (manual migration step).
