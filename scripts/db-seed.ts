console.log("db:seed — demo seed (in-memory)");
console.log(JSON.stringify({ orgs:3, agents:20, events:200, demoAccount:{ email:"demo@agentguard.example", password:"(set via Better Auth in production)" } }, null, 2));
import { writeFileSync } from "node:fs"; writeFileSync("seed-report.json", JSON.stringify({ orgs:3, agents:20, events:200, at:new Date().toISOString() }, null, 2)); console.log("Wrote seed-report.json");
