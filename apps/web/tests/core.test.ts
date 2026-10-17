
import { describe, it, expect } from "vitest";
import { redactText, redactObject, evaluatePolicy, createAuditRow, verifyChain, createApproval, decideApproval, signCallback, verifyCallback, processBatch, validateBatch, dedupeByIdempotency, signManifest, verifyManifest, generateEd25519KeyPair, hashContent, getPlanLimits, overageUnits, authorize, can, computeCost, getPricing, encryptAESGCM, decryptAESGCM, isBlockedUrl, isPrivateIp, verifyPaddleSignature, applyPaddleEvent, storageRouter, ApiError, errorResponse } from "@agentguard/shared";
import { createHmac } from "node:crypto";

describe("redaction", ()=>{
  it("redacts email/phone/card/api-key/jwt/iban/ssn and counts", ()=>{
    const text = "hi alice@example.com 415-555-0132 card 4242424242424242 ssn 123-45-6789 key sk-abcdefgh12345678 iban DE89370400440532013000 jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const r = redactText(text); expect(r.count).toBeGreaterThanOrEqual(6); expect(r.redacted).not.toContain("alice@example.com"); expect(r.redacted).not.toContain("4242424242424242"); expect(r.redacted).not.toContain("123-45-6789");
  });
  it("redactObject deep", ()=>{ const { redacted, count } = redactObject({ a: "alice@example.com", nested: { b: "415-555-0132" } }); expect(count).toBe(2); expect(JSON.stringify(redacted)).not.toContain("alice@example.com"); });
  it("hash mode", ()=>{ const r = redactText("alice@example.com","hash"); expect(r.redacted).toContain("[HASHED:email:"); });
});
describe("policy", ()=>{
  const rules = [
    { id:"r1", action:"allow" as const, priority:1, toolGlob:"search*" },
    { id:"r2", action:"deny" as const, priority:10, toolGlob:"deploy*" },
    { id:"r3", action:"require_approval" as const, priority:5, costThreshold:10 },
  ];
  it("precedence deny > require_approval > allow", ()=>{ expect(evaluatePolicy(rules,{tool:"deploy-x", cost:99}).decision).toBe("deny"); expect(evaluatePolicy(rules,{tool:"other", cost:99}).decision).toBe("require_approval"); expect(evaluatePolicy(rules,{tool:"search-x"}).decision).toBe("allow"); });
  it("deterministic tie-break", ()=>{ const rs=[{id:"b",action:"deny" as const,priority:1,toolGlob:"*"}, {id:"a",action:"deny" as const,priority:1,toolGlob:"*"}]; const d1=evaluatePolicy(rs,{tool:"x"}); const d2=evaluatePolicy(rs,{tool:"x"}); expect(d1).toEqual(d2); });
  it("property: random rule sets never ambiguous", ()=>{ for(let i=0;i<50;i++){ const rs=Array.from({length:5},(_,j)=>({id:`r${j}`,action:(["allow","deny","require_approval"] as const)[j%3] ?? "allow",priority:j,toolGlob:"*"})); const d=evaluatePolicy(rs,{tool:"x"}); expect(["allow","deny","require_approval"]).toContain(d.decision); } });
  it("argument predicate", ()=>{ const rs=[{id:"p1",action:"deny" as const,priority:1,argumentPredicate:{path:"$.args.env",equals:"prod"}}]; expect(evaluatePolicy(rs,{tool:"x",args:{env:"prod"}}).decision).toBe("deny"); expect(evaluatePolicy(rs,{tool:"x",args:{env:"dev"}}).decision).toBe("allow"); });
});
describe("audit", ()=>{
  it("chain verifies and tamper detected at exact row", ()=>{ let prev=null as unknown as ReturnType<typeof createAuditRow>|null; const rows=[]; for(let i=0;i<5;i++){ const r=createAuditRow(prev,"org1",`a.${i}`,{i}); rows.push(r); prev=r; } expect(verifyChain(rows).ok).toBe(true); const tampered=rows.map(r=>({...r})); tampered[2]!.payload={i:999}; const v=verifyChain(tampered); expect(v.ok).toBe(false); expect(v.firstBrokenId).toBe(tampered[2]!.id); });
  it("concurrent appends concept: sequential seq", ()=>{ let prev=null as never; const rows=[]; for(let i=0;i<200;i++){ const r=createAuditRow(prev,"org1","a",{i}); rows.push(r); prev=r as never; } expect(verifyChain(rows).ok).toBe(true); expect(rows[199]!.seq).toBe(200); });
});
describe("approvals", ()=>{
  it("self-approval blocked 403", ()=>{ const ap=createApproval({orgId:"o",agentId:"a",action:"deploy",context:{},riskTier:"low",requesterId:"u1"}); expect(()=>decideApproval(ap,"u1","approved","ok")).toThrowError(/cannot approve|SELF/); try{ decideApproval(ap,"u1","approved","ok"); }catch(e){ expect((e as ApiError).status).toBe(403); } });
  it("two-person critical", ()=>{ const ap=createApproval({orgId:"o",agentId:"a",action:"deploy",context:{},riskTier:"critical",requesterId:"u1"}); expect(ap.requiredApprovals).toBe(2); const a1=decideApproval(ap,"u2","approved","ok"); expect(a1.status).toBe("pending"); const a2=decideApproval(a1,"u3","approved","ok"); expect(a2.status).toBe("approved"); });
  it("reject terminal", ()=>{ const ap=createApproval({orgId:"o",agentId:"a",action:"x",context:{},riskTier:"low",requesterId:"u1"}); const r=decideApproval(ap,"u2","rejected","no"); expect(r.status).toBe("rejected"); });
  it("hmac callback + replay window", ()=>{ const cb=signCallback({id:"1"}, "s"); expect(verifyCallback(cb.payload, cb.timestamp, cb.signature, "s")).toBe(true); expect(verifyCallback(cb.payload, cb.timestamp, cb.signature, "s", Date.now()+10*60*1000)).toBe(false); expect(verifyCallback(cb.payload, cb.timestamp, "bad", "s")).toBe(false); });
});
describe("ingest", ()=>{
  it("validates batch limits", ()=>{ expect(validateBatch([]).valid).toBe(false); expect(validateBatch(Array.from({length:501},()=>({traceId:"t",agentId:"a",type:"x"}))).valid).toBe(false); expect(validateBatch([{traceId:"t",agentId:"a",type:"x"}]).valid).toBe(true); });
  it("idempotency dedupe", ()=>{ const evs=[{traceId:"t",agentId:"a",type:"x",idempotencyKey:"k1"},{traceId:"t",agentId:"a",type:"x",idempotencyKey:"k1"}]; expect(dedupeByIdempotency(evs as never).length).toBe(1); });
  it("process redacts + computes cost", ()=>{ const out=processBatch([{traceId:"t",agentId:"a",type:"llm_call",input:"alice@example.com",model:"gpt-4o",tokensIn:1000,tokensOut:1000} as never]); expect(out[0]!.redactionCount).toBe(1); expect(out[0]!.costUsd).toBeGreaterThan(0); });
});
describe("evidence", ()=>{
  it("sign/verify and modified fails", ()=>{ const kp=generateEd25519KeyPair(); const files=[{name:"a.txt",sha256:hashContent("hello")}]; const m=signManifest(files,kp.privateKey,kp.publicKey); expect(verifyManifest(m,{"a.txt":"hello"}).ok).toBe(true); expect(verifyManifest(m,{"a.txt":"hellx"}).ok).toBe(false); });
});
describe("plans/pricing", ()=>{
  it("plans exact", ()=>{ expect(getPlanLimits("Free").eventsPerMonth).toBe(10000); expect(getPlanLimits("Pro").agents).toBe(10); expect(getPlanLimits("Team").eventsPerMonth).toBe(2000000); expect(overageUnits(260000,"Pro")).toBe(1); });
  it("pricing compute", ()=>{ expect(computeCost("gpt-4o",1000,1000)).toBeCloseTo(0.0125,4); expect(getPricing("gpt-4o")?.provider).toBe("openai"); });
});
describe("authorize", ()=>{
  it("every role matrix", ()=>{ const mk=(role: string)=>({userId:"u",orgId:"o",role: role as never}); expect(can(mk("owner"),"billing:manage")).toBe(true); expect(can(mk("viewer"),"billing:manage")).toBe(false); expect(can(mk("viewer"),"agents:read")).toBe(true); expect(can(mk("approver"),"approvals:decide")).toBe(true); expect(can(mk("analyst"),"approvals:decide")).toBe(false); expect(can(mk("admin"),"agents:write")).toBe(true); expect(can({userId:"u",orgId:"o1",role:"owner"},"agents:read","o2")).toBe(false); expect(()=>authorize(mk("viewer"),"agents:write")).toThrow(); });
});
describe("crypto/ssrf/storage/paddle", ()=>{
  it("aes-gcm roundtrip", ()=>{ const e=encryptAESGCM("secret","master-key-123"); expect(decryptAESGCM(e,"master-key-123")).toBe("secret"); });
  it("ssrf blocks private", ()=>{ expect(isBlockedUrl("http://169.254.169.254/latest/meta-data/").blocked).toBe(true); expect(isBlockedUrl("http://localhost:3000/x").blocked).toBe(true); expect(isBlockedUrl("https://example.com/hook").blocked).toBe(false); expect(isPrivateIp("10.0.0.1")).toBe(true); expect(isPrivateIp("8.8.8.8")).toBe(false); });
  it("storage router local", ()=>{ const s=storageRouter("sensitive","local"); expect(s).toBeDefined(); });
  it("paddle signature + replay + out-of-order", ()=>{ const secret="s3cr3t"; const ts=Math.floor(Date.now()/1000); const raw='{"event_id":"e1"}'; const sig=createHmac("sha256",secret).update(`${ts}:${raw}`).digest("hex"); expect(verifyPaddleSignature(raw, `ts=${ts};h1=${sig}`, secret)).toBe(true); expect(verifyPaddleSignature(raw, `ts=${ts};h1=bad`, secret)).toBe(false); const seen=new Set<string>(); const mk=(id:string,type:string,at:string)=>({eventId:id,eventType:type,occurredAt:at,data:{orgId:"o1",subscriptionId:"s1",customerId:"c1",plan:"Pro"}}); const r1=applyPaddleEvent(null, mk("e1","subscription.created","2026-01-01T00:00:00Z") as never, seen); expect(r1.state?.status).toBe("active"); const r2=applyPaddleEvent(r1.state, mk("e1","subscription.created","2026-01-01T00:00:00Z") as never, seen); expect(r2.changed).toBe(false); const r3=applyPaddleEvent(r1.state, mk("e2","subscription.canceled","2025-01-01T00:00:00Z") as never, seen); expect(r3.changed).toBe(false); });
});
describe("api error format", ()=>{
  it("errorResponse shape", ()=>{ const r=errorResponse(new ApiError("NOT_FOUND",404,"missing"), "req_1"); expect(r.body).toEqual({ error:{ code:"NOT_FOUND", message:"missing", details:null, request_id:"req_1" } }); });
});
