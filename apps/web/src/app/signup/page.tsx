"use client";
import { useState } from "react";
import { AuthShell } from "@/components/auth";

export default function Page() {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <AuthShell title="Create your account" subtitle="Start governing your agents in under 5 minutes." alt={{ label: "Already have an account? Sign in", href: "/login" }}>
      <form onSubmit={(e) => { e.preventDefault(); setNotice("Demo form — account creation is env-gated (Better Auth in production). No account is created."); }}>
        <label className="m3-label" htmlFor="signup-email">Work email</label>
        <input id="signup-email" className="m3-input" placeholder="you@company.com" type="email" autoComplete="email" required />
        <label className="m3-label" htmlFor="signup-password" style={{ marginTop: 16 }}>Password</label>
        <input id="signup-password" className="m3-input" type="password" autoComplete="new-password" required />
        <button className="m3-btn m3-btn-filled" type="submit" style={{ width: "100%", marginTop: 20 }}>Create account</button>
        <button className="m3-btn m3-btn-outlined" type="button" style={{ width: "100%", marginTop: 8 }} onClick={() => setNotice("Google SSO is env-gated — configure your IdP in production. No account is created.")}>Continue with Google (SSO)</button>
        {notice && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{notice}</p>}
      </form>
    </AuthShell>
  );
}
