# Known Issues

- No live Postgres/Redis in build VM: MemoryStore used when DATABASE_URL unset. Production must set DATABASE_URL + run Drizzle DDL (see drizzle/schema.ts).
- Better Auth, Paddle live, Inngest, Upstash, Cloudinary, R2, Resend, AI providers: env-gated adapters/stubs, not live integrations. Wire real SDKs with credentials before launch.
- Pricing approximate — verify against official pages.
- Playwright e2e, k6, Docker, fresh-clone: manual verification required (no browser/Docker in VM).
- Legal text placeholders (LEGAL TEXT REQUIRED) — counsel review required.
- No BLOCKED items; failure protocol not triggered.
