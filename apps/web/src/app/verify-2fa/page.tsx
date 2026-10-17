"use client";
import { useState } from "react";
import { AuthShell } from "@/components/auth";

export default function Page() {
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <AuthShell title="Two-factor verification" subtitle="Enter the 6-digit code from your authenticator app." alt={{ label: "Can't access your authenticator? Contact support", href: "/support" }}>
      <form onSubmit={(e) => { e.preventDefault(); setNotice("Demo form — 2FA verification is env-gated (Better Auth in production). No session is created."); }}>
        <label className="m3-label" htmlFor="tfa-code">Verification code</label>
        <input id="tfa-code" className="m3-input" placeholder="000000" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
        <button className="m3-btn m3-btn-filled" type="submit" style={{ width: "100%", marginTop: 20 }}>Verify</button>
        <p className="m3-body-sm" style={{ color: "var(--m3-on-surface-variant)", marginTop: 12 }}>Codes rotate every 30 seconds. If yours expired, wait for the next one.</p>
        {notice && <p className="m3-body-md" role="status" style={{ marginTop: 12 }}>{notice}</p>}
      </form>
    </AuthShell>
  );
}
