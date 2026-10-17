# Changelog

## v1.1.0
- F1 SSO/SAML (mock, HMAC-signed, test-only) + SCIM v2 Users, JIT provisioning, requireSSO, deprovision revokes sessions.
- F2 Data residency: EU/US bucket+queue routing, cross-region 403 + audit, region migration.
- F3 BYOK: MockKms (env-gated, rejected in production), AWS/Cloudflare adapters (NOT_CONFIGURED), rotation + re-encryption.
- F4 Red-team attack library + draft-only policy drafts.
- F5 Baselining + drift alerts (|z|>3).
- F6 Optimizer recommendations with quality guardrail + cache replay.
- F7 SIEM (generic/Splunk/Datadog), HMAC-signed delivery, exactly-once replay, buffered retry.
- F8 Compromised-agent runbook with verified ordered steps + evidence pack.
- F9 Prebuilt policy packs (EU AI Act, SOC 2, finance DLP, support QA): draft-only install + simulation, separate audited activation.
- F10 PWA + push (mock in dev/test), offline decision queue with conflict winner, mobile approve page.


## 1.0.0
- Initial v1: golden path, ingest, policy, approvals, audit, costs, billing adapters, add-ons, SDKs, MCP.
