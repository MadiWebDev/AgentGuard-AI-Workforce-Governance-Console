
import { inspectStream, measureInspectOverhead, LocalSandboxProvider, learnFromDecisions } from "@agentguard/shared";
async function main(): Promise<void> {
  const tokens = Array.from({ length: 500 }, (_, i) => `token${i} `);
  const overhead = measureInspectOverhead(tokens, { windowTokens: 20, guardPolicies: [{ id: "g1", pattern: "never-matches-xyz" }] }, 200);
  console.log(`stream-inspect overhead: avg ${overhead.avgMs.toFixed(4)} ms/call over ${overhead.runs} runs (500 tokens, 1 guard policy)`);
  const sb = new LocalSandboxProvider();
  const t0 = Date.now();
  const r = await sb.execute({ command: "echo", args: ["cold-start-probe"], egressAllowlist: [] });
  console.log(`sandbox cold start (LocalSandbox echo): ${Date.now() - t0} ms, stdout ok: ${r.stdout.includes("cold-start-probe")}`);
  const decisions = Array.from({ length: 1000 }, (_, i) => ({ action: "deploy", tool: i % 2 === 0 ? "deploy-prod" : "search-web", environment: "prod", decision: "approved" as const }));
  const t1 = Date.now();
  const props = learnFromDecisions({ decisions, driftFindings: [{ agentId: "a1", tool: "expensive-tool", dimension: "cost", traceIds: ["t1"] }] });
  console.log(`autopilot runtime: ${Date.now() - t1} ms for 1000 decisions + 1 drift finding -> ${props.length} proposals`);
  const single = inspectStream(tokens, { windowTokens: 20, guardPolicies: [{ id: "g1", pattern: "never-matches-xyz" }] });
  console.log(`stream-inspect clean-stream terminated: ${single.terminated}`);
}
main();
