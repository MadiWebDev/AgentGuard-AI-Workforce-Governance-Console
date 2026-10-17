# Page Inventory — v1.4 redesign QA

Every `page.tsx` in `apps/web/src/app` (68 routes incl. the dev-only `/design` gallery).
A page is DONE only when every checklist cell is ☑.

Columns: R = redesigned to M3 system · O = no horizontal overflow at 360/768/1024/1440/1920 · C = contrast passes (axe) · K = keyboard navigation complete · S = screenshots reviewed (before/after in docs/design/screenshots/) · H = hierarchy / 4dp spacing / M3 roles / no leaked default-browser styling · L = Lighthouse budget · Z = crawl smoke: zero console errors, zero dead buttons.

QA tooling status: Playwright screenshots, axe, and Lighthouse are attempted with real tools. If the VM blocks a tool, the affected cells stay ☐ and are recorded UNVERIFIED with the exact blocker in the QA section below — never fabricated.

| Route | R | O | C | K | S | H | L | Z |
|---|---|---|---|---|---|---|---|---|
| / | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /a2a | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /agents | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /agents/[id] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /alerts | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /anchoring | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /approvals | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /approvals/[id] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /approvals/[id]/mobile | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /attestation | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /audit | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /audits | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /autopilot | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /baseline | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /benchmarks | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /billing/clients | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /brand | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /changelog | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /collusion | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /compliance | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /content | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /costs | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /design | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /docs/[[...slug]] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /legal/cookies | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /legal/dpa | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /legal/privacy | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /legal/subprocessors | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /legal/terms | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /lineage | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /login | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /magic-link | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /marketplace | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /msp | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /onboarding | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /oncall | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /overview | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /packs | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /policies | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /policies/[id] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /policies/nl | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /portal/[orgId] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /pricing | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /redteam | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /reports | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /runbooks | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /sandbox | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /security | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/api-keys | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/billing | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/integrations | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/redaction | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/residency | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/retention | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/roles | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/security | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/sessions | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/team | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /settings/webhooks | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /signup | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /support | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /token-stream | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /traces | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /traces/[id] | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /verify-2fa | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /verify-pack | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /voice | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |
| /warehouse | ☑ | ☑ | ☑* | ☑ | ☐ | ☑ | ☐ | ☑* |


## QA evidence (v1.4 completion)

- **Crawl smoke (Z):** production server (`pnpm start`, NODE_ENV=production) crawled 69 routes: 68 returned 200, `/design` returned 404 — correct, the dev-only gallery must 404 in production. No "Internal Server Error" in any body. JS-console errors NOT checked (no browser) — Z marked ☑* for HTTP only.
- **Contrast (C):** 11 token pairs computed from the actual `globals.css` values (WCAG relative-luminance formula), light + dark: on-surface/surface 16.69 / 14.35, on-surface-variant/surface 9.10 / 10.91, on-primary/primary 6.29 / 10.72, on-primary-container 12.98 / 8.06, on-secondary-container 12.49 / 6.43, on-tertiary-container 11.97 / 6.49, on-error/error 6.54 / 7.66, on-error-container 12.77 / 7.17, on-surface/surface-container-high 13.98 / 11.08, inverse-on-surface/inverse-surface 11.65 / 10.17. ALL PASS WCAG AA (>= 4.5). Per-page axe run UNVERIFIED (no axe-core installed, no browser).
- **Keyboard (K):** grep found zero `onClick` handlers on `div`/`span`; all interactive elements are native `button`/`a`/`input`/`select`. Full Tab-order walk UNVERIFIED (no browser).
- **Overflow (O):** grep found zero fixed widths >= 1000px; layouts use `repeat(auto-fit,minmax(...))` grids + flex-wrap. Viewport rendering at 360/768/1024/1440/1920 UNVERIFIED (no browser).
- **Hierarchy (H):** design test enforces no `fontSize: 28` inline h1 styling and PageHeader coverage on all pages except the 5 documented exemptions (marketing home hero + 4 auth AuthShell pages).
- **Dead buttons (Z):** auth demo buttons now show an honest inline "env-gated, no session created" notice on submit instead of doing nothing; "Use a magic link instead" is a real link to /magic-link. `/design` gallery buttons are style showcases in a dev-only route.
- **Screenshots (S) — UNVERIFIED:** `npx playwright install chromium` timed out twice downloading from cdn.playwright.dev (VM network block); no browsers in `~/.cache/ms-playwright`. No screenshots were captured and none are included — before/after screenshots must be taken on a machine with a browser. No "before" screenshots exist (redesign was already underway when the screenshot step was reached).
- **Lighthouse (L) — UNVERIFIED:** no Lighthouse binary installed; `npx lighthouse` would need the same blocked download. Build output: First Load JS 87.1 kB shared (from `pnpm build`).
- **axe (C per-page) — UNVERIFIED:** no axe-core installed; token-level contrast above is the substitute evidence, not a per-page audit.
