"use client";
import { useState } from "react";
import { AuthShell } from "@/components/auth";

export default function Page() {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <AuthShell title="Magic link sign-in" subtitle="We'll email you a one-time sign-in link." alt={{ label: "Prefer a password? Sign in", href: "/login" }}>
      <form onSubmit={(e) => { e.preventDefault(); setNotice("Demo form — magic-link delivery is env-gated (Resend in production). No email is sent."); }}>
        <label className="m3-label" htmlFor="magic-email">Email</label>
        <input id="magic-email" className="m3-input" placeholder="you@company.com" type="email" autoComplete="email" required />
        <button className="m3-btn m3-btn-filled" type="submit" style={{ width: "100%", marginTop: 20 }}>Send magic link</button>
        <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 12 }}>The link expires after first use. Check spam if it does not arrive.</p>
        {notice && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{notice}</p>}
      </form>
    </AuthShell>
  );
}
