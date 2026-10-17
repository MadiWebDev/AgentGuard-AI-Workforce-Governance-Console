import { NextResponse } from "next/server";
import { readiness } from "@/lib/env";
export async function GET() {
  const r = readiness(true);
  return NextResponse.json({ status: r.ready ? "ready" : "not_ready", ready: r.ready, mode: r.mode, checks: r.checks, errors: r.errors, warnings: r.warnings }, { status: r.ready ? 200 : 503 });
}
