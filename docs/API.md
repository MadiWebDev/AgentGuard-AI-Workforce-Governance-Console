# API

Base: /api/v1. Auth: agent key via x-api-key (scopes ingest, policy:check) or session headers (x-user-id, x-org-id, x-role) in demo/dev. Production: Better Auth session.

| Method | Path | Purpose |
|---|---|---|
| POST | /api/v1/ingest | batch <=500, <=1MB, idempotent |
| POST | /api/v1/policy/check | allow/deny/require_approval |
| POST | /api/v1/policy/simulate | replay events vs draft |
| GET/POST | /api/v1/agents | registry |
| POST | /api/v1/agents/[id]/pause, /quarantine | kill switch |
| GET/POST | /api/v1/approvals | queue + request |
| POST | /api/v1/approvals/[id]/approve, /reject | decide (comment required) |
| GET | /api/v1/audit/verify | chain verification |
| POST | /api/v1/audit/export | evidence export |
| GET | /api/v1/costs/summary | cost monitor |
| POST | /api/v1/evidence-packs | generate pack |
| GET | /api/v1/openapi.json | OpenAPI 3.1 |
| POST | /api/v1/gateway/[...path] | LLM proxy (policy + log) |
| POST | /api/webhooks/paddle | Paddle webhooks (HMAC) |
| GET | /api/sse/approvals, /api/sse/traces | SSE |

Error format: { error: { code, message, details, request_id } }. Deprecation: v1 stable; breaking changes -> v2 with 6-month notice.

## v1.1 endpoints
- POST /api/v1/sso/login — mock-SAML login (test-only; rejected in production). Body: {assertion, secret, issuer, audience, requireSSO?, passwordLogin?}.
- GET/POST /api/scim/v2/Users, GET/PATCH/DELETE /api/scim/v2/Users/[id] — SCIM v2, Bearer auth (SCIM_TOKEN env, default `scim-test-token` in dev/test). DELETE deprovisions + revokes sessions.
- GET/POST /api/v1/residency — region bucket/queue; POST migrates region (verified).
- POST /api/v1/redteam/run — {mode: strict|permissive} → {checks, findings, score, drafts}.
- POST /api/v1/siem/endpoints, /api/v1/siem/deliver, /api/v1/siem/replay, GET /api/v1/siem/deliveries.
- POST /api/v1/runbooks/compromised-agent — {agentId, pendingApprovalIds?, stakeholderEmails?}.
- GET /api/v1/packs, POST /api/v1/packs/install, POST /api/v1/packs/activate.
- POST /api/v1/push/subscribe — {userId, endpoint, payload?} (mock push in dev/test).
- Error format unchanged: {error:{code,message,details,request_id}}.

## v1.2 endpoints
- POST /api/v1/gateway/stream-inspect — {tokens[], windowTokens?, guardPolicies[{id, pattern}]} → {terminated, outputTokens, matchedRuleId, redactedTranscript, guardrailEvent}.
- POST /api/v1/sandbox/execute — {command, args?, stdin?, egressAllowlist?, timeoutMs?} → {stdout, stderr, exitCode, killedByLimit, blocked, blockReason, evidence}.
- POST /api/v1/attestation/issue, /api/v1/attestation/verify — mock attestation (test-only; rejected in production; SPIRE in production).
- POST /api/v1/policies/draft-from-nl — {utterance, recentEvents?} → {policy (draft), explanation, simulation}. Drafts never affect policy/check until activated.
- POST /api/v1/autopilot/run — {decisions, driftFindings?} → {proposals}. POST /api/v1/autopilot/activate — {proposal, approvers} → {policy (active), audit}; two-person required when loosening a deny-class rule.
- POST /api/v1/collusion/detect — {traces, autoQuarantine?} → {alerts, quarantinedAgentIds, audit}.
- POST /api/v1/anchoring/anchor — {manifest} → {proof, status}. Proof verifies offline from the pack alone.
- POST /api/v1/compliance/run, GET /api/v1/compliance/controls — control tests + 30-day history + pass rate.
- POST /api/v1/benchmarks/publish — {orgs, epsilonPerQuery?} → {aggregates, epsilonSpent, budgetAfter}; DP budget exhaustion → 429 DP_BUDGET_EXHAUSTED.
- POST /api/v1/lineage/diff — {old, new} → {changedFields, changes, summary}.
- Error format unchanged: {error:{code,message,details,request_id}}.
