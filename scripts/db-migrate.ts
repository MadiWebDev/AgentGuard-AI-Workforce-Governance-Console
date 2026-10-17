import { AUDIT_LOG_DDL, TABLES } from "../drizzle/schema.js";
console.log("db:migrate — validating schema (no live Postgres required in this environment)");
console.log(`Tables: ${TABLES.length} (${TABLES.join(", ")})`);
console.log("Audit DDL present:", AUDIT_LOG_DDL.includes("append-only"));
if(!process.env.DATABASE_URL) console.log("DATABASE_URL not set — migration validation only; run against Neon/Postgres in production (see README).");
else console.log("DATABASE_URL set — apply drizzle/schema.ts DDL to your Postgres (manual step in this build).");
