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

## v1.2 threat models
- Sandbox escape: local sandbox runs no-shell argv-allowlisted commands with an egress allowlist enforced BEFORE execution, timeout kill, and full capture. Residual risk: a allowlisted binary (node/python3) can still execute arbitrary code passed as argv — treat LocalSandbox as dev/test-only isolation, NOT a security boundary. Production must use the Docker (seccomp + no-new-privileges + read-only rootfs + dropped capabilities) or Firecracker (microVM) providers with cgroup CPU/memory limits; see RUNBOOK. Escape attempts are logged as evidence.
- Attestation theft: attested tokens are short-lived (5 min default), bound to workloadId + tier, HMAC-signed (mock) / SPIFFE SVID (production). Stolen-key replay without attestation is denied + audit-logged for high/critical tiers. Stolen attested tokens are usable only within their short window and workload binding; expiry forces re-issuance. Mock issuer is rejected in production.
- Collusion: split-bypass and chunked-exfiltration detection is heuristic (session/exfil grouping) — it can miss novel splits (false negatives) and flag coincidental same-session pairs (false positives, measured 0 on seeded normal traffic). It is a detective control, not a preventive guarantee; prevention remains policy + approvals + sandboxing.
- Timestamp spoofing: local proofs are Ed25519-signed with a provider keypair; a compromised provider key lets an attacker forge proofs. Production OTS proofs are anchored to Bitcoin via public calendar servers (independently verifiable); EVM anchors are on-chain. Verify proofs against the expected provider public key / calendar / contract, never trust a proof alone.
- NL policy authoring / autopilot: drafts never auto-activate; activation is a separate audited human action; loosening a deny-class rule needs two distinct approvers. Prompt-injection in utterances cannot activate anything (parser is deterministic; AI path, when configured, only drafts).
