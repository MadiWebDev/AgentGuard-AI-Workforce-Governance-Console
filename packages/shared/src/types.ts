
export type Role = "owner"|"admin"|"approver"|"analyst"|"viewer";
export type RiskTier = "low"|"medium"|"high"|"critical";
export type AgentStatus = "active"|"paused"|"quarantined";
export interface Actor { userId: string; orgId: string; role: Role; email?: string; }
export interface Org { id: string; name: string; plan: string; createdAt: string; }
export interface Agent { id: string; orgId: string; name: string; description?: string; environment: "dev"|"staging"|"prod"; framework?: string; model?: string; tags: string[]; riskTier: RiskTier; status: AgentStatus; failMode: "fail-open"|"fail-closed"; createdAt: string; }
export interface ApiKeyRecord { id: string; orgId: string; agentId: string; name: string; keyHash: string; prefix: string; scopes: string[]; expiresAt?: string|null; graceExpiresAt?: string|null; revokedAt?: string|null; lastUsedAt?: string|null; lastUsedIp?: string|null; }
export interface AgentEvent { id?: string; traceId: string; spanId?: string; parentSpanId?: string; agentId: string; workflowId?: string; sessionId?: string; userRef?: string; type: string; startedAt?: string; endedAt?: string; input?: unknown; output?: unknown; model?: string; provider?: string; tokensIn?: number; tokensOut?: number; cachedTokens?: number; costUsd?: number; latencyMs?: number; status?: string; errorCode?: string; metadata?: Record<string, unknown>; idempotencyKey?: string; }
export interface PolicyRule { id: string; action: "allow"|"deny"|"require_approval"|"rate_limit"|"spend_cap"|"content_guard"|"execute_in_sandbox"; sandbox?: { egressAllowlist?: string[]; timeoutMs?: number; memoryMb?: number; cpuMs?: number }; timeWindow?: { daysOfWeek?: number[]; startHour?: number; endHour?: number }; rateLimitPerMinute?: number; priority: number; toolGlob?: string; costThreshold?: number; environment?: string; riskTier?: RiskTier; dataSensitivity?: string; argumentPredicate?: { path: string; equals?: unknown; contains?: string }; contentPattern?: string; }
export interface Policy { id: string; orgId: string; name: string; version: number; status: "draft"|"active"|"archived"; rules: PolicyRule[]; changeNote: string; createdBy?: string; createdAt: string; }
