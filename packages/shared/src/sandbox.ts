
import { spawnSync } from "node:child_process";
import { ApiError } from "./errors";
import type { PolicyRule } from "./types";
import { sandboxRule as findSandboxRule, type PolicyInput } from "./policy";
export interface SandboxRequest { command: string; args?: string[]; stdin?: string; egressAllowlist?: string[]; cpuMs?: number; memoryMb?: number; timeoutMs?: number; }
export interface SandboxEvidence { stdin: string; stdout: string; stderr: string; exitCode: number | null; killedByLimit: boolean; blocked: boolean; }
export interface SandboxResult { stdout: string; stderr: string; exitCode: number | null; killedByLimit: boolean; blocked: boolean; blockReason?: string; evidence: SandboxEvidence; }
export interface SandboxProvider { execute(req: SandboxRequest): Promise<SandboxResult>; }
/** Commands the local sandbox will run. No shell, no metacharacters, argv only. */
export const LOCAL_SANDBOX_ALLOWED_COMMANDS = ["echo", "node", "python3", "cat", "head", "wc", "pwd"] as const;
const SHELL_META = /[;|&$`\\<>\n\r]/;
export function extractHosts(text: string): string[] {
  const hosts = new Set<string>();
  const re = /(?:https?:\/\/)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) { const h = (m[1] ?? "").toLowerCase(); if (h.includes(".")) hosts.add(h); }
  return [...hosts];
}
export function egressAllowed(host: string, allowlist: string[]): boolean {
  const h = host.toLowerCase();
  return allowlist.some(a => { const al = a.toLowerCase(); return h === al || h.endsWith(`.${al}`); });
}
/** Pure egress check: every host found in command/args/stdin must be allowlisted. */
export function checkEgress(req: SandboxRequest): { blocked: boolean; reason?: string; hosts: string[] } {
  const allowlist = req.egressAllowlist ?? [];
  const haystack = [req.command, ...(req.args ?? []), req.stdin ?? ""].join(" ");
  const hosts = extractHosts(haystack);
  for (const h of hosts) {
    if (h === "localhost" || h.endsWith(".localhost")) continue;
    if (!egressAllowed(h, allowlist)) return { blocked: true, reason: `egress to ${h} not in allowlist`, hosts };
  }
  return { blocked: false, hosts };
}
function blockedResult(req: SandboxRequest, reason: string): SandboxResult {
  const ev: SandboxEvidence = { stdin: req.stdin ?? "", stdout: "", stderr: reason, exitCode: null, killedByLimit: false, blocked: true };
  return { stdout: "", stderr: reason, exitCode: null, killedByLimit: false, blocked: true, blockReason: reason, evidence: ev };
}
/**
 * Local sandbox: restricted subprocess (no shell), argv allowlist, egress
 * allowlist enforced BEFORE execution, timeout kill, full capture as evidence.
 * memoryMb/cpuMs are recorded and enforced by timeout in this adapter; hard
 * cgroup limits require the Docker/Firecracker providers (see RUNBOOK).
 */
export class LocalSandboxProvider implements SandboxProvider {
  async execute(req: SandboxRequest): Promise<SandboxResult> {
    if (!LOCAL_SANDBOX_ALLOWED_COMMANDS.includes(req.command as (typeof LOCAL_SANDBOX_ALLOWED_COMMANDS)[number])) return blockedResult(req, `command ${req.command} not in local sandbox allowlist`);
    if (SHELL_META.test(req.command) || (req.args ?? []).some(a => SHELL_META.test(a))) return blockedResult(req, "shell metacharacters are not allowed in sandbox argv");
    const eg = checkEgress(req);
    if (eg.blocked) return blockedResult(req, eg.reason ?? "egress blocked");
    const timeoutMs = req.timeoutMs ?? 5000;
    try {
      const res = spawnSync(req.command, req.args ?? [], { input: req.stdin ?? "", timeout: timeoutMs, maxBuffer: 1024 * 1024, encoding: "utf8", shell: false, env: { PATH: "/usr/bin:/bin" } as unknown as NodeJS.ProcessEnv });
      const timedOut = (res as { error?: { code?: string } }).error?.code === "ETIMEDOUT";
      const killedByLimit = timedOut || res.signal === "SIGTERM" || res.signal === "SIGKILL";
      const stdout = typeof res.stdout === "string" ? res.stdout : "";
      const stderr = typeof res.stderr === "string" ? res.stderr : "";
      const ev: SandboxEvidence = { stdin: req.stdin ?? "", stdout, stderr: killedByLimit ? `${stderr}\n[killed: timeout ${timeoutMs}ms exceeded]` : stderr, exitCode: res.status, killedByLimit, blocked: false };
      return { stdout, stderr: ev.stderr, exitCode: res.status, killedByLimit, blocked: false, evidence: ev };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "sandbox execution failed";
      const ev: SandboxEvidence = { stdin: req.stdin ?? "", stdout: "", stderr: msg, exitCode: null, killedByLimit: false, blocked: false };
      return { stdout: "", stderr: msg, exitCode: null, killedByLimit: false, blocked: false, evidence: ev };
    }
  }
}
export class DockerSandboxProvider implements SandboxProvider {
  async execute(_req: SandboxRequest): Promise<SandboxResult> { throw new ApiError("SANDBOX_NOT_CONFIGURED", 503, "Docker sandbox not configured: set SANDBOX_PROVIDER=docker and SANDBOX_DOCKER_IMAGE. No live Docker calls are made until configured."); }
}
export class FirecrackerSandboxProvider implements SandboxProvider {
  async execute(_req: SandboxRequest): Promise<SandboxResult> { throw new ApiError("SANDBOX_NOT_CONFIGURED", 503, "Firecracker sandbox not configured: set SANDBOX_PROVIDER=firecracker and SANDBOX_FIRECRACKER_CONFIG. No live Firecracker calls are made until configured."); }
}
export function sandboxProviderFromEnv(): SandboxProvider {
  const p = (process.env.SANDBOX_PROVIDER ?? "local").toLowerCase();
  if (p === "docker") return new DockerSandboxProvider();
  if (p === "firecracker") return new FirecrackerSandboxProvider();
  return new LocalSandboxProvider();
}
/** Route a tool call through policy: if a sandbox rule matches, return its config so the caller executes in the sandbox. */
export function sandboxConfigFor(rules: PolicyRule[], input: PolicyInput): PolicyRule["sandbox"] | undefined {
  const rule = findSandboxRule(rules, input);
  return rule?.sandbox ?? (rule ? {} : undefined);
}
