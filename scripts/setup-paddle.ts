console.log("setup-paddle — Paddle sandbox setup");
console.log("Requires PADDLE_API_KEY + PADDLE_ENV=sandbox. This stub validates env and prints next steps (live Paddle calls need real credentials).");
if(!process.env.PADDLE_API_KEY){ console.log("PADDLE_API_KEY not set — create products/prices in Paddle dashboard, then set PADDLE_PRICE_* in .env. See docs/RUNBOOK.md."); } else { console.log("PADDLE_API_KEY present (redacted). Create products via Paddle API: POST /products, POST /prices for Pro/Team monthly+yearly + overage."); }
