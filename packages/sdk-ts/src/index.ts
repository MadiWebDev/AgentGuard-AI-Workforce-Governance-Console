
export interface AgentGuardOptions { apiKey: string; baseUrl?: string; failMode?: "fail-open"|"fail-closed"; fetchImpl?: typeof fetch; }
export interface TrackEvent { type: string; traceId: string; agentId: string; [k: string]: unknown; }
export class AgentGuard {
  constructor(private opts: AgentGuardOptions){ if(!opts.apiKey) throw new Error("apiKey required"); }
  private base(){ return (this.opts.baseUrl ?? "http://localhost:3000").replace(/\/$/,""); }
  private async req(path: string, body: unknown){ const f=this.opts.fetchImpl ?? fetch; const res=await f(`${this.base()}${path}`, { method:"POST", headers:{ "content-type":"application/json", "x-api-key": this.opts.apiKey }, body: JSON.stringify(body) }); if(!res.ok){ if(this.opts.failMode==="fail-open") return { decision:"allow", reason:"fail-open fallback", matched_rule_ids:[] }; throw new Error(`AgentGuard ${path} failed: ${res.status}`); } return res.json(); }
  async track(event: TrackEvent){ return this.req("/api/v1/ingest", { events:[event] }); }
  async checkPolicy(action: { tool?: string; cost?: number; [k:string]: unknown }){ return this.req("/api/v1/policy/check", action); }
  async requestApproval(action: { agentId: string; action: string; context?: Record<string,unknown>; riskTier?: string }){ return this.req("/api/v1/approvals", action); }
  async withTrace<T>(traceId: string, fn: (ctx:{traceId:string})=>Promise<T>): Promise<T>{ try{ await this.track({ type:"run_started", traceId, agentId:"unknown" }); const r=await fn({traceId}); await this.track({ type:"run_finished", traceId, agentId:"unknown" }); return r; }catch(e){ await this.track({ type:"error", traceId, agentId:"unknown", metadata:{ error: String(e) } }); throw e; } }
  async flush(){ return { flushed: true }; }
}
export default AgentGuard;
