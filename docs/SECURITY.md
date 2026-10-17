# Security — STRIDE

- Spoofing: API keys hashed (SHA-256), shown once; session auth via Better Auth in prod; HMAC webhooks.
- Tampering: audit hash chain + Ed25519 evidence manifests; append-only triggers (Drizzle DDL).
- Repudiation: audit covers admin/policy/approval/key/auth-failure/export/billing actions.
- Info disclosure: PII redaction before storage; envelope encryption (AES-256-GCM) for secrets; secrets only via env.
- DoS: rate limits, 1MB batch cap, size limits, SSRF guard.
- Elevation: central authorize(), RLS defense-in-depth, adversarial tenant-isolation tests.
- Headers: CSP nonces (TODO prod), HSTS, frame-ancestors none, Referrer-Policy, Permissions-Policy.
- SSRF: block private/loopback/link-local/metadata IPs, DNS re-check, redirect re-check.
- Not legal advice / not a certification. Review audit-chain, policy, billing code before launch.

## v1.1 security notes
- Mock SAML: HMAC-signed assertions, audience+expiry+signature verified; mock SAML and MockKms are rejected when NODE_ENV=production. Never use mock adapters in production.
- SCIM: Bearer token required; deprovision immediately revokes all sessions for the user.
- BYOK: AES-256-GCM per-org key versions; old version revoked only after all packs re-encrypted. AWS/Cloudflare adapters throw NOT_CONFIGURED until real KMS credentials are configured; they make no live calls.
- SIEM delivery: HMAC-SHA256 over {eventId, payload, timestamp}, 5-minute replay window, idempotency keys for exactly-once replay.
- Red-team drafts and pack installs are DRAFT-only; activation is a separate audited action. No policy auto-activates.
