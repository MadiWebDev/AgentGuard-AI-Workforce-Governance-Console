
import { ScimStore, SsoSessionStore, SiemDeliveryLog, RunbookHistory, PushStore, OfflineQueue, type DecisionRecord, type SiemEndpoint } from "@agentguard/shared";
export const scimStore = new ScimStore();
export const ssoSessions = new SsoSessionStore();
export const siemLog = new SiemDeliveryLog();
export const siemEndpoints = new Map<string, SiemEndpoint>();
export const runbookHistory = new RunbookHistory();
export const pushStore = new PushStore();
export const offlineQueue = new OfflineQueue();
export const decisions = new Map<string, DecisionRecord>();
export const agentStatus = new Map<string, string>();
export const revokedKeys = new Set<string>();
