"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState, SkeletonCard, Dialog } from "@/components/m3";

type Approval = { id: string; agentId: string; action: string; status: string; riskTier?: string; createdAt?: string; decisions?: { approverId: string }[] };

function SlaChip({ a }: { a: Approval }) {
  if (a.status !== "pending") return <Chip tone={a.status === "approved" ? "success" : "error"}>{a.status}</Chip>;
  return <Chip tone="warning">Pending · SLA running</Chip>;
}

export default function Page() {
  const [list, setList] = useState<Approval[] | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Approval | null>(null);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/v1/approvals").then((r) => r.json());
      setList((res.data?.approvals ?? []) as Approval[]);
    } catch { setError(true); }
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, kind: "approve" | "reject") {
    if (comment.trim() === "") { setNotice("A comment is required to decide."); return; }
    try {
      const res = await fetch(`/api/v1/approvals/${id}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
      const json = await res.json();
      setNotice(json.error ? `Decision failed: ${json.error.message}` : `Approval ${kind}d.`);
      setDetail(null); setComment(""); load();
    } catch { setNotice("Decision failed — network error."); }
  }

  async function bulk(kind: "approve" | "reject") {
    if (comment.trim() === "") { setNotice("A comment is required for bulk decisions."); return; }
    for (const id of selected) await decide(id, kind);
    setSelected(new Set());
  }

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return (
    <div>
      <PageHeader title="Approvals" description="Approval queue: SLA, routing, escalation, bulk actions, 2-person for critical."
        crumbs={[{ label: "Home", href: "/" }, { label: "Approvals" }]}
        primary={{ label: "Request approval", href: "/onboarding" }} />
      {notice && <div className="m3-card" role="status" style={{ marginBottom: 16 }}><p className="m3-body-md" style={{ margin: 0 }}>{notice}</p></div>}
      {error && <div className="m3-card" role="alert"><p className="m3-body-md" style={{ color: "var(--m3-error)", margin: 0 }}>Could not load approvals.</p></div>}
      {!error && list === null && <div style={{ display: "grid", gap: 12 }}><SkeletonCard /><SkeletonCard /></div>}
      {!error && list !== null && list.length === 0 && (
        <Card title="Queue"><EmptyState icon="✓" title="Queue is clear" guidance="No approvals yet. Agents request approval through policy/check when a rule requires it." actionLabel="Onboarding" actionHref="/onboarding" /></Card>
      )}
      {!error && list !== null && list.length > 0 && (
        <>
          {selected.size > 0 && (
            <div className="m3-card m3-elevation-2" style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <span className="m3-body-md">{selected.size} selected</span>
              <input className="m3-input" placeholder="Comment (required for bulk decisions)" value={comment} onChange={(e) => setComment(e.target.value)} style={{ maxWidth: 320 }} />
              <button type="button" className="m3-btn m3-btn-filled m3-btn-sm" onClick={() => bulk("approve")}>Bulk approve</button>
              <button type="button" className="m3-btn m3-btn-danger m3-btn-sm" onClick={() => bulk("reject")}>Bulk reject</button>
              <button type="button" className="m3-btn m3-btn-text m3-btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}
          <div className="m3-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="m3-table">
              <thead><tr><th>Select</th><th>Action</th><th>Agent</th><th>Risk</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td data-label="Select"><input type="checkbox" aria-label={`Select approval ${a.id}`} checked={selected.has(a.id)} onChange={() => toggle(a.id)} style={{ minWidth: 24, minHeight: 24 }} /></td>
                    <td data-label="Action"><Link href={`/approvals/${a.id}`}>{a.action}</Link></td>
                    <td data-label="Agent">{a.agentId}</td>
                    <td data-label="Risk"><Chip tone={a.riskTier === "critical" ? "error" : "default"}>{a.riskTier ?? "low"}</Chip></td>
                    <td data-label="Status"><SlaChip a={a} /></td>
                    <td data-label="Actions"><button type="button" className="m3-btn m3-btn-outlined m3-btn-sm" onClick={() => { setDetail(a); setComment(""); }}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail drawer */}
      <Dialog open={detail !== null} title={detail ? `Approval — ${detail.action}` : "Approval"} onClose={() => setDetail(null)}
        actions={<>
          <button type="button" className="m3-btn m3-btn-text" onClick={() => setDetail(null)}>Close</button>
          <button type="button" className="m3-btn m3-btn-danger" onClick={() => detail && decide(detail.id, "reject")}>Reject</button>
          <button type="button" className="m3-btn m3-btn-filled" onClick={() => detail && decide(detail.id, "approve")}>Approve</button>
        </>}>
        {detail && (
          <div>
            <p className="m3-body-md">Agent: <span className="mono">{detail.agentId}</span></p>
            <p className="m3-body-md">Risk tier: {detail.riskTier ?? "low"}</p>
            <p className="m3-body-md">Status: {detail.status}</p>
            <p className="m3-body-md">Two-person progress: {detail.decisions?.length ?? 0} decision(s) recorded{detail.riskTier === "critical" ? " — critical tier requires 2 approvers." : ""}</p>
            <label className="m3-label" htmlFor="approval-comment">Comment (required)</label>
            <textarea id="approval-comment" className="m3-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Why are you approving or rejecting this?" />
          </div>
        )}
      </Dialog>
    </div>
  );
}
