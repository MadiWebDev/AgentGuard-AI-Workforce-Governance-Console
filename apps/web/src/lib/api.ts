import { NextResponse } from "next/server";
import { newRequestId } from "@agentguard/shared";
export function reqId(headers: Headers): string { return headers.get("x-request-id") ?? newRequestId(); }
export function ok(data: unknown, requestId: string, status = 200) { return NextResponse.json({ data, request_id: requestId }, { status }); }
export function err(code: string, message: string, requestId: string, status = 400, details: unknown = null) { return NextResponse.json({ error: { code, message, details, request_id: requestId } }, { status }); }
export function actorFromHeaders(headers: Headers): { userId: string; orgId: string; role: string; email?: string } { return { userId: headers.get("x-user-id") ?? "demo-user", orgId: headers.get("x-org-id") ?? "org_demo", role: headers.get("x-role") ?? "owner", email: headers.get("x-user-email") ?? "demo@example.com" }; }
