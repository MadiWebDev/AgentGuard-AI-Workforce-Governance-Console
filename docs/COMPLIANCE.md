# Compliance (not legal advice, not a certification)

SOC 2: access control (RBAC + authorize), audit log (hash chain), change management (policy versioning + diff), availability (health/ready), confidentiality (redaction + encryption).
EU AI Act: oversight records (evidence templates: EU AI Act oversight record, SOC 2 evidence, incident report), human oversight (approvals, 2-person critical), logging (ingest + audit), transparency (model/provider/cost per event).
GDPR: export, deletion with grace, retention policies, subprocessors page (LEGAL TEXT REQUIRED).

## v1.1 compliance notes
- Residency (R20): EU org payloads/evidence/exports route to eu-bucket/eu-queue; cross-region reads 403 + audit-logged.
- Packs (R27): EU AI Act oversight, SOC 2 baseline, finance DLP, support QA starter — versioned, draft-only install, simulation before activation, activation audited.
- Runbooks (R26): compromised-agent runbook steps verified + audit-logged with incident evidence pack.
- SIEM (R25): signed, exactly-once delivery with replay and buffering — audit trail preserved across endpoint outages.

## v1.2 compliance notes
- Anchoring (R35): daily Merkle roots anchored with timestamp proofs (local Ed25519 test-only; OTS/EVM in production); verify page shows row -> Merkle root -> timestamp proof -> (optional) chain tx. Tampered roots fail validation.
- Continuous compliance (R36): 4 scheduled control tests (kill-switch, chain, checkpoint backup, redaction probe) with 30-day auditor history + evidence artifacts.
- Lineage (R38): every trace carries model/prompt/tool/policy/SDK versions; evidence packs include the lineage block bound by hash into the signed manifest.
- Benchmarking (R37): opt-in only, DP epsilon budget 1.0/window, bucket-level aggregates only — no org identifiable. Epsilon choice is documented in RUNBOOK.
- Attestation (A3) supports SOC 2 logical-access evidence: high/critical tiers require workload-bound attestation beyond API keys.

## v1.3 compliance notes
- Marketplace (R39): trust scores from governance history only; publish threshold + verified badge enforced; buyer onboarding creates a governed registry entry (audit-logged).
- A2A (R40): pair policies + content guards + exact-cent cost attribution; message audit records link the full multi-agent trace.
- White-label (R41): per-org brand + portal scoping; leakCheck asserts no AgentGuard branding in branded output; custom-domain TLS is a documented deployer step.
- MSP (R42): delegated admin scoped per client; enforced accessor blocks cross-org reads (adversarial test); health scores recompute nightly.
- Client billing (R43): integer-cent invoices + margins reconcile to the penny; real PDF invoices; invoices audit-logged.
- Scheduled audits (R44): recurring control tests + signed evidence packs + delivery logs — auditor evidence delivered on schedule.
- Warehouse (R45): exactly-once sync/backfill with idempotency keys; documented schema for events/audit/costs.
- On-call (R46): SLA-breach escalation + decision resolution, round trip audit-logged.
- Trust badge (R47): Ed25519-signed badge; tamper fails; revoked orgs invalid; public verification endpoint.
- Voice (R48): transcript policy enforcement + barge-in + guardrail_triggered evidence with PII-redacted transcripts.
