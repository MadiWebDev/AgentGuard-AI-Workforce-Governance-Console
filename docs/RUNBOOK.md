# Runbook

- Boot: pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev; docker compose up for Postgres+Redis.
- Health: /api/health, /api/ready.
- Rotate key: revoke old, mint new, grace period via graceExpiresAt.
- Paddle: point webhook at https://<domain>/api/webhooks/paddle; verify signature; replay safe.
- Evidence: POST /api/v1/evidence-packs, verify via verify-pack page / CLI.
- Incidents: check audit/verify, dead-letter table, Inngest outbox, Sentry.

## v1.1 runbooks
### Key rotation (BYOK)
1. Call MockKms.rotate(orgId) (or provider rotation in production KMS). 2. Re-encrypt all packs with reEncryptAll. 3. Verify old+new packs decrypt. 4. Only then revokeOldVersion(old) — it refuses while any pack remains on the old version. 5. Audit-log the rotation.
### KMS down (chaos)
- New encryptions fail closed (error, no plaintext stored). Reads of already-encrypted packs continue with the current key version.
### SIEM down (chaos)
- Deliveries buffer (status buffered), are retried with backoff, and are never lost; replayFrom fills gaps exactly once via idempotency keys.
### Push down (chaos)
- Push falls back to email notification; offline decisions queue and sync on reconnect (already-decided → existing decision wins, no overwrite).
### Compromised agent
- POST /api/v1/runbooks/compromised-agent: quarantine → revoke keys → freeze pending approvals → notify stakeholders → open incident evidence pack. All steps verified + audit-logged.
