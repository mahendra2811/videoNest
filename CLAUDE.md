# VideoNest — project guide for Claude

VideoNest is a **mobile-first, light-theme, 100% client-side** web app that re-encodes any
video — entirely on the user's device — into the cleanest possible file for **WhatsApp Status**,
so it stays as sharp as possible after WhatsApp re-compresses it.

> **Prime directive — honest copy.** WhatsApp ALWAYS re-compresses Status uploads. We cannot
> prevent that. NEVER use the words "no quality loss" or "lossless" anywhere in UI/marketing
> copy. The promise is **"stays sharp" / "best possible quality after WhatsApp compresses it."**

v1 scope: WhatsApp Status only, no backend, no upload, no accounts, free. Other platforms are
locked "Coming soon" tiles. The full spec lives in `videonest-build-spec.md` (read it before
large changes).

## Commands

| Task | Command | Notes |
| --- | --- | --- |
| Dev server | `pnpm dev` | Turbopack; Serwist disabled in dev |
| **Production build** | `pnpm build` | **Must stay `next build --webpack`** — see gotchas |
| Serve prod build | `pnpm start` | needs a prior `pnpm build` |
| Unit tests | `pnpm test` | Vitest (`buildPlan` + utils) |
| Lint + format | `pnpm lint` / `pnpm lint:fix` | Biome (not ESLint) |
| Regenerate PWA icons | `pnpm gen:icons` | rasterizes the logo via `sharp` |

Definition of done for any change: `pnpm lint`, `pnpm test`, and `pnpm build` all pass with
zero errors, and the app still runs with an **empty `.env`**.

## Architecture

### Encode engine (`lib/engine/`) — the core
Runs the whole pipeline inside a **Web Worker** so the main thread stays smooth and progress is
real (never faked):

1. `probe.ts` — read metadata from the `File` with Mediabunny.
2. `plan.ts` — **pure, unit-tested** `buildPlan(meta, profile)`: downscale-only to the profile
   box (never upscale), cap fps, blur-pad non-target-aspect sources, trim over-duration, detect
   an already-optimal fast path, pick a constrained bitrate under the size cap.
3. `capabilities.ts` — probe `VideoEncoder.isConfigSupported` for H.264.
4. `encode.webcodecs.ts` — primary: Mediabunny `Conversion` (+ an `OffscreenCanvas` compositor
   for the blurred pad), `fastStart:'in-memory'`. `encode.ffmpeg.ts` — lazy ffmpeg.wasm fallback
   (self-hosted single-thread core in `public/ffmpeg/`, no SharedArrayBuffer needed).
5. `run.ts` — orchestrates the above; one automatic OOM retry at lower resolution, then ffmpeg.
6. `worker.ts` — message host (`optimize` + `probe`). `index.ts` — public `optimize()` /
   `probeFile()`, each spawns a short-lived worker via `new Worker(new URL('./worker.ts', import.meta.url))`.

Output profile (WhatsApp Status): MP4 / H.264 High / yuv420p, ≤1080×1920 (9:16, never upscaled),
≤30fps, 2s closed GOP, AAC-LC 128 kbps @ 48 kHz, constrained bitrate under ~15 MB.

### Profile registry (`lib/config/profiles.ts`) — single source of truth
Both the home grid and the engine read from `PLATFORM_PROFILES`. To add a platform, flip its
`status` from `'soon'` to `'live'` and add a share adapter — do **not** scatter platform logic
elsewhere.

### Config & flags
- `lib/config/site.ts` — typed config from env with safe defaults.
- `lib/config/flags.ts` — derived feature flags. **Golden rule: every integration is optional.
  If its env key is absent/empty the feature silently disables and the app works perfectly. No
  crashes, no console errors, no broken UI.** Add new integrations the same way.

### UI
- shadcn-style primitives in `components/ui/` (hand-written, Radix-based). Tailwind v4 with a
  sunset gradient theme; tokens + `.bg-sunset`/`.text-sunset` live in `app/globals.css`.
- Tool flow: `components/tool/` (Dropzone → FileMeta → ProcessingRing → Preview → ShareActions /
  ErrorCard) orchestrated by `ToolScreen.tsx`, state in `lib/store/tool.ts` (Zustand).
- The sunset gradient is used ONLY on: logo, primary CTAs, the progress ring, the top loader,
  the splash, and subtle hero accents. Keep surfaces/body text neutral.

## Critical gotchas (read before editing config)

- **`build` must use `--webpack`.** Next 16 defaults to Turbopack, but `@serwist/next` injects a
  webpack config and Turbopack errors on it. `dev` stays on Turbopack with
  `SERWIST_SUPPRESS_TURBOPACK_WARNING=1`.
- **lucide-react v1 removed brand icons** (no `Facebook`/`Instagram`/`Youtube`). Platform tiles
  map to generic icons (`Camera`/`Clapperboard`/`ThumbsUp`/`MessageCircle`) in `PlatformTile.tsx`.
- **`app/sw.ts` and `lib/engine/worker.ts` are excluded from the main tsconfig** (`exclude` array)
  because they use the WebWorker lib, which conflicts with the DOM lib. webpack/Serwist still
  compile them. If you add another worker, exclude it too.
- **COOP/COEP headers** (`same-origin` / `credentialless`) in `next.config.ts` enable cross-origin
  isolation for ffmpeg.wasm. Don't remove them. `credentialless` (not `require-corp`) is
  deliberate so analytics/ads can still load.
- **Sentry is only wrapped when `NEXT_PUBLIC_SENTRY_DSN` is set**, and the server import uses
  `/* webpackIgnore: true */` to keep the heavy OpenTelemetry chain out of the bundle when off.
- **ffmpeg.wasm core (`public/ffmpeg/*.wasm`, 32 MB) is excluded from the Serwist precache** — see
  the `exclude` array in `next.config.ts`. Don't precache it.
- **JSON-LD** uses `dangerouslySetInnerHTML` with `JSON.stringify` of app-controlled static config
  only (never user input) — this is the standard, safe Next.js pattern.
- **git/lint-staged trap:** `lint-staged` cannot create a backup before the *first* commit and can
  silently discard uncommitted working-tree edits if a task fails. The initial commit was made
  with `--no-verify` for that reason. Now that commits exist, the hook is safe; commit normally.

## Conventions

- Package manager is **pnpm**. Lint/format is **Biome** (`biome.json`); `app/globals.css` is
  excluded from Biome (Tailwind v4 at-rules its CSS parser rejects).
- TypeScript strict. Prefer `import type`. `any` is allowed only where Mediabunny's option unions
  make it unavoidable (`noExplicitAny` is off in Biome).
- Copy must stay honest and warm (see prime directive). Centralize user-facing strings where
  practical (future i18n).
- Accessibility: keyboard-navigable, visible sunset focus rings, `prefers-reduced-motion` honored,
  proper aria on dropzone/progress/toggle/tiles.

## Do NOT build now (deferred — spec §17)

Scaffold-only; these are explicitly out of scope for v1. Document/scaffold, don't implement:
server heavy-tier for 4K/long sources, WhatsApp auto-split (>30s → segments), flipping more
platforms live, cookie-consent banner, blog, native (Capacitor) wrapper, Hindi i18n. The profile
registry + worker engine + share adapters are structured to make these additive, not rewrites.

## Layout

```
app/                routes, layout, manifest/sitemap/robots, OG image, error boundaries, sw.ts
components/         brand/ layout/ tool/ platforms/ marketing/ ads/ seo/ ui/
lib/
  config/           site, flags, profile registry
  engine/           probe → plan → capabilities → encode (worker) → output
  share/ analytics/ seo/ store/ utils/ content/
public/ffmpeg/      self-hosted ffmpeg.wasm core (fallback only; not precached)
tests/              Vitest unit tests
scripts/            generate-icons.mjs
```
