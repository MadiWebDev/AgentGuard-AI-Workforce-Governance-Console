import { NextResponse } from "next/server";
import { newRequestId, formatServerError, ApiError } from "@agentguard/shared";
export function reqId(headers: Headers): string { return headers.get("x-request-id") ?? newRequestId(); }
export function ok(data: unknown, requestId: string, status = 200) { return NextResponse.json({ data, request_id: requestId }, { status }); }
export function err(code: string, message: string, requestId: string, status = 400, details: unknown = null) { return NextResponse.json({ error: { code, message, details, request_id: requestId } }, { status }); }
export function actorFromHeaders(headers: Headers): { userId: string; orgId: string; role: string; email?: string } { return { userId: headers.get("x-user-id") ?? "demo-user", orgId: headers.get("x-org-id") ?? "org_demo", role: headers.get("x-role") ?? "owner", email: headers.get("x-user-email") ?? "demo@example.com" }; }

/** Production-safe 500: unknown errors become generic "Internal error" in production; ApiError passes through. */
export function serverError(requestId: string, e: unknown) {
  const isProd = process.env.NODE_ENV === "production";
  const { status, body } = formatServerError(e, isProd);
  const b = body as { error: { code: string; message: string; details: unknown; request_id: string } };
  return NextResponse.json({ error: { ...b.error, request_id: requestId } }, { status });
}
/** 429 with Retry-After header. */
export function rateLimited(requestId: string, retryAfterSec: number) {
  return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Rate limit exceeded", details: null, request_id: requestId } }, { status: 429, headers: { "Retry-After": String(Math.max(0, retryAfterSec)) } });
}
