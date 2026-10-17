import { spawnSync } from "node:child_process";
const steps=[["typecheck","pnpm",["typecheck"]],["lint","pnpm",["lint"]],["test","pnpm",["test"]],["build","pnpm",["build"]],["verify:golden","pnpm",["verify:golden"]]];
console.log("verify:all");
const results=[];
for(const [name,cmd,args] of steps){ const r=spawnSync(cmd,args,{stdio:"inherit"}); const ok=r.status===0; results.push([name,ok]); console.log(`${ok?"PASS":"FAIL"} ${name}`); }
console.log("\nPass/fail table:"); for(const [n,ok] of results) console.log(`${ok?"PASS":"FAIL"} ${n}`);
process.exit(results.every(([,ok])=>ok)?0:1);
