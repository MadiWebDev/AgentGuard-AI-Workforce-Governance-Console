# Runbook

- Boot: pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev; docker compose up for Postgres+Redis.
- Health: /api/health, /api/ready.
- Rotate key: revoke old, mint new, grace period via graceExpiresAt.
- Paddle: point webhook at https://<domain>/api/webhooks/paddle; verify signature; replay safe.
- Evidence: POST /api/v1/evidence-packs, verify via verify-pack page / CLI.
- Incidents: check audit/verify, dead-letter table, Inngest outbox, Sentry.
