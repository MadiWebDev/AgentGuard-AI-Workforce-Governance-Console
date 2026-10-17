# Cost Estimate (monthly, assumptions stated)

Assumptions: Vercel Pro $20, Neon $19-69, Upstash $10-50, Inngest $0-49, R2 $0-20 (egress), Cloudinary $0-89, Resend $0-20, Sentry $0-26, AI provider usage variable ($50-500).
| Orgs | Infra (excl AI) | Notes |
|---|---|---|
| 10 | ~$100-250 | mostly free tiers + Vercel/Neon base |
| 100 | ~$300-800 | usage scales with events/storage |
| 1000 | ~$1500-5000 | DB + storage + egress dominate |
Revenue at 100 orgs (mix Free/Pro/Team): illustrative $5k-15k/mo. Overages billed per 10k events via Paddle one-time charges.
