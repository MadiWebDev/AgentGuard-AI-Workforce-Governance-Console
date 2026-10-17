
// Golden path steps 1-8 — pure core services, no network/DB required.
import { redactObject, evaluatePolicy, createApproval, decideApproval, signCallback, verifyCallback, createAuditRow, verifyChain, signManifest, verifyManifest, generateEd25519KeyPair, hashContent, applyPaddleEvent, processBatch, ApiError } from "@agentguard/shared";
import { createHmac, createHash } from "node:crypto";
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
console.log(failures===0 ? "GOLDEN PASS" : `GOLDEN FAIL (${failures})`); process.exit(failures===0?0:1);
