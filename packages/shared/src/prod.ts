
import { ApiError } from "./errors";
import { redactObject, redactText } from "./redaction";

export interface ProdEnvInput {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET?: string;
  APP_URL?: string;
  ENCRYPTION_KEY?: string;
  STORAGE_MODE?: string;
  PADDLE_ENV?: string;
  KMS_PROVIDER?: string;
  ATTESTATION_ISSUER?: string;
  SAML_MODE?: string;
  PUSH_MODE?: string;
  SANDBOX_PROVIDER?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export interface ProdValidation { ok: boolean; errors: string[]; warnings: string[]; }

/**
 * Production fail-fast validation. Pure + testable: pass an explicit env object.
 * HARD FAIL (errors) = must not boot in production with this config.
 * WARN (warnings) = degraded but bootable; fix before launch (see PRODUCTION_READINESS.md).
 */
export function validateProductionEnv(env: ProdEnvInput): ProdValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (env.NODE_ENV !== "production") return { ok: true, errors, warnings };
  const isLocalUrl = (u: string) => {
    try { const h = new URL(u).hostname.toLowerCase(); return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local"); } catch { return true; }
  };
  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required in production (MemoryStore is not a production store).");
  else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) errors.push("DATABASE_URL must be a postgres:// URL in production.");
  if (!env.BETTER_AUTH_SECRET) errors.push("BETTER_AUTH_SECRET is required in production.");
  else if (env.BETTER_AUTH_SECRET.length < 32) errors.push("BETTER_AUTH_SECRET must be at least 32 characters in production.");
  if (!env.APP_URL) errors.push("APP_URL is required in production.");
  else {
    try {
      const u = new URL(env.APP_URL);
      if (u.protocol !== "https:") errors.push("APP_URL must use https:// in production.");
      if (isLocalUrl(env.APP_URL)) errors.push("APP_URL must not be localhost in production.");
    } catch { errors.push("APP_URL is not a valid URL."); }
  }
  if (!env.ENCRYPTION_KEY) errors.push("ENCRYPTION_KEY is required in production (AES-256-GCM envelope encryption).");
  else if (env.ENCRYPTION_KEY.length < 32) errors.push("ENCRYPTION_KEY must be at least 32 characters in production.");
  if ((env.STORAGE_MODE ?? "local") === "local") errors.push("STORAGE_MODE=local is rejected in production; use r2+cloudinary.");
  const prodUrl = !!env.APP_URL && !isLocalUrl(env.APP_URL) && env.APP_URL.startsWith("https://");
  if ((env.PADDLE_ENV ?? "sandbox") === "sandbox" && prodUrl) errors.push("PADDLE_ENV=sandbox is rejected when APP_URL is a production URL; use PADDLE_ENV=production.");
  if (!env.KMS_PROVIDER || env.KMS_PROVIDER === "mock") errors.push("KMS_PROVIDER must be a real provider (aws|cloudflare) in production; mock KMS is rejected.");
  if (!env.ATTESTATION_ISSUER || env.ATTESTATION_ISSUER === "mock") errors.push("ATTESTATION_ISSUER must be a real issuer (spire) in production; mock attestation is rejected.");
  if (env.SAML_MODE === "mock") errors.push("SAML_MODE=mock is rejected in production; configure a real SAML IdP.");
  if (!env.SANDBOX_PROVIDER || env.SANDBOX_PROVIDER === "local") errors.push("SANDBOX_PROVIDER must be docker|firecracker in production; LocalSandbox is dev/test isolation, not a security boundary.");
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) warnings.push("Upstash vars missing: rate limiting falls back to in-memory (per-process). Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN before launch.");
  if (env.PUSH_MODE === "mock") warnings.push("PUSH_MODE=mock: Web Push is not live; approval notifications fall back to email.");
  return { ok: errors.length === 0, errors, warnings };
}

export interface Readiness { ready: boolean; mode: string; checks: Record<string, string>; errors: string[]; warnings: string[]; }

/** Honest readiness: production requires a passing env validation; dev reports its real mode. */
export function getReadiness(env: ProdEnvInput, storeReachable: boolean): Readiness {
  const v = validateProductionEnv(env);
  const mode = env.NODE_ENV === "production" ? "database" : (env.DATABASE_URL ? "database-dev" : "memory-dev");
  const checks: Record<string, string> = {
    env: v.ok ? "ok" : "fail",
    store: storeReachable ? "ok" : "fail",
    rateLimitBackend: env.UPSTASH_REDIS_REST_URL ? "upstash" : "in-memory",
  };
  const errors = [...v.errors];
  if (!storeReachable) errors.push("Store/DB is unreachable.");
  return { ready: errors.length === 0, mode, checks, errors, warnings: v.warnings };
}

/** Production-safe 500 formatting: ApiError (controlled) passes through; unknown errors become generic in prod. */
export function formatServerError(err: unknown, isProduction: boolean): { status: number; body: unknown } {
  if (err instanceof ApiError) return { status: err.status, body: { error: { code: err.code, message: err.message, details: err.details ?? null, request_id: err.requestId } } };
  const message = isProduction ? "Internal error" : (err instanceof Error ? err.message : "Internal error");
  return { status: 500, body: { error: { code: "INTERNAL_ERROR", message, details: null, request_id: "req_server" } } };
}

/** Safe logging: redacts PII/secrets before anything reaches logs. Never log raw values. */
export function safeLogEvent(event: unknown): string {
  try { const { redacted } = redactObject(event as Record<string, unknown>); return JSON.stringify(redacted); }
  catch { return JSON.stringify({ redacted: true }); }
}
export function safeLogMessage(text: string): string {
  return redactText(text).redacted;
}

/** In-memory token-bucket rate limiter (per-process). Production MUST set Upstash vars for a shared limiter (see RUNBOOK); this fallback is documented, never presented as distributed. */
export class RateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  constructor(private limit: number, private windowMs: number) {}
  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; resetAt: number; retryAfterSec: number } {
    const b = this.buckets.get(key);
    if (!b || now >= b.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit - 1, resetAt: now + this.windowMs, retryAfterSec: 0 };
    }
    if (b.count < this.limit) {
      b.count += 1;
      return { allowed: true, remaining: this.limit - b.count, resetAt: b.resetAt, retryAfterSec: 0 };
    }
    return { allowed: false, remaining: 0, resetAt: b.resetAt, retryAfterSec: Math.max(0, Math.ceil((b.resetAt - now) / 1000)) };
  }
  reset(key?: string): void { if (key) this.buckets.delete(key); else this.buckets.clear(); }
}
