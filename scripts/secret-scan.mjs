// Secret scan (no network): fails on high-confidence hardcoded secrets.
// Test fixtures / docs that intentionally show placeholder values are allowlisted by path or pattern below.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "coverage", ".turbo", ".storage"]);
const SKIP_FILES = new Set(["secret-scan.mjs"]);
const PATTERNS = [
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key block"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key id"],
  [/ghp_[A-Za-z0-9]{36,}/, "GitHub PAT"],
  [/sk-live-[A-Za-z0-9]{16,}/, "live secret key"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/-----BEGIN PGP PRIVATE KEY BLOCK-----/, "PGP private key"],
];
const ALLOW = [/secret123/, /test-secret/, /mock-secret/, /example\.com/, /agentguard-dev-only/, /<redacted>/];
function walk(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (!SKIP_FILES.has(e.name) && !p.endsWith(".zip") && !p.endsWith(".png") && !p.endsWith(".jpg")) out.push(p);
  }
  return out;
}
let findings = [];
for (const f of walk(".", [])) {
  let text;
  try { text = readFileSync(f, "utf8"); } catch { continue; }
  for (const [re, label] of PATTERNS) {
    if (re.test(text) && !ALLOW.some((a) => a.test(text))) findings.push(`${f}: ${label}`);
  }
}
if (findings.length) { console.log("SECRET SCAN FAIL"); for (const f of findings) console.log(" -", f); process.exit(1); }
console.log("SECRET SCAN PASS (no high-confidence hardcoded secrets)");
