import { newRequestId, signManifest, generateEd25519KeyPair, hashContent } from "@agentguard/shared";
import { store } from "@/server/store";
import { ok, actorFromHeaders } from "@/lib/api";
export async function POST(req: Request){ const rid=req.headers.get("x-request-id")??newRequestId(); const a=actorFromHeaders(req.headers); const json=JSON.stringify({ orgId:a.orgId, at:new Date().toISOString() }); const files=[{name:"evidence.json",sha256:hashContent(json)}]; const kp=generateEd25519KeyPair(); const manifest=signManifest(files,kp.privateKey,kp.publicKey); store.appendAudit(a.orgId,"evidence_pack.generated",{files:["evidence.json"]}); return ok({ manifest, files: { "evidence.json": json } }, rid, 201); }
export async function GET(req: Request){ const rid=req.headers.get("x-request-id")??newRequestId(); return ok({ packs: [] }, rid); }
