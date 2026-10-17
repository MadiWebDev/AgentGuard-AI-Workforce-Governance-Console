
import * as net from "node:net";
export function isPrivateIp(ip: string): boolean {
  if (net.isIP(ip)===0) return false;
  if (net.isIPv4(ip)) { const [a,b]=ip.split(".").map(Number); if (a===10) return true; if (a===172 && b!>=16 && b!<=31) return true; if (a===192 && b===168) return true; if (a===127) return true; if (a===169 && b===254) return true; if (a===0) return true; return false; }
  const lower=ip.toLowerCase(); if (lower==="::1" || lower.startsWith("fe80:") || lower.startsWith("fc00:") || lower.startsWith("fd00:")) return true; return false;
}
export function isBlockedUrl(raw: string): { blocked: boolean; reason?: string } { let u: URL; try { u=new URL(raw); } catch { return { blocked:true, reason:"invalid url" }; } if (!["http:","https:"].includes(u.protocol)) return { blocked:true, reason:"protocol not allowed" }; const host=u.hostname.toLowerCase(); if (host==="localhost" || host.endsWith(".localhost") || host==="metadata.google.internal") return { blocked:true, reason:"blocked hostname" }; if (net.isIP(host)!==0 && isPrivateIp(host)) return { blocked:true, reason:"private IP" }; return { blocked:false }; }
export async function validateOutboundUrl(raw: string): Promise<{ allowed: boolean; reason?: string }> { const b=isBlockedUrl(raw); if (b.blocked) return { allowed:false, reason: b.reason }; try { const dns = await import("node:dns/promises"); const u=new URL(raw); if (net.isIP(u.hostname)===0) { const addrs=await dns.lookup(u.hostname, { all:true }); for (const a of addrs) if (isPrivateIp(a.address)) return { allowed:false, reason:"DNS resolves to private IP" }; } } catch { /* DNS failure: allow caller to handle fetch error, not SSRF bypass */ } return { allowed:true }; }
