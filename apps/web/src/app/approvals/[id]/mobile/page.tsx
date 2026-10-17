"use client";
import { useState } from "react";
import { PageHeader, Card, ConfirmDialog } from "@/components/m3";

export default function Page({ params }: { params: { id: string } }) {
  const [comment, setComment] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  async function submit() {
    if (comment.trim() === "") { setNotice("A comment is mandatory on mobile approval."); return; }
    try {
      const res = await fetch(`/api/v1/approvals/${params.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
      const json = await res.json();
      if (json.error) { setNotice(`Approval failed: ${json.error.message}`); return; }
      setNotice("Approved.");
    } catch {
      // Offline: queue locally, sync on reconnect (existing decision wins, never overwritten).
      try {
        const q = JSON.parse(window.localStorage.getItem("ag-offline-queue") ?? "[]") as { id: string; comment: string }[];
        q.push({ id: params.id, comment });
        window.localStorage.setItem("ag-offline-queue", JSON.stringify(q));
        setQueued(true);
        setNotice("Offline — decision queued locally. It will sync on reconnect; if already decided, the existing decision wins.");
      } catch { setNotice("Approval failed — network error and local queue unavailable."); }
    }
  }

  return (
    <div>
      <PageHeader title="Approve — mobile" description={`Approval ${params.id}. A comment is mandatory on mobile approval. Offline decisions queue locally and sync on reconnect; if already decided, the existing decision wins and is never overwritten.`}
        crumbs={[{ label: "Approvals", href: "/approvals" }, { label: params.id }, { label: "Mobile" }]} />
      {notice && <div className="m3-card" role="status" style={{ marginBottom: 16 }}><p className="m3-body-md" style={{ margin: 0 }}>{notice}</p></div>}
      {queued && <p className="m3-body-md" style={{ color: "var(--m3-warning)" }}>Queued offline — 1 decision waiting to sync.</p>}
      <Card title="Approve this request">
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }}>
          <label className="m3-label" htmlFor="mobile-comment">Comment (required)</label>
          <textarea id="mobile-comment" className="m3-textarea" required rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Why are you approving this?" />
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="m3-btn m3-btn-filled">Approve</button>
          </div>
        </form>
      </Card>
      <ConfirmDialog open={confirmOpen} title="Approve this request?"
        body="You are about to approve this request. This decision is audit-logged and cannot be overwritten by a later queued decision."
        confirmLabel="Approve" onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); submit(); }} />
    </div>
  );
}
