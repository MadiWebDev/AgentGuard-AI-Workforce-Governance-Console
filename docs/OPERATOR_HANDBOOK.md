# Operator Handbook (non-technical founder)

1. Create accounts: Paddle, Neon, Upstash, Inngest, R2, Cloudinary, Resend, AI providers, Sentry.
2. Copy .env.example to .env, fill values (never commit .env).
3. Run scripts/setup-paddle.ts, set PADDLE_PRICE_*.
4. Point Paddle webhook at https://<domain>/api/webhooks/paddle; Cloudinary webhook similarly.
5. Deploy to Vercel, set env vars there, run migrations + seed on Neon, verify demo login.
6. Have a developer review audit-chain, policy-engine, billing code. Get legal text reviewed.
7. Pilot with one real team before selling.
