---
description: Run the full VideoNest quality gate (lint, test, build) and report
allowed-tools: Bash(pnpm lint), Bash(pnpm test), Bash(pnpm build), Bash(git status:*)
---

Run VideoNest's definition-of-done checks in order and report a concise pass/fail summary:

1. `pnpm lint` — Biome must report no errors.
2. `pnpm test` — all Vitest tests must pass.
3. `pnpm build` — must compile with zero errors **and zero warnings** (the build uses
   `next build --webpack` on purpose; do not "fix" that to plain `next build`).

Then confirm the app still works with an empty `.env` (no required env vars). Report any failure
with the exact error and a proposed fix. Do not commit anything — just verify and report.
