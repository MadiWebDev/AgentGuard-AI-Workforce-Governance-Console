import { MockOnCall, generateBadgeKeyPair, FakeDbClient, PostgresSink, type AuditSchedule, type Brand } from "@agentguard/shared";

/** v1.3 in-memory server state (dev/test). Production deployments persist these in Postgres via the Drizzle schema. */
export const v13 = {
  brands: new Map<string, Brand>(),
  schedules: [] as AuditSchedule[],
  oncall: new MockOnCall(),
  badgeKeys: generateBadgeKeyPair(),
  revokedOrgs: new Set<string>(),
  warehouseDb: new FakeDbClient(),
};
export const warehouseSink = new PostgresSink(v13.warehouseDb);
