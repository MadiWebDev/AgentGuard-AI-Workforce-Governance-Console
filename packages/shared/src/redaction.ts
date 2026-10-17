
import { createHash } from "node:crypto";
export type RedactionMode = "mask"|"hash"|"drop";
export interface RedactionFinding { type: string; count: number; }
export interface RedactResult { redacted: string; count: number; findings: RedactionFinding[]; }
function luhnValid(num: string): boolean { const digits = num.replace(/[\s-]/g,""); if(!/^\d{13,19}$/.test(digits)) return false; let sum=0; let alt=false; for(let i=digits.length-1;i>=0;i--){ let d=Number(digits[i]); if(alt){ d*=2; if(d>9) d-=9; } sum+=d; alt=!alt; } return sum%10===0; }
const PATTERNS: { type: string; regex: RegExp; validate?: (m:string)=>boolean }[] = [
  { type: "email", regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { type: "phone", regex: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g },
  { type: "credit_card", regex: /\b(?:\d[ -]*?){13,19}\b/g, validate: luhnValid },
  { type: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "api_key", regex: /\b(?:sk-[A-Za-z0-9-_]{10,}|sk_live_[A-Za-z0-9_]+|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]+)\b/g },
  { type: "jwt", regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  { type: "iban", regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
];
export function redactText(text: string, mode: RedactionMode = "mask"): RedactResult {
  let out = text; let count=0; const findings: RedactionFinding[]=[];
  for (const p of PATTERNS) {
    const matches = [...out.matchAll(new RegExp(p.regex.source, "g"))].map(m=>m[0]).filter(m=>!p.validate || p.validate(m));
    if (matches.length===0) continue;
    findings.push({ type: p.type, count: matches.length }); count+=matches.length;
    for (const m of [...new Set(matches)]) {
      const repl = mode==="hash" ? `[HASHED:${p.type}:${createHash("sha256").update(m).digest("hex").slice(0,12)}]` : `[REDACTED:${p.type.toUpperCase()}]`;
      out = out.split(m).join(repl);
    }
  }
  return { redacted: out, count, findings };
}
export function redactValue(value: unknown, mode: RedactionMode="mask"): { value: unknown; count: number } {
  if (typeof value==="string") { const r=redactText(value, mode); return { value: r.redacted, count: r.count }; }
  if (Array.isArray(value)) { let c=0; const arr=value.map(v=>{ const r=redactValue(v,mode); c+=r.count; return r.value; }); return { value: arr, count: c }; }
  if (value && typeof value==="object") { let c=0; const obj: Record<string, unknown>={}; for (const [k,v] of Object.entries(value as Record<string,unknown>)) { const r=redactValue(v,mode); if (mode==="drop" && r.count>0 && typeof v==="string") { c+=r.count; continue; } obj[k]=r.value; c+=r.count; } return { value: obj, count: c }; }
  return { value, count: 0 };
}
export function redactObject(obj: Record<string, unknown>, mode: RedactionMode="mask"): { redacted: Record<string, unknown>; count: number } { const r=redactValue(obj, mode); return { redacted: r.value as Record<string, unknown>, count: r.count }; }
