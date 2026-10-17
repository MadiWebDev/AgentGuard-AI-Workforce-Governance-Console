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

## v1.3 threat models
- Marketplace trust gaming: scores derive ONLY from governance history; the input type has no self-reported fields, so a seller cannot inflate a score with stars/marketing claims. Publish threshold (60) and verified badge (80 + chain verified) are enforced server-side. Residual risk: a seller could game history itself (e.g. fake low-risk traffic) — mitigate with anomaly review of sudden history improvements + marketplace moderation policy (manual step).
- A2A spoofing: pair policies are matched on fromAgent/toAgent; a mismatched policy throws POLICY_PAIR_MISMATCH. Content guards block payloads matching deny patterns; PII is redacted before storage. Residual risk: agent identity itself must be attested (v1.2 A3) — unattested A2A senders should be denied by deployment policy.
- White-label phishing: a white-labeled console could impersonate another brand. Mitigate: custom domains require DNS ownership verification (manual step in RUNBOOK) + brand configs are per-org and only editable by that org's admins. leakCheck asserts no AgentGuard branding leaks into branded output.
- Badge forgery: badges are Ed25519-signed over a canonical payload; tampered payloads fail verification; revoked orgs verify as invalid. The public verify endpoint takes the caller's publicKey — deployers must pin the expected org public key out-of-band; accepting an attacker-supplied key + signature pair would verify. Production deployments should resolve the public key from the org record, not the query string.
- Voice deepfake / impersonation: voice governance enforces transcript policy but does NOT authenticate the speaker. Deployers must pair it with speaker verification for high-risk call legs. Audio evidence is stored base64; transcripts are PII-redacted before storage. STT-down fail-open continues UNGOVERNED only when explicitly configured and is always flagged ungoverned.
- MSP isolation: access is enforced in requireAccess, not just the UI; adversarial tests assert a client admin cannot read another org. Invoice/margin math is integer cents — no float rounding.
- Warehouse sync: rows carry idempotency keys; duplicates are dropped (exactly-once). Sinks never log credentials; BigQuery/Snowflake adapters throw NOT_CONFIGURED without credentials.
