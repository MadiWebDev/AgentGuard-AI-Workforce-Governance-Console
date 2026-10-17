
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validateProductionEnv, getReadiness, formatServerError, safeLogEvent, safeLogMessage, RateLimiter, retentionCutoffDays, expiredEventIds, requestOrgDeletion, deletionDue, buildOrgExport, errorResponse, ApiError, getPlanLimits } from "@agentguard/shared";

const REAL_PROD = { NODE_ENV: "production", DATABASE_URL: "postgres://u:p@db:5432/ag", BETTER_AUTH_SECRET: "x".repeat(40), APP_URL: "https://app.example.com", ENCRYPTION_KEY: "y".repeat(40), STORAGE_MODE: "r2+cloudinary", PADDLE_ENV: "production", KMS_PROVIDER: "aws", ATTESTATION_ISSUER: "spire", SAML_MODE: "saml", PUSH_MODE: "webpush", SANDBOX_PROVIDER: "docker", UPSTASH_REDIS_REST_URL: "https://upstash.example.com", UPSTASH_REDIS_REST_TOKEN: "tok" };
const MOCK_PROD = { ...REAL_PROD, STORAGE_MODE: "local", KMS_PROVIDER: "mock", ATTESTATION_ISSUER: "mock", SAML_MODE: "mock", SANDBOX_PROVIDER: "local" };

describe("production env validation", () => {
  it("production + real config passes", () => { expect(validateProductionEnv(REAL_PROD).ok).toBe(true); });
  it("production + mocks fails with named errors", () => { const v = validateProductionEnv(MOCK_PROD); expect(v.ok).toBe(false); expect(v.errors.join(" ")).toMatch(/STORAGE_MODE/); expect(v.errors.join(" ")).toMatch(/KMS_PROVIDER/); expect(v.errors.join(" ")).toMatch(/ATTESTATION_ISSUER/); expect(v.errors.join(" ")).toMatch(/SAML_MODE/); expect(v.errors.join(" ")).toMatch(/SANDBOX_PROVIDER/); });
  it("production + missing DATABASE_URL / weak secret / localhost URL fails", () => {
    expect(validateProductionEnv({ ...REAL_PROD, DATABASE_URL: undefined }).ok).toBe(false);
    expect(validateProductionEnv({ ...REAL_PROD, BETTER_AUTH_SECRET: "short" }).ok).toBe(false);
    expect(validateProductionEnv({ ...REAL_PROD, APP_URL: "http://localhost:3000" }).ok).toBe(false);
    expect(validateProductionEnv({ ...REAL_PROD, APP_URL: "http://app.example.com" }).ok).toBe(false);
    expect(validateProductionEnv({ ...REAL_PROD, ENCRYPTION_KEY: "short" }).ok).toBe(false);
  });
  it("production + sandbox Paddle on a prod URL fails", () => { expect(validateProductionEnv({ ...REAL_PROD, PADDLE_ENV: "sandbox" }).ok).toBe(false); });
  it("dev/test with mocks passes (no fail-fast outside production)", () => { expect(validateProductionEnv({ ...MOCK_PROD, NODE_ENV: "development" }).ok).toBe(true); expect(validateProductionEnv({ ...MOCK_PROD, NODE_ENV: "test" }).ok).toBe(true); });
  it("missing Upstash is a warning, not a failure", () => { const v = validateProductionEnv({ ...REAL_PROD, UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined }); expect(v.ok).toBe(true); expect(v.warnings.join(" ")).toMatch(/Upstash/); });
  it("readiness: prod-invalid -> not ready; dev memory store -> ready with memory-dev mode", () => {
    expect(getReadiness(MOCK_PROD, true).ready).toBe(false);
    const dev = getReadiness({ NODE_ENV: "development" }, true);
    expect(dev.ready).toBe(true); expect(dev.mode).toBe("memory-dev");
    expect(getReadiness(REAL_PROD, false).ready).toBe(false);
  });
});

describe("production error formatting", () => {
  it("unknown 500s become generic in production, verbose in dev", () => {
    const prod = formatServerError(new Error("connect ECONNREFUSED secret-host:5432"), true);
    expect(prod.status).toBe(500);
    expect(JSON.stringify(prod.body)).not.toContain("ECONNREFUSED");
    expect(JSON.stringify(prod.body)).toContain("Internal error");
    const dev = formatServerError(new Error("connect ECONNREFUSED"), false);
    expect(JSON.stringify(dev.body)).toContain("ECONNREFUSED");
  });
  it("ApiError passes through with its controlled code", () => {
    const r = formatServerError(new ApiError("NOT_FOUND", 404, "Agent not found"), true);
    expect(r.status).toBe(404); expect(JSON.stringify(r.body)).toContain("Agent not found");
  });
  it("errorResponse strips 500 message in production", () => {
    const r = errorResponse(new Error("db password hunter2 leaked"), "req_1", true);
    expect(JSON.stringify(r.body)).not.toContain("hunter2");
  });
});

describe("safe logging", () => {
  it("redacts PII and secrets from log output", () => {
    const out = safeLogEvent({ msg: "contact alice@example.com", key: "sk_live_abcdef1234567890", nested: { phone: "415-555-0132" } });
    expect(out).not.toContain("alice@example.com"); expect(out).not.toContain("415-555-0132"); expect(out).not.toContain("sk_live_abcdef1234567890");
    expect(safeLogMessage("call alice@example.com now")).not.toContain("alice@example.com");
  });
});

describe("rate limiter", () => {
  it("allows N then blocks with retry-after, then refills after window", () => {
    const rl = new RateLimiter(2, 1000);
    expect(rl.check("k", 0).allowed).toBe(true);
    expect(rl.check("k", 1).allowed).toBe(true);
    const blocked = rl.check("k", 2);
    expect(blocked.allowed).toBe(false); expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rl.check("k", 1001).allowed).toBe(true);
    expect(rl.check("other", 2).allowed).toBe(true);
  });
});

describe("data lifecycle", () => {
  it("retention cutoff + expired ids per plan", () => {
    const plan = getPlanLimits("Free");
    expect(retentionCutoffDays(plan)).toBe(7);
    const now = new Date("2026-10-17T00:00:00Z");
    const ids = expiredEventIds([{ id: "old", createdAt: "2026-10-01T00:00:00Z" }, { id: "new", createdAt: "2026-10-16T00:00:00Z" }], plan, now);
    expect(ids).toEqual(["old"]);
  });
  it("org deletion has a 30-day grace period", () => {
    const req = requestOrgDeletion("org1", new Date("2026-10-17T00:00:00Z"));
    expect(req.status).toBe("pending_grace"); expect(req.graceEndsAt).toBe("2026-11-16T00:00:00.000Z");
    expect(deletionDue(req, new Date("2026-10-20T00:00:00Z"))).toBe(false);
    expect(deletionDue(req, new Date("2026-11-17T00:00:00Z"))).toBe(true);
  });
  it("GDPR export shape carries counts and a redaction note, no raw PII", () => {
    const ex = buildOrgExport("org1", { agents: 1, events: 2, approvals: 0, auditRows: 3 }, [{ redacted: true }]);
    expect(ex.counts.events).toBe(2); expect(ex.note).toMatch(/PII-redacted/);
  });
});

describe("security headers config", () => {
  it("next.config declares CSP, HSTS (prod), Permissions-Policy, nosniff, referrer, frame deny", () => {
    const cfg = readFileSync("apps/web/next.config.mjs", "utf8");
    for (const h of ["Content-Security-Policy", "Strict-Transport-Security", "Permissions-Policy", "X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "frame-ancestors", "output"]) expect(cfg).toContain(h);
  });
});
