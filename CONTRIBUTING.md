# Contributing to AgentGuard

Thanks for helping make AgentGuard better. This repo is the open governance console for AI agents: log every action, enforce policies and human approvals, track cost and reliability, and export tamper-evident audit evidence.

## Quick start

```bash
pnpm install
pnpm verify:all   # typecheck + lint + tests + golden checks
pnpm dev          # web console on http://localhost:3000
```

See `README.md` for the full setup, env vars, and deployment notes.

## How to contribute

1. **Open an issue first** for anything bigger than a typo — describe the problem, the expected behaviour, and the area (policy engine, audit log, approvals, billing, UI, docs).
2. **Fork + branch** from `main`: `feat/<short-name>` for features, `fix/<short-name>` for fixes, `docs/<short-name>` for docs.
3. **Keep changes small and verifiable.** One PR = one idea. Include what you changed, how you tested it, and any docs you updated.
4. **Run the gates** before you push: `pnpm verify:all` must stay green. Don't ship TODOs, stubs, or unmarked placeholders.
5. **Never commit secrets.** Use `.env.example` as the reference. No real API keys, tokens, or PII in code, tests, or fixtures.

## PR checklist

- [ ] `pnpm verify:all` passes
- [ ] Tests added or updated for behaviour changes
- [ ] Docs updated if behaviour or env vars changed
- [ ] No secrets, no real PII, no TODOs left behind

## Reporting security issues

Don't open a public issue for a vulnerability. See `SECURITY.md` for the private reporting path.
