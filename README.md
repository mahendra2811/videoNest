# VideoNest

**Optimize any video for social platforms — entirely on your device — so it stays as sharp as
possible after the platform re-compresses it.**

VideoNest re-encodes video in the browser (WebCodecs + Mediabunny, with an ffmpeg.wasm fallback)
into the cleanest possible file for each destination. Nothing is uploaded; nothing leaves your
device. Free, no accounts.

> **Honest by design:** every platform re-compresses uploads. We can't stop that — we feed them an
> optimally-prepared file so the result stays sharp. The copy never claims "lossless" or "no
> quality loss."

## Platforms

All run on-device, each tuned to its own spec (aspect, resolution, duration, fps, bitrate):

| Platform | Route | Notes |
| --- | --- | --- |
| WhatsApp Status | `/whatsapp-status-video` | 9:16 ≤30s; **>30s auto-splits into sequential 30s parts** |
| Instagram Reels / Story | `/instagram-reels-video`, `/instagram-story-video` | 9:16, high bitrate |
| YouTube / Shorts | `/youtube-video`, `/youtube-shorts-video` | 16:9 / 9:16, high bitrate |
| Facebook Video / Story | `/facebook-video`, `/facebook-story-video` | 16:9 / 9:16 |

Adding a platform is data-driven: a profile in `lib/config/profiles.ts` + copy in
`lib/content/platforms.ts` + a 2-line route. See the `/add-platform` notes in `CLAUDE.md`.

## Commands

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (uses --webpack — required by Serwist)
pnpm start        # serve the production build
pnpm test         # Vitest unit tests (buildPlan, computeSegments, utils)
pnpm lint         # Biome check   ·   pnpm lint:fix   to autofix/format
pnpm gen:icons    # regenerate PWA icons from the logo
```

Definition of done for a change: `pnpm lint`, `pnpm test`, and `pnpm build` all pass with zero
errors, and the app still runs with an **empty `.env`**.

## Environment variables

Every integration is optional — if its key is absent the feature silently disables and the app
works perfectly. Copy `.env.example` to `.env.local` and fill in only what you need.

| Variable | Purpose | If blank |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_NAME` / `_URL` / `_CONTACT_EMAIL` | Brand + canonical | Sensible defaults |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `_GTM_ID` | Analytics | Disabled |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Search Console tag | Omitted |
| `NEXT_PUBLIC_ADS_ENABLED` + `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Ads | Off (needs both) |
| `NEXT_PUBLIC_FORMSPREE_ID` | Contact form | Falls back to `mailto:` |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | Disabled (not bundled) |
| `NEXT_PUBLIC_SERVER_TIER_ENABLED` + Vercel Blob | Optional server heavy-tier | Off — 100% client-side |

## Deploying to Vercel

1. Import the repo; Vercel auto-detects Next.js. Build command `pnpm build`.
2. **COOP/COEP headers** (`same-origin` / `credentialless`) are set in `next.config.ts` for
   cross-origin isolation (SharedArrayBuffer / ffmpeg.wasm). Don't remove them.
3. `manifest`, `sitemap`, and `robots` are generated natively at build.

### Optional server heavy-tier

A dormant-by-default upload path for sources too large/long for the browser. To enable it:

1. Set `NEXT_PUBLIC_SERVER_TIER_ENABLED=true`.
2. Link a **Vercel Blob** store (auto-injects `BLOB_READ_WRITE_TOKEN`).
3. Provide ffmpeg to the function — set `allowBuilds: { ffmpeg-static: true }` in
   `pnpm-workspace.yaml` (fetches the binary at install) or supply a system `ffmpeg`.

It uploads the source to Blob, transcodes via `/api/heavy`, returns the result, and deletes the
upload — always behind an explicit opt-in + privacy notice. **Beta:** serverless time/memory limits
make true 4K / very-long jobs marginal; load-test before relying on it. Left off, the app is 100%
client-side and the option never appears.

## Mobile app (Capacitor)

VideoNest is an installable PWA. For app-store distribution there's a Capacitor wrapper
(`capacitor.config.ts`) that loads the deployed site in a native WebView (the on-device engine runs
inside it). Because the app has server routes, it is **not** a static export — set your deployed
origin and sync:

```bash
export CAP_SERVER_URL=https://your-deployment.example.com   # or rely on NEXT_PUBLIC_SITE_URL
pnpm cap:add:android        # or pnpm cap:add:ios   (creates the native project)
pnpm cap:sync
pnpm cap:open:android       # build/run in Android Studio (Xcode for iOS)
```

Building the native binaries requires Android Studio / Xcode.

## Privacy & legal

`/privacy-policy` and `/terms` are plain-language **templates** that adapt to which integrations
are enabled. Have them reviewed by a professional before relying on them.

## Project layout

```
app/                routes (platform tools, blog, legal), api/heavy, layout, manifest/sitemap/robots
components/         brand/ layout/ tool/ platforms/ marketing/ ads/ seo/ ui/
lib/
  config/           site, flags, profile registry
  engine/           probe → plan → capabilities → encode (worker) → output; computeSegments
  content/          platforms, blog, faq
  heavy/            optional server-tier client
  share/ analytics/ seo/ store/ utils/
public/ffmpeg/      self-hosted ffmpeg.wasm core (fallback only; not precached)
tests/              Vitest unit tests
```

See `CLAUDE.md` for architecture details, conventions, and gotchas.
