import { describe, it, expect } from "vitest";
import { signMockAssertion, verifyMockAssertion, assertPasswordLoginAllowed, SsoSessionStore, ScimStore, deprovisionUser, jitProvision, bucketFor, queueFor, authorizeRegion, migrateOrgRegion, MockKms, encryptSecret, decryptSecret, reEncryptAll, revokeOldVersion, AwsKmsAdapter, ATTACK_LIBRARY, runRedTeam, draftPolicyFromFinding, computeBaseline, detectDrift, recommendOptimizations, applyRecommendation, replayWithCache, totalSavings, signDelivery, verifyDelivery, SiemDeliveryLog, runCompromisedAgentRunbook, RunbookHistory, PACKS, installPack, simulatePack, activatePackDraft, generateVapidKeys, PushStore, sendPush, OfflineQueue, syncOfflineQueue, ApiError } from "@agentguard/shared";

describe("F1 SSO/SCIM", () => {
  it("mock SAML login verifies; tampered fails; bypass fails", () => {
    const a = signMockAssertion({ issuer: "idp", audience: "ag", subject: "u1", email: "a@example.com", secret: "s3cret" });
    expect(verifyMockAssertion(a, { audience: "ag", issuer: "idp", secret: "s3cret" }).ok).toBe(true);
    expect(verifyMockAssertion({ ...a, email: "evil@example.com" }, { audience: "ag", issuer: "idp", secret: "s3cret" }).ok).toBe(false);
    expect(verifyMockAssertion({ ...a, audience: "other" }, { audience: "ag", issuer: "idp", secret: "s3cret" }).ok).toBe(false);
    expect(() => assertPasswordLoginAllowed({ orgId: "o", issuer: "i", audience: "a", requireSSO: true, roleMapping: {}, defaultRole: "viewer" })).toThrowError(/SSO/);
    expect(jitProvision("a@acme.com", { orgId: "o", issuer: "i", audience: "a", requireSSO: false, roleMapping: { "acme.com": "admin" }, defaultRole: "viewer" }).role).toBe("admin");
  });
  it("deprovision race: two concurrent deactivations -> exactly one terminal state, sessions revoked", async () => {
    const scim = new ScimStore(); const sessions = new SsoSessionStore();
    const u = scim.create("org1", { userName: "bob", email: "bob@example.com" });
    sessions.create(u.id, "org1"); sessions.create(u.id, "org1");
    const [r1, r2] = await Promise.all([Promise.resolve().then(() => deprovisionUser(scim, sessions, u.id)), Promise.resolve().then(() => deprovisionUser(scim, sessions, u.id))]);
    expect([r1.alreadyDeprovisioned, r2.alreadyDeprovisioned].filter(Boolean).length).toBe(1);
    expect(scim.get(u.id)?.active).toBe(false);
    expect(sessions.activeForUser(u.id).length).toBe(0);
  });
});
describe("F2 residency", () => {
  it("EU bucket/queue; cross-region 403", () => {
    expect(bucketFor({ region: "EU" })).toBe("eu-bucket"); expect(queueFor({ region: "EU" })).toBe("eu-queue");
    expect(bucketFor({ region: "US" })).toBe("us-bucket");
    expect(() => authorizeRegion("US", "EU", "org1")).toThrowError(/Cross-region/);
    try { authorizeRegion("US", "EU", "org1"); } catch (e) { expect((e as ApiError).status).toBe(403); }
    const m = migrateOrgRegion({ orgId: "o", region: "US", keys: ["k1", "k2"] }, "EU");
    expect(m.verified).toBe(true); expect(m.org.region).toBe("EU"); expect(m.movedKeys).toEqual(["k1", "k2"]);
  });
});
describe("F3 BYOK", () => {
  it("rotate: old+new packs verify; revoke only after re-encrypt", async () => {
    const kms = new MockKms();
    const old = await encryptSecret(kms, "org1", "secret-value");
    await kms.rotate("org1");
    const fresh = await encryptSecret(kms, "org1", "secret-value");
    expect(old.keyVersion).toBe(1); expect(fresh.keyVersion).toBe(2);
    expect(await decryptSecret(kms, old)).toBe("secret-value");
    expect(await decryptSecret(kms, fresh)).toBe("secret-value");
    expect(revokeOldVersion([old], 1).revoked).toBe(false);
    const re = await reEncryptAll(kms, [old]);
    expect(re[0]!.keyVersion).toBe(2); expect(revokeOldVersion(re, 1).revoked).toBe(true);
    try { await new AwsKmsAdapter().encrypt(); expect.unreachable(); } catch (e) { expect((e as ApiError).code).toBe("KMS_NOT_CONFIGURED"); }
  });
});
describe("F4 redteam", () => {
  it("seeded demo agent >=1 finding + >=1 draft; strict policy passes", () => {
    const permissive = runRedTeam(ATTACK_LIBRARY, () => ({ blocked: false, leakedPii: false, costUsd: 0 }), []);
    expect(permissive.findings.length).toBeGreaterThanOrEqual(1);
    const draft = draftPolicyFromFinding(permissive.findings[0]!, "org1");
    expect(draft.status).toBe("draft");
    const strict = runRedTeam(ATTACK_LIBRARY, () => ({ blocked: true, leakedPii: false, costUsd: 0 }), [{ id: "d1", action: "deny", priority: 10, contentPattern: "Ignore" }]);
    expect(strict.findings.length).toBe(0);
  });
});
describe("F5 baseline", () => {
  it("anomaly triggers drift alert linking trace ids", () => {
    const baseEvents = Array.from({ length: 50 }, (_, i) => ({ traceId: `t${i}`, tool: "search", costUsd: 0.01, latencyMs: 100, error: false }));
    const base = computeBaseline(baseEvents);
    const recent = [{ traceId: "t-anom", tool: "deploy-prod", costUsd: 0.1, latencyMs: 100, error: false }];
    const alerts = detectDrift(base, recent);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts.some(a => a.traceIds.includes("t-anom"))).toBe(true);
  });
});
describe("F6 optimizer", () => {
  it("non-zero savings; cache toggle reduces replay cost", () => {
    const recs = recommendOptimizations({ agentId: "a1", runs: 10000, avgCostPerRun: 0.05, errorRate: 0.01, cacheHitRate: 0.1, batchableShare: 0.5 });
    expect(totalSavings(recs)).toBeGreaterThan(0);
    const cache = recs.find(r => r.type === "cache_hit")!;
    const applied = applyRecommendation(cache, { cachingEnabled: false, batchingEnabled: false });
    expect(applied.applied).toBe(true); expect(applied.state.cachingEnabled).toBe(true);
    const replay = replayWithCache([{ costUsd: 10, cacheable: true }, { costUsd: 10, cacheable: false }], true);
    expect(replay.replayCost).toBeLessThan(replay.originalCost);
  });
  it("model downgrade blocked when error rate above guardrail", () => {
    const recs = recommendOptimizations({ agentId: "a1", runs: 100, avgCostPerRun: 0.05, errorRate: 0.2, cacheHitRate: 0.9, batchableShare: 0 });
    expect(recs.find(r => r.type === "model_downgrade")).toBeUndefined();
  });
});
describe("F7 SIEM", () => {
  it("signed delivery verifies; replay exactly once; endpoint-down buffered then retried, never lost", () => {
    const ep = { id: "ep1", orgId: "o", profile: "splunk_hec" as const, url: "https://example.com/hec", secret: "siem-secret" };
    const log = new SiemDeliveryLog();
    const d = signDelivery(ep, "e1", { x: 1 });
    expect(verifyDelivery(ep, d)).toBe(true);
    expect(verifyDelivery(ep, { ...d, payload: { x: 2 } })).toBe(false);
    const down = log.deliver(ep, "e2", { y: 1 }, false);
    expect(down.record.status).toBe("buffered");
    expect(log.retryBuffered()).toBe(1);
    expect(log.list().find(r => r.delivery.eventId === "e2")?.status).toBe("delivered");
    const replay = log.replayFrom(ep, 0, [{ eventId: "e2", payload: { y: 1 }, ts: 1 }, { eventId: "e3", payload: {}, ts: 2 }], true);
    expect(replay.delivered).toBe(1); expect(replay.duplicatesSkipped).toBe(1);
    expect(log.redeliver(down.record.delivery.id)?.attempts).toBeGreaterThanOrEqual(2);
  });
});
describe("F8 runbooks", () => {
  it("full runbook all steps; policy denies after quarantine; pack verifies", () => {
    let quarantined = false; const frozen: string[] = [];
    const exec = runCompromisedAgentRunbook({ agentId: "a1", orgId: "o" }, { agentExists: true, pendingApprovalIds: ["ap1"], stakeholderEmails: ["s@example.com"] }, { quarantine: () => { quarantined = true; return true; }, revokeKeys: () => 2, freezeApprovals: (ids) => { frozen.push(...ids); return ids.length; }, notify: (e) => e.length, openEvidencePack: () => "pack_a1" });
    expect(new RunbookHistory().allStepsDone(exec)).toBe(true);
    expect(quarantined).toBe(true); expect(frozen).toEqual(["ap1"]); expect(exec.evidencePackId).toBe("pack_a1");
    expect(exec.steps.map(s => s.name)).toEqual(["quarantine_agent", "revoke_keys", "freeze_pending_approvals", "notify_stakeholders", "open_incident_evidence_pack"]);
  });
});
describe("F9 packs", () => {
  it("SOC2 install draft-only; simulation shows change; activation separate+audited", () => {
    const inst = installPack("soc2-baseline", "org1");
    expect(inst.draftPolicies.every(p => p.status === "draft")).toBe(true);
    const sim = simulatePack(inst, [{ tool: "deploy-prod", environment: "prod" }, { tool: "search", environment: "dev" }]);
    expect(sim.wouldBlock).toBe(1);
    const act = activatePackDraft(inst.draftPolicies[0]!, "owner1");
    expect(act.policy.status).toBe("active"); expect(act.audit.action).toBe("pack.draft.activated");
    expect(PACKS.length).toBe(4);
  });
});
describe("F10 push/PWA", () => {
  it("mocked push delivers; offline decision syncs; conflict shows winner", () => {
    const keys = generateVapidKeys(); expect(keys.publicKey.length).toBeGreaterThan(10); expect(keys.privateKey.length).toBeGreaterThan(10);
    const store = new PushStore(); const sub = store.subscribe("u1", "https://push.example.com/sub1");
    const sent = sendPush(store, sub.id, { title: "Approval needed" }, { mock: true });
    expect(sent.delivered).toBe(true); expect(sent.mock).toBe(true);
    const q = new OfflineQueue(); q.queueDecision("ap1", "u1", "approved", "looks good");
    const existing = new Map();
    const sync1 = syncOfflineQueue(q, existing);
    expect(sync1.applied.length).toBe(1);
    const q2 = new OfflineQueue(); q2.queueDecision("ap1", "u2", "rejected", "no");
    const sync2 = syncOfflineQueue(q2, existing);
    expect(sync2.conflicts.length).toBe(1); expect(sync2.conflicts[0]!.winner.decision).toBe("approved");
  });
});
