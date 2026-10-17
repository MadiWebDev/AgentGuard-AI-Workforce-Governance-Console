"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Chip, EmptyState } from "@/components/m3";

type Approval = { id: string; agentId: string; action: string; status: string; riskTier?: string; context?: Record<string, unknown>; decisions?: { approverId: string; decision: string; comment: string }[] };

export default function Page({ params }: { params: { id: string } }) {
  const [approval, setApproval] = useState<Approval | null | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/approvals").then((r) => r.json());
        const found = (res.data?.approvals ?? []).find((a: Approval) => a.id === params.id) as Approval | undefined;
        setApproval(found ?? null);
      } catch { setApproval(null); }
    })();
  }, [params.id]);

  async function decide(kind: "approve" | "reject") {
    if (comment.trim() === "") { setNotice("A comment is required to decide."); return; }
    try {
      const res = await fetch(`/api/v1/approvals/${params.id}/${kind}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
      const json = await res.json();
      if (json.error) { setNotice(`Decision failed: ${json.error.message}`); return; }
      setApproval(json.data?.approval as Approval);
      setNotice(`Approval ${kind}d.`);
    } catch { setNotice("Decision failed — network error."); }
  }

  return (
    <div>
      <PageHeader title="Approval Detail" description="Full context, approve/reject with mandatory comment."
        crumbs={[{ label: "Approvals", href: "/approvals" }, { label: params.id }]}
        primary={{ label: "All approvals", href: "/approvals" }} />
      {notice && <div className="m3-card" role="status" style={{ marginBottom: 16 }}><p className="m3-body-md" style={{ margin: 0 }}>{notice}</p></div>}
      {approval === undefined && <p className="m3-body-md">Loading…</p>}
      {approval === null && <Card title="Approval"><EmptyState icon="🔍" title="Approval not found" guidance={`No approval with id ${params.id} exists in this org.`} actionLabel="Back to queue" actionHref="/approvals" /></Card>}
      {approval && (
        <Card title={`${approval.action} — ${approval.agentId}`}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Chip tone={approval.status === "approved" ? "success" : approval.status === "rejected" ? "error" : "warning"}>{approval.status}</Chip>
            <Chip>{approval.riskTier ?? "low"} risk</Chip>
          </div>
          {approval.riskTier === "critical" && <p className="m3-body-md" style={{ marginTop: 12 }}>Two-person progress: {approval.decisions?.length ?? 0} of 2 approvers have decided.</p>}
          {approval.context && <pre className="m3-card" style={{ marginTop: 12, overflowX: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(approval.context, null, 2)}</pre>}
          {approval.decisions && approval.decisions.length > 0 && (
            <ul className="m3-body-md" style={{ marginTop: 12 }}>{approval.decisions.map((d, i) => (<li key={i}>{d.approverId}: {d.decision} — {d.comment}</li>))}</ul>
          )}
          <div style={{ marginTop: 16 }}>
            <label className="m3-label" htmlFor="detail-comment">Comment (required)</label>
            <textarea id="detail-comment" className="m3-textarea" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Why are you approving or rejecting this?" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <button type="button" className="m3-btn m3-btn-filled" onClick={() => decide("approve")}>Approve</button>
              <button type="button" className="m3-btn m3-btn-danger" onClick={() => decide("reject")}>Reject</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
