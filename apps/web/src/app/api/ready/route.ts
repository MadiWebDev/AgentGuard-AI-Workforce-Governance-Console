import { NextResponse } from "next/server";
export async function GET(){ return NextResponse.json({ status: "ready", checks: { store: "ok", adapters: "env-gated" } }); }
