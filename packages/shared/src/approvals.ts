
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { ApiError } from "./errors";
import { REPLAY_WINDOW_MS } from "./constants";
export interface Approval { id: string; orgId: string; agentId: string; action: string; context: Record<string, unknown>; riskTier: string; requesterId: string; status: "pending"|"approved"|"rejected"|"expired"; requiredApprovals: number; decidedBy: string[]; decisions: { approverId: string; decision: string; comment: string; at: string }[]; slaDueAt?: string; expiresAt?: string; callbackUrl?: string; callbackSecretHash?: string; createdAt: string; decidedAt?: string; }
export function requiredApprovalsFor(riskTier: string): number { return riskTier==="critical" ? 2 : 1; }
export function createApproval(input: { orgId: string; agentId: string; action: string; context: Record<string, unknown>; riskTier: string; requesterId: string; slaDueAt?: string; expiresAt?: string; callbackUrl?: string }): Approval { return { id: randomUUID(), orgId: input.orgId, agentId: input.agentId, action: input.action, context: input.context, riskTier: input.riskTier, requesterId: input.requesterId, status: "pending", requiredApprovals: requiredApprovalsFor(input.riskTier), decidedBy: [], decisions: [], slaDueAt: input.slaDueAt, expiresAt: input.expiresAt, callbackUrl: input.callbackUrl, createdAt: new Date().toISOString() }; }
export function decideApproval(approval: Approval, approverId: string, decision: "approved"|"rejected", comment: string): Approval {
  if (approverId===approval.requesterId) throw new ApiError("SELF_APPROVAL_FORBIDDEN", 403, "Requester cannot approve their own request");
  if (approval.status!=="pending") throw new ApiError("APPROVAL_NOT_PENDING", 409, `Approval is ${approval.status}`);
  if (approval.expiresAt && new Date() > new Date(approval.expiresAt)) throw new ApiError("APPROVAL_EXPIRED", 410, "Approval expired");
  if (!comment || !comment.trim()) throw new ApiError("COMMENT_REQUIRED", 400, "Comment is required");
  if (approval.decidedBy.includes(approverId)) throw new ApiError("DUPLICATE_DECISION", 409, "Approver already decided");
  const next: Approval = { ...approval, decidedBy: [...approval.decidedBy, approverId], decisions: [...approval.decisions, { approverId, decision, comment, at: new Date().toISOString() }] };
  if (decision==="rejected") { next.status="rejected"; next.decidedAt=new Date().toISOString(); return next; }
  if (next.decidedBy.length >= next.requiredApprovals) { next.status="approved"; next.decidedAt=new Date().toISOString(); }
  return next;
}
export function signCallback(payload: Record<string, unknown>, secret: string, timestamp = Date.now()): { payload: Record<string, unknown>; timestamp: number; signature: string } { const canon = JSON.stringify(payload); const sig = createHmac("sha256", secret).update(`${timestamp}.${canon}`).digest("hex"); return { payload, timestamp, signature: sig }; }
export function verifyCallback(payload: Record<string, unknown>, timestamp: number, signature: string, secret: string, now = Date.now()): boolean { if (Math.abs(now-timestamp) > REPLAY_WINDOW_MS) return false; const expected = createHmac("sha256", secret).update(`${timestamp}.${JSON.stringify(payload)}`).digest("hex"); if (expected.length!==signature.length) return false; try { return timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; } }
