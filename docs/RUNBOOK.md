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

## v1.2 runbooks
### Sandbox infra
- Dev/test: LocalSandboxProvider (no-shell, argv allowlist, egress pre-check, timeout kill). NOT a security boundary — see SECURITY.md.
- Production: set SANDBOX_PROVIDER=docker (image via SANDBOX_DOCKER_IMAGE; run with --read-only, --cap-drop=ALL, --network=none except allowlisted egress proxy, cgroup CPU/memory limits) or SANDBOX_PROVIDER=firecracker (microVM per run, config via SANDBOX_FIRECRACKER_CONFIG). Sandbox provider down -> fail-closed for sandbox actions with a clear SANDBOX_NOT_CONFIGURED / execution error; non-sandbox actions unaffected.
### SPIRE deployment
- Install SPIRE server + agent per workload; set SPIRE_AGENT_ADDRESS and SPIRE_TRUST_DOMAIN; agents fetch SVIDs and present them as attested tokens. High/critical tiers reject unattested callers. Attestation issuer down -> per-agent fail-mode (fail-open allows with audit, fail-closed denies).
- Key rotation: SPIRE handles SVID rotation; mock issuer has no rotation (test-only).
### OTS / EVM anchoring config
- OpenTimestamps: set OTS_CALENDAR_URL (public calendar, e.g. https://alice.btc.calendar.opentimestamps.org). Anchors are free; verify with a public OTS verifier. Cost per anchor: ~$0.
- EVM: set EVM_RPC_URL + EVM_ANCHOR_CONTRACT (contract storing keccak256(root) -> timestamp). Cost per anchor: gas, varies with network (record actual spend before launch; estimate in docs/COST_ESTIMATE.md as variable).
- Timestamping service down: anchors queue via AnchorQueue (status pending), retry on recovery, never silently skipped.
### DP epsilon choice
- Default budget: epsilon total 1.0 per release window, 0.25 per query. Smaller epsilon = stronger privacy, noisier aggregates. Choose epsilon with your privacy counsel: 1.0 is a common starting point for aggregate analytics; do not raise it without review. Budget exhaustion rejects with 429 DP_BUDGET_EXHAUSTED — wait for the next window or increase the budget deliberately with an audit entry.
### v1.2 chaos rows
- Sandbox provider down: fail-closed for sandbox actions, clear error; other actions unaffected.
- Attestation issuer down: fail per agent fail-mode (fail-open: allow + audit; fail-closed: deny).
- Timestamping service down: anchor queued, retried, marked pending — never silently skipped.

## Production hardening (v1.2.1)
### Production boot check
- On boot (and on `/api/ready`), `validateProductionEnv()` fails fast in production for the full list in PRODUCTION_READINESS.md P1. Fix the named variable and restart; do not bypass.
### Rate limiting
- In-memory token bucket per process: ingest 60/min/key, policy/check 300/min/key, gateway 60/min/key. Production MUST set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for a shared limiter; until then, limits are per-instance and restarts reset buckets. 429 responses carry `Retry-After`.
### Data lifecycle / GDPR
- Retention: purge rows older than the plan cutoff (`retentionCutoffIso` / `expiredEventIds` in `packages/shared/src/lifecycle.ts`) via a scheduled job against the production DB. Free 7d / Pro 30d / Team 90d / Enterprise 365d.
- GDPR export: `buildOrgExport()` — redact every event payload with `redactObject` before filling the export; never export raw PII.
- Org deletion: `requestOrgDeletion()` starts a 30-day grace period; delete rows only after `deletionDue()` is true. Keep the audit trail of the deletion request itself.
### Secrets
- Run `node scripts/secret-scan.mjs` in CI (wired into `pnpm verify:all`). Never commit `.env`, `*.pem`, `*.key`.

## v1.3 runbooks
### Marketplace moderation
1. Review new listings: trust score ≥ 60 is automatic, but a human moderator should spot-check listings with sudden history improvements (possible history gaming). 2. Revoked/suspended sellers: remove listings + add org to the badge revocation list (revoked orgs verify as invalid). 3. Marketplace moderation policy itself is a manual step — write it before opening the marketplace to third-party sellers.
### Custom-domain TLS
1. Org sets a DNS CNAME from their domain (e.g. console.client.com) to the AgentGuard console host. 2. Deployer verifies DNS ownership (TXT record) before serving the brand on that domain. 3. Provision a TLS certificate (Vercel automatic certs, or ACME via the hosting provider). 4. No live TLS is performed or verified in the build VM — this is a deployer step.
### Warehouse credentials
- Postgres: set WAREHOUSE_DATABASE_URL to a Postgres DSN with INSERT on warehouse_events / warehouse_audit / warehouse_costs (schema in docs/WAREHOUSE_SCHEMA.md). Production routes return 503 without it. BigQuery: BIGQUERY_PROJECT_ID + BIGQUERY_DATASET + BIGQUERY_CREDENTIALS. Snowflake: SNOWFLAKE_ACCOUNT + SNOWFLAKE_USER + SNOWFLAKE_PASSWORD + SNOWFLAKE_WAREHOUSE. Adapters throw NOT_CONFIGURED until configured.
### PagerDuty / Opsgenie keys
- PagerDuty: PAGERDUTY_API_KEY + PAGERDUTY_SERVICE_ID. Opsgenie: OPSGENIE_API_KEY. Until configured, on-call routes use the dev/test-only MockOnCall and return 503 in production. SLA-breach incidents page the on-call approver; the approver's decision resolves the incident.
### STT provider keys
- STT_PROVIDER=real + STT_API_KEY for a real STT provider. Until configured, voice routes use the dev/test-only MockStt (scripted transcripts) and return 503 in production. STT-down: fail-closed blocks the call leg; fail-open continues UNGOVERNED only when explicitly configured and flagged.
### Warehouse sink down (chaos)
- Rows buffer (BufferedWarehouseSync), flush on recovery, and dedupe on idempotency keys — never lost, never double-written.
### STT provider down (chaos)
- Follows the configured fail mode: fail-closed blocks the leg; fail-open continues UNGOVERNED and flagged.
### Marketplace scoring job down (chaos)
- Listings keep their last-known score with a staleness badge (stale after 24h) — never a silently fresh-looking score.

## v1.4 runbooks — theme & density
- Theme: light/dark toggle in the app bar. Persisted per-device in localStorage (`ag-theme`); falls back to `prefers-color-scheme`. No server-side setting, no cookie — a user who switches devices re-picks their theme.
- Density: Settings → Security → Display density (comfortable / compact), persisted per-device in localStorage (`ag-density`). Affects spacing only.
- First-paint note: no inline theme script (CSP `script-src 'self'` blocks inline scripts), so the first paint may briefly show the light theme before the stored theme applies. Accepted tradeoff; recorded in DECISIONS.md.
- Designer review: still a manual step — review on a real device at 360 / 768 / 1024 / 1440 / 1920, plus a browser screenshot pass (Playwright was blocked in the build VM). Real customer testimonials still needed to replace the MARKED placeholders on the marketing page.
