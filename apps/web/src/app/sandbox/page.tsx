"use client";
import { useState } from "react";
import { PageHeader, Card, ConfirmDialog, Chip } from "@/components/m3";

export default function Page() {
  const [command, setCommand] = useState("echo");
  const [args, setArgs] = useState("hello from sandbox");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function execute() {
    setConfirmOpen(false);
    setBusy(true); setResult(null);
    try {
      const res = await fetch("/api/v1/sandbox/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, args: args.split(" ").filter(Boolean), timeoutMs: 5000 }),
      });
      const json = await res.json();
      setResult(json.error ? `Execution failed: ${json.error.message}` : JSON.stringify(json.data ?? json, null, 2));
    } catch { setResult("Execution failed — is the server running?"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Sandboxed Tool Execution" description="Policy action execute_in_sandbox routes matching tool calls into an isolated sandbox: argv allowlist, egress allowlist enforced before execution, timeout kill, full stdin/stdout/stderr captured as evidence. Docker/Firecracker providers are configured via SANDBOX_PROVIDER; see RUNBOOK."
        crumbs={[{ label: "Home", href: "/" }, { label: "Sandbox" }]} />
      <Card title="Run in sandbox" subtitle="Commands run under the sandbox provider (LocalSandbox in dev/test — not a security boundary).">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div><label className="m3-label" htmlFor="sb-cmd">Command (allowlisted)</label><input id="sb-cmd" className="m3-input" value={command} onChange={(e) => setCommand(e.target.value)} /></div>
          <div><label className="m3-label" htmlFor="sb-args">Args (space-separated)</label><input id="sb-args" className="m3-input" value={args} onChange={(e) => setArgs(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button type="button" className="m3-btn m3-btn-filled" onClick={() => setConfirmOpen(true)} disabled={busy}>{busy ? "Running…" : "Execute"}</button>
          <Chip>Timeout kill · egress pre-check</Chip>
        </div>
        {result && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{result}</pre>}
      </Card>
      <ConfirmDialog open={confirmOpen} title="Execute in sandbox?"
        body={`Run "${command} ${args}" inside the sandbox? Output is captured as evidence.`}
        confirmLabel="Execute" onCancel={() => setConfirmOpen(false)} onConfirm={execute} />
    </div>
  );
}
