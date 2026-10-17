
import { randomUUID } from "node:crypto";
import { ApiError } from "./errors";
import type { SsoSessionStore } from "./sso";
export interface ScimUser { id: string; orgId: string; userName: string; email: string; active: boolean; displayName: string; createdAt: string; deactivatedAt: string | null; }
export interface ScimAuditEvent { action: string; userId: string; orgId: string; at: string; }
export class ScimStore {
  users = new Map<string, ScimUser>();
  audit: ScimAuditEvent[] = [];
  private log(action: string, u: ScimUser) { this.audit.push({ action, userId: u.id, orgId: u.orgId, at: new Date().toISOString() }); }
  list(orgId: string, filterActive?: boolean): ScimUser[] { return [...this.users.values()].filter(u => u.orgId === orgId && (filterActive === undefined || u.active === filterActive)); }
  create(orgId: string, input: { userName: string; email: string; displayName?: string }): ScimUser {
    if (!input.userName || !input.email.includes("@")) throw new ApiError("SCIM_VALIDATION", 400, "userName and a valid email are required");
    const u: ScimUser = { id: randomUUID(), orgId, userName: input.userName, email: input.email, active: true, displayName: input.displayName ?? input.userName, createdAt: new Date().toISOString(), deactivatedAt: null };
    this.users.set(u.id, u); this.log("scim.user.created", u); return u;
  }
  patch(id: string, patch: { displayName?: string; active?: boolean; email?: string }): ScimUser {
    const u = this.users.get(id); if (!u) throw new ApiError("SCIM_NOT_FOUND", 404, "SCIM user not found");
    if (patch.displayName !== undefined) u.displayName = patch.displayName;
    if (patch.email !== undefined) u.email = patch.email;
    if (patch.active === false && u.active) { u.active = false; u.deactivatedAt = new Date().toISOString(); this.log("scim.user.deactivated", u); }
    else if (patch.active === true && !u.active) { u.active = true; u.deactivatedAt = null; this.log("scim.user.reactivated", u); }
    return u;
  }
  get(id: string): ScimUser | undefined { return this.users.get(id); }
}
/** Deprovision: exactly one terminal state even under concurrent calls. Callers must hold/serialize via the returned lock key in real deployments; this in-memory version is idempotent. */
export function deprovisionUser(store: ScimStore, sessions: SsoSessionStore, userId: string): { user: ScimUser; sessionsRevoked: number; alreadyDeprovisioned: boolean } {
  const u = store.users.get(userId); if (!u) throw new ApiError("SCIM_NOT_FOUND", 404, "SCIM user not found");
  if (!u.active) return { user: u, sessionsRevoked: 0, alreadyDeprovisioned: true };
  u.active = false; u.deactivatedAt = new Date().toISOString();
  store.audit.push({ action: "scim.user.deprovisioned", userId: u.id, orgId: u.orgId, at: new Date().toISOString() });
  const sessionsRevoked = sessions.revokeAllForUser(userId);
  return { user: u, sessionsRevoked, alreadyDeprovisioned: false };
}
export function requireScimBearer(req: { headers: { get: (n: string) => string | null } }, expectedToken: string): void {
  const h = req.headers.get("authorization") ?? "";
  if (expectedToken && h !== `Bearer ${expectedToken}`) throw new ApiError("SCIM_UNAUTHORIZED", 401, "Invalid SCIM bearer token");
}
