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
