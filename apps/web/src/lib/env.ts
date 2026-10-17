import { z } from "zod";
import { validateProductionEnv, getReadiness } from "@agentguard/shared";
const schema = z.object({ DATABASE_URL: z.string().optional(), BETTER_AUTH_SECRET: z.string().optional(), APP_URL: z.string().default("http://localhost:3000"), NODE_ENV: z.string().default("development"), STORAGE_MODE: z.string().default("local"), PADDLE_ENV: z.string().default("sandbox"), ENCRYPTION_KEY: z.string().optional(), KMS_PROVIDER: z.string().optional(), ATTESTATION_ISSUER: z.string().optional(), SAML_MODE: z.string().optional(), PUSH_MODE: z.string().optional(), SANDBOX_PROVIDER: z.string().optional(), UPSTASH_REDIS_REST_URL: z.string().optional(), UPSTASH_REDIS_REST_TOKEN: z.string().optional() });
export type Env = z.infer<typeof schema>;
export function readEnv(): Env { return schema.parse({ DATABASE_URL: process.env.DATABASE_URL, BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET, APP_URL: process.env.APP_URL, NODE_ENV: process.env.NODE_ENV, STORAGE_MODE: process.env.STORAGE_MODE, PADDLE_ENV: process.env.PADDLE_ENV, ENCRYPTION_KEY: process.env.ENCRYPTION_KEY, KMS_PROVIDER: process.env.KMS_PROVIDER, ATTESTATION_ISSUER: process.env.ATTESTATION_ISSUER, SAML_MODE: process.env.SAML_MODE, PUSH_MODE: process.env.PUSH_MODE, SANDBOX_PROVIDER: process.env.SANDBOX_PROVIDER, UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN }); }
export function getEnv(): Env { return readEnv(); }
/** Fail fast in production: throws an aggregated Error listing every blocking misconfiguration. Safe in dev/test (no-op). */
export function assertProductionEnv(env: Env = readEnv()): void {
  const v = validateProductionEnv(env);
  if (!v.ok) throw new Error(`Production env validation failed: ${v.errors.join(" ")}`);
}
export function assertProductionAdapters(): void { assertProductionEnv(); }
export function readiness(storeReachable: boolean) { return getReadiness(readEnv(), storeReachable); }
