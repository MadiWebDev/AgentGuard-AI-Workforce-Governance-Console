
import type { Actor } from "./types";
import { ApiError } from "./errors";
export type Action = "agents:read"|"agents:write"|"policies:read"|"policies:write"|"approvals:read"|"approvals:decide"|"audit:read"|"audit:export"|"billing:manage"|"settings:manage"|"ingest:write"|"policy:check"|"costs:read"|"content:review"|"reports:write"|"reports:read"|"org:delete"|"keys:manage";
const PERMS: Record<string, Action[]> = {
  owner: ["agents:read","agents:write","policies:read","policies:write","approvals:read","approvals:decide","audit:read","audit:export","billing:manage","settings:manage","ingest:write","policy:check","costs:read","content:review","reports:write","reports:read","org:delete","keys:manage"],
  admin: ["agents:read","agents:write","policies:read","policies:write","approvals:read","approvals:decide","audit:read","audit:export","billing:manage","settings:manage","ingest:write","policy:check","costs:read","content:review","reports:write","reports:read","keys:manage"],
  approver: ["agents:read","policies:read","approvals:read","approvals:decide","audit:read","costs:read","reports:read","ingest:write","policy:check"],
  analyst: ["agents:read","policies:read","approvals:read","audit:read","costs:read","content:review","reports:write","reports:read","ingest:write","policy:check"],
  viewer: ["agents:read","policies:read","approvals:read","audit:read","costs:read","reports:read"],
};
export function can(actor: Actor, action: Action, resourceOrgId?: string): boolean {
  if (resourceOrgId && actor.orgId !== resourceOrgId) return false;
  return (PERMS[actor.role] ?? []).includes(action);
}
export function authorize(actor: Actor, action: Action, resource?: { orgId?: string }): void {
  if (!can(actor, action, resource?.orgId)) throw new ApiError("FORBIDDEN", 403, `Role ${actor.role} cannot perform ${action}`, { action, role: actor.role });
}
