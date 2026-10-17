"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth";

export default function Page() {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your AgentGuard org." alt={{ label: "No account? Sign up", href: "/signup" }}>
      <form onSubmit={(e) => { e.preventDefault(); setNotice("Demo form — auth is env-gated (Better Auth + org plugin in production). No session is created."); }}>
        <label className="m3-label" htmlFor="login-email">Email</label>
        <input id="login-email" className="m3-input" placeholder="you@company.com" type="email" autoComplete="email" required />
        <label className="m3-label" htmlFor="login-password" style={{ marginTop: 16 }}>Password</label>
        <input id="login-password" className="m3-input" type="password" autoComplete="current-password" required />
        <button className="m3-btn m3-btn-filled" type="submit" style={{ width: "100%", marginTop: 20 }}>Continue</button>
        <button className="m3-btn m3-btn-outlined" type="button" style={{ width: "100%", marginTop: 8 }} onClick={() => setNotice("Google SSO is env-gated — configure your IdP in production. No session is created.")}>Continue with Google (SSO)</button>
        <Link className="m3-btn m3-btn-text" style={{ width: "100%", marginTop: 8 }} href="/magic-link">Use a magic link instead</Link>
        {notice && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{notice}</p>}
      </form>
    </AuthShell>
  );
}
