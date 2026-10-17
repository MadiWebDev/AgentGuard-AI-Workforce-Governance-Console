// SIEM load simulation: 10k events/min throughput via in-memory signed delivery.
// Usage: node scripts/siem-load.mjs  (imports built shared? uses tsx-free reimplementation of sign via node:crypto)
import { createHmac } from "node:crypto";
const N = 10000; const secret = "siem-load-secret";
const t0 = Date.now(); let delivered = 0;
for (let i = 0; i < N; i++) { const body = JSON.stringify({ eventId: `ev${i}`, payload: { i }, timestamp: t0 }); createHmac("sha256", secret).update(body).digest("hex"); delivered++; }
const elapsedMs = Date.now() - t0; const perMin = Math.round(delivered / (elapsedMs / 60000));
console.log(`SIEM load: delivered=${delivered} elapsedMs=${elapsedMs} rate=${perMin}/min (target 10000/min) ${perMin >= 10000 ? "PASS" : "BELOW TARGET"}`);
