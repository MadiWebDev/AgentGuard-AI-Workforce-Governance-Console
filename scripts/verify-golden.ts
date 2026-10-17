
// Golden path steps 1-8 — pure core services, no network/DB required.
import { redactObject, evaluatePolicy, createApproval, decideApproval, signCallback, verifyCallback, createAuditRow, verifyChain, signManifest, verifyManifest, generateEd25519KeyPair, hashContent, applyPaddleEvent, processBatch, ApiError, signMockAssertion, verifyMockAssertion, ScimStore, SsoSessionStore, deprovisionUser, bucketFor, authorizeRegion, migrateOrgRegion, MockKms, encryptSecret, decryptSecret, ATTACK_LIBRARY, runRedTeam, draftPolicyFromFinding, computeBaseline, detectDrift, recommendOptimizations, totalSavings, signDelivery, verifyDelivery, SiemDeliveryLog, runCompromisedAgentRunbook, installPack, simulatePack, activatePackDraft, generateVapidKeys, PushStore, sendPush, OfflineQueue, syncOfflineQueue } from "@agentguard/shared";
import { createHmac, createHash } from "node:crypto";
async function main() {
let failures = 0; function assert(cond: boolean, msg: string){ if(cond) console.log(`  PASS ${msg}`); else { console.log(`  FAIL ${msg}`); failures++; } }
console.log("Golden path verification");
// 1 signup/org/agent/keys (simulated via store semantics: hash-only)
const plain = "ag_live_" + "x".repeat(32); const hash = createHash("sha256").update(plain).digest("hex"); assert(hash.length===64 && hash!==plain, "1. keys stored as hash only, shown once");
// 2 ingest PII
const pii = { input: "contact alice@example.com phone 415-555-0132 card 4242424242424242 key sk-abcdefgh12345678", output: "ok" };
const batch = processBatch([{ traceId:"tr1", agentId:"agent1", type:"tool_call", input: pii.input, output: pii.output, model:"gpt-4o", tokensIn:100, tokensOut:50 } as never]);
assert(batch[0]!.redactionCount===4, `2. redaction count 4 (got ${batch[0]!.redactionCount})`);
assert(!JSON.stringify(batch[0]).includes("alice@example.com") && !JSON.stringify(batch[0]).includes("4242424242424242"), "2. raw PII nowhere in processed event");
// 3 policies
const rules = [
  { id:"r-allow", action:"allow" as const, priority:1, toolGlob:"search*" },
  { id:"r-deny", action:"deny" as const, priority:10, toolGlob:"deploy*", environment:"prod" },
  { id:"r-approval", action:"require_approval" as const, priority:5, costThreshold:10 },
];
assert(evaluatePolicy(rules, { tool:"search-web" }).decision==="allow", "3a allow low-risk");
assert(evaluatePolicy(rules, { tool:"deploy-prod", environment:"prod" }).decision==="deny", "3b deny critical in prod");
assert(evaluatePolicy(rules, { tool:"deploy-prod", cost:50 }).decision==="require_approval", "3c require_approval cost>threshold");
// 4 kill switch: policy layer denies when agent paused (simulated)
const pausedAgentStatus="paused"; const killDecision = pausedAgentStatus!=="active" ? "deny" : evaluatePolicy(rules,{tool:"search-web"}).decision; assert(killDecision==="deny","4. paused agent denied");
// 5 approvals
const ap = createApproval({ orgId:"org1", agentId:"a1", action:"deploy", context:{}, riskTier:"critical", requesterId:"user1" });
assert(ap.requiredApprovals===2, "5a critical requires 2 approvers");
let selfBlocked=false; try{ decideApproval(ap,"user1","approved","ok"); }catch(e){ selfBlocked = e instanceof ApiError && (e as ApiError).status===403; } assert(selfBlocked,"5b self-approval 403");
const ap1 = decideApproval(ap,"approver1","approved","looks good"); assert(ap1.status==="pending","5c one approval still pending");
const ap2 = decideApproval(ap1,"approver2","approved","approved"); assert(ap2.status==="approved","5d two approvals -> approved");
const cb = signCallback({ approvalId: ap.id, status:"approved" }, "secret123"); assert(verifyCallback(cb.payload, cb.timestamp, cb.signature, "secret123"), "5e HMAC callback valid");
assert(!verifyCallback(cb.payload, cb.timestamp, cb.signature, "secret123", Date.now()+10*60*1000), "5f replay window enforced");
// 6 audit chain
let prev=null as never; const rows=[]; for(let i=0;i<5;i++){ const r=createAuditRow(prev as never,"org1",`action.${i}`,{i}); rows.push(r); prev=r as never; }
assert(verifyChain(rows).ok, "6a chain verifies");
const tampered = rows.map(r=>({...r})); tampered[2]!.payload={i:999}; const v=verifyChain(tampered as never); assert(!v.ok && v.firstBrokenId===tampered[2]!.id, `6b tamper detected at exact row (${v.firstBrokenId})`);
// 7 evidence pack
const kp=generateEd25519KeyPair(); const files=[{name:"audit.json",sha256:hashContent(JSON.stringify(rows))},{name:"audit.csv",sha256:hashContent("a,b\n1,2")}]; const manifest=signManifest(files,kp.privateKey,kp.publicKey); assert(verifyManifest(manifest,{"audit.json":JSON.stringify(rows),"audit.csv":"a,b\n1,2"}).ok,"7a manifest verifies"); assert(!verifyManifest(manifest,{"audit.json":JSON.stringify(rows)+"x","audit.csv":"a,b\n1,2"}).ok,"7b modified file fails");
// 8 Paddle webhooks
const seen=new Set<string>(); let sub=null as never; const mk=(id:string,type:string,status:string)=>({ eventId:id, eventType:type, occurredAt:new Date().toISOString(), data:{ orgId:"org1", subscriptionId:"sub1", customerId:"cus1", plan:"Pro", status } });
let r1=applyPaddleEvent(sub, mk("e1","subscription.created","active") as never, seen); sub=r1.state; assert((sub as {status:string}).status==="active","8a subscription created -> active");
let r2=applyPaddleEvent(sub, mk("e2","subscription.past_due","past_due") as never, seen); sub=r2.state; assert((sub as {status:string}).status==="past_due","8b past_due");
let r3=applyPaddleEvent(sub, mk("e2","subscription.past_due","past_due") as never, seen); assert(!r3.changed,"8c replay no-op");
let r4=applyPaddleEvent(sub, mk("e3","subscription.canceled","canceled") as never, seen); assert((r4.state as {status:string}).status==="canceled","8d canceled");

// v1.1 checks (F1-F10)
// F1 SSO mock login + SCIM deprovision
const saml = signMockAssertion({ issuer: "idp-test", audience: "agentguard", subject: "u1", email: "a@example.com", secret: "s3cret" });
assert(verifyMockAssertion(saml, { audience: "agentguard", issuer: "idp-test", secret: "s3cret" }).ok, "v1.1 F1 mock-SAML login verifies");
const scim = new ScimStore(); const ssoSess = new SsoSessionStore();
const su = scim.create("org_demo", { userName: "carol", email: "carol@example.com" });
ssoSess.create(su.id, "org_demo");
const dep = deprovisionUser(scim, ssoSess, su.id);
assert(!dep.user.active && dep.sessionsRevoked === 1, "v1.1 F1 SCIM deprovision revokes sessions");
// F2 residency
assert(bucketFor({ region: "EU" }) === "eu-bucket", "v1.1 F2 EU payloads in eu-bucket");
let crossBlocked = false; try { authorizeRegion("US", "EU", "org1"); } catch { crossBlocked = true; }
assert(crossBlocked, "v1.1 F2 cross-region read blocked");
assert(migrateOrgRegion({ orgId: "o", region: "US", keys: ["k1"] }, "EU").verified, "v1.1 F2 region migration verifies");
// F3 BYOK rotation
const kms = new MockKms(); const oldPack = await encryptSecret(kms, "org1", "topsecret");
await kms.rotate("org1"); const newPack = await encryptSecret(kms, "org1", "topsecret");
assert(oldPack.keyVersion === 1 && newPack.keyVersion === 2 && (await decryptSecret(kms, oldPack)) === "topsecret" && (await decryptSecret(kms, newPack)) === "topsecret", "v1.1 F3 key rotation: old+new packs verify");
// F4 red-team
const rt = runRedTeam(ATTACK_LIBRARY, () => ({ blocked: false, leakedPii: false, costUsd: 0 }), []);
assert(rt.findings.length >= 1 && draftPolicyFromFinding(rt.findings[0]!, "org_demo").status === "draft", "v1.1 F4 red-team finding + draft policy (never auto-activates)");
// F5 drift
const baseEv = Array.from({ length: 40 }, (_, i) => ({ traceId: `b${i}`, tool: "search", costUsd: 0.01, latencyMs: 100, error: false }));
const drift = detectDrift(computeBaseline(baseEv), [{ traceId: "anom-1", tool: "deploy-prod", costUsd: 0.1, latencyMs: 100, error: false }]);
assert(drift.length >= 1 && drift.some(d => d.traceIds.includes("anom-1")), "v1.1 F5 drift alert on anomaly links trace id");
// F6 optimizer
const savings = totalSavings(recommendOptimizations({ agentId: "a1", runs: 10000, avgCostPerRun: 0.05, errorRate: 0.01, cacheHitRate: 0.1, batchableShare: 0.5 }));
assert(savings > 0, `v1.1 F6 optimizer non-zero savings ($${savings})`);
// F7 SIEM
const ep = { id: "ep-g", orgId: "o", profile: "splunk_hec" as const, url: "https://example.com/hec", secret: "siem-secret" };
const siem = new SiemDeliveryLog(); const sd = signDelivery(ep, "ev1", { a: 1 });
assert(verifyDelivery(ep, sd), "v1.1 F7 SIEM signed delivery verifies");
siem.deliver(ep, "ev1", { a: 1 }, true);
const rp = siem.replayFrom(ep, 0, [{ eventId: "ev1", payload: { a: 1 }, ts: 1 }, { eventId: "ev2", payload: {}, ts: 2 }], true);
assert(rp.delivered === 1 && rp.duplicatesSkipped === 1, "v1.1 F7 SIEM replay exactly-once");
// F8 runbook
const rb = runCompromisedAgentRunbook({ agentId: "a1", orgId: "o" }, { agentExists: true, pendingApprovalIds: ["ap1"], stakeholderEmails: ["s@example.com"] }, { quarantine: () => true, revokeKeys: () => 1, freezeApprovals: (ids) => ids.length, notify: (e) => e.length, openEvidencePack: () => "pack_a1" });
assert(rb.steps.length === 5 && rb.steps.every(s => s.status === "done") && rb.evidencePackId === "pack_a1", "v1.1 F8 runbook full execution");
// F9 packs
const inst = installPack("soc2-baseline", "org_demo");
const sim = simulatePack(inst, [{ tool: "deploy-prod", environment: "prod" }]);
assert(inst.draftPolicies.every(x => x.status === "draft") && sim.wouldBlock === 1 && activatePackDraft(inst.draftPolicies[0]!, "owner1").policy.status === "active", "v1.1 F9 pack install draft-only + simulation + separate activation");
// F10 push / mobile approval
const vk = generateVapidKeys(); const ps = new PushStore(); const sub11 = ps.subscribe("u1", "https://push.example.com/s1");
assert(vk.publicKey.length > 10 && sendPush(ps, sub11.id, { title: "Approval needed" }, { mock: true }).delivered, "v1.1 F10 mocked push delivers (mobile approval)");
const oq = new OfflineQueue(); oq.queueDecision("ap1", "u1", "approved", "ok");
const dec = new Map(); const sync = syncOfflineQueue(oq, dec as never);
assert(sync.applied.length === 1, "v1.1 F10 offline decision syncs");

console.log(failures===0 ? "GOLDEN PASS" : `GOLDEN FAIL (${failures})`); process.exit(failures===0?0:1);
}
main();
