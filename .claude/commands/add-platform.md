---
description: Flip a "Coming soon" platform profile to live (e.g. /add-platform instagram-reels)
argument-hint: <profile-id>
---

Make the platform profile **$1** live in VideoNest. This is the additive path the architecture
was designed for — do NOT scatter platform logic outside the registry.

Steps:

1. Read `videonest-build-spec.md` §17 and **verify the target spec for $1** (resolution, aspect,
   max duration, fps cap, size cap, bitrate strategy) against current platform requirements before
   coding. Do a real spec-verification pass.
2. In `lib/config/profiles.ts`, change the `$1` entry's `status` from `'soon'` to `'live'` and
   finalize its encode parameters. Confirm `buildPlan` handles its `aspect`/`bitrateStrategy`
   (add a branch + unit tests in `tests/plan.test.ts` if it introduces a new case, e.g. 16:9 or
   `overprovision`).
3. Add a **share adapter + device-aware "best way" copy** for $1 (mirror `lib/share/share.ts` and
   `components/tool/ShareActions.tsx`). Keep copy honest — no "lossless"/"no quality loss".
4. Wire the tool route/screen to accept the `$1` profile id (the engine is already profile-driven
   via `optimize(file, profileId, ...)`).
5. Run the `/verify` checks (lint, test, build) and confirm an empty `.env` still works.

Keep the change minimal and registry-driven. Report what you verified about the platform's real
spec and what you changed.
