# VideoNest — Production Build Specification (Claude Code Mega Prompt)

> **You are building a complete, production-ready web app from scratch. Follow this spec exactly. Build in the phase order in §16. Do not ask the user questions — where a detail is unspecified, choose the simplest robust option consistent with this document. When you finish each phase, run the build and fix every type, lint, and runtime error before moving on. The app is NOT done until `pnpm build` passes with zero errors and the encode engine successfully optimizes a test video.**

---

## 1. Mission

Build **VideoNest**, a mobile-first web app that takes any video the user provides and re-encodes it — entirely on the user's device — into the cleanest possible file for posting to **WhatsApp Status**, so it stays as sharp as possible after WhatsApp applies its own compression.

**Prime directive — be honest in all copy:** WhatsApp always re-compresses Status uploads. We cannot prevent that. We _minimize_ the damage by feeding WhatsApp an optimally-prepared file. Never use the words "no quality loss" or "lossless." The promise is "stays sharp" / "best possible quality after WhatsApp compresses it."

**v1 scope:** WhatsApp Status only, **100% client-side** (no backend, no upload, nothing leaves the device, no accounts, no login, fully free). Other platforms (Instagram, YouTube, Facebook) appear as locked "Coming soon" tiles. See §17 for the deferred roadmap — scaffold for it, do not build it.

---

## 2. Tech stack (use latest stable of each)

- **Next.js (App Router) + React + TypeScript** (strict). Package manager: **pnpm**.
- **Tailwind CSS v4** + **shadcn/ui** (Radix UI) + **clsx** + **tailwind-merge**.
- **Framer Motion** — animations and micro-interactions.
- **lucide-react** — icons.
- **next-themes** — light (default) / dark.
- **Zustand** — app state.
- **Sonner** — toasts (top-center).
- **nextjs-toploader** — route progress bar under the header.
- **react-dropzone** — file input.
- **WebCodecs API + Mediabunny** — primary on-device encode/mux. **Before coding the engine, consult Mediabunny's current official docs for its Conversion/encode API; it is a newer library — use its real, current API, not assumptions.**
- **@ffmpeg/ffmpeg + @ffmpeg/util + @ffmpeg/core** (ffmpeg.wasm) — probing + fallback decode/encode only (lazy-loaded).
- **@next/third-parties** — GA4 + Google Tag Manager.
- **next-sitemap** — sitemap + robots.
- **Serwist** — PWA service worker.
- **Sentry** (`@sentry/nextjs`) — error monitoring (env-gated).
- **Biome** — lint + format. **Husky + lint-staged** — pre-commit.
- **Vitest** + **React Testing Library** — unit tests.

Deploy target: **Vercel**. Set **COOP/COEP response headers** (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`) so SharedArrayBuffer / ffmpeg.wasm threading works. Verify these headers don't break embeds; if a third-party (ads, analytics) needs `credentialless`, use that variant.

---

## 3. The encode profile (locked — implement exactly)

Output target for the WhatsApp Status profile:

- Container **MP4**, `+faststart` (moov atom at front).
- Video **H.264 (AVC), High profile, yuv420p**.
- Resolution: target **1080×1920 (9:16)**. **Never upscale** — if the source is smaller, keep source resolution; only downscale toward the target.
- Frame rate: cap at **30 fps** (leave lower source rates alone).
- Bitrate strategy: **constrained** — keep the file comfortably **under 16 MB**. Use a near-visually-lossless quality target (CRF ~18 equivalent) but cap with a max bitrate / size budget so a ≤30s clip lands under ~15 MB. (Constrained-VBR philosophy: high quality, hard size ceiling.)
- Audio **AAC-LC, 128 kbps, 48 kHz** (mono acceptable for speech-only sources). If WebCodecs lacks AAC encode in the user's browser, include an AAC encoder fallback so audio always muxes.
- **2-second closed GOP** (keyframe interval = 2× fps).

**Automatic behaviors (v1):**

- **Duration:** if the clip is longer than **30 seconds, trim to the first 30s** and toast the user that it was trimmed (auto-split into multiple segments is a v1.1 feature — see §17).
- **Aspect ratio:** if the source is already ~9:16, leave dimensions alone (downscale only if larger). If it is horizontal or any other ratio, **pad to 9:16 using a blurred, scaled copy of the video as the background** (no user toggle in v1).
- **Already-optimal fast path:** if the source is already H.264 / yuv420p / ≤1080×1920 / ≤30fps / 9:16 / <15 MB, do a minimal high-quality re-encode (or remux) rather than an aggressive transform — never double-degrade a good file.
- **No sharpening/denoise filters in v1** (hidden; reserved for later).

---

## 4. Design system

**Brand:** name from env (`NEXT_PUBLIC_SITE_NAME`, default `VideoNest`). Logo = "VN" sunset-gradient badge (SVG in §4.4).

**Theme:** **light is primary and gets the most polish**; dark is available via `next-themes`. Both must be WCAG-AA contrast-safe.

### 4.1 Color tokens (CSS variables, Tailwind v4 `@theme`)

Brand sunset gradient: **`#FF8C42` (orange) → `#FF5E78` (coral) → `#FF2E93` (pink)**, diagonal (135°).

- `--brand-from: #FF8C42; --brand-via: #FF5E78; --brand-to: #FF2E93;`
- Gradient utility: a reusable `.bg-sunset` (`linear-gradient(135deg, var(--brand-from), var(--brand-via), var(--brand-to))`) and `.text-sunset` (gradient clipped to text).
- **Light theme:** background warm off-white `#FFF9F5`, surfaces `#FFFFFF`, text `#1A1416`, muted `#6B5B60`, border `#F0E4DE`.
- **Dark theme:** background `#15100F`, surfaces `#1F1816`, text `#FBEDE7`, muted `#B69A90`, border `#2E2422`.
- The sunset gradient is used **only** on: the logo, primary CTA buttons, the processing progress ring, the top loader bar, the splash animation, and subtle hero accents. Body text and surfaces stay neutral so the gradient feels premium, not loud.

### 4.2 Typography

- Font: **Geist** (via `next/font`), with **Geist Mono** for any code/numbers (the % readout). Headings tight tracking, large; body comfortable line-height.

### 4.3 Shape & motion

- Radius: `rounded-2xl` cards/buttons, `rounded-3xl` major panels. Soft, warm shadows (not harsh black).
- Framer Motion: gentle fade/slide on mount, spring on interactive elements, smooth crossfade on the before/after preview. Respect `prefers-reduced-motion`.

### 4.4 Logo (embed this SVG verbatim at `components/brand/Logo.tsx` as a React component; refine letterforms later if desired but keep the gradient + concept)

```svg
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="VideoNest">
  <defs>
    <linearGradient id="vnSunset" x1="3" y1="3" x2="45" y2="45" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FF8C42"/>
      <stop offset="0.5" stop-color="#FF5E78"/>
      <stop offset="1" stop-color="#FF2E93"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="42" height="42" rx="13" fill="url(#vnSunset)"/>
  <path d="M15 16 L24 33 L33 16" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="19.5" r="2.3" fill="#fff"/>
</svg>
```

The wordmark renders the badge next to `VideoNest` (text) where `Nest` may use `.text-sunset`. Generate favicon, apple-touch-icon, and PWA icons (192/512, maskable) from this badge.

---

## 5. Folder structure

```
videonest/
├─ app/
│  ├─ layout.tsx                 # root: fonts, ThemeProvider, TopLoader, Toaster, Analytics, Splash, header/footer shell
│  ├─ page.tsx                   # Home / platform hub
│  ├─ globals.css                # Tailwind v4 + tokens + .bg-sunset/.text-sunset
│  ├─ opengraph-image.tsx        # dynamic OG image (sunset template) — reused per route
│  ├─ icon.tsx / apple-icon.tsx  # generated icons from logo
│  ├─ manifest.ts                # PWA manifest
│  ├─ sitemap.ts / robots.ts     # via next-sitemap or native
│  ├─ not-found.tsx              # 404
│  ├─ error.tsx / global-error.tsx
│  ├─ whatsapp-status-video/page.tsx
│  ├─ how-it-works/page.tsx
│  ├─ about/page.tsx
│  ├─ privacy-policy/page.tsx
│  ├─ terms/page.tsx
│  └─ contact/page.tsx
├─ components/
│  ├─ brand/Logo.tsx, Wordmark.tsx
│  ├─ layout/Header.tsx, Footer.tsx, ThemeToggle.tsx, AppSplash.tsx
│  ├─ tool/                      # the optimizer UI
│  │  ├─ Dropzone.tsx            # react-dropzone, gradient drop area, validation
│  │  ├─ FileMeta.tsx            # shows detected resolution/duration/codec/size
│  │  ├─ ProcessingRing.tsx      # circular gradient % + step label + cancel
│  │  ├─ Preview.tsx             # before/after video compare, output stats
│  │  ├─ ShareActions.tsx        # Share-to-WhatsApp (mobile) + Download
│  │  ├─ ErrorCard.tsx           # inline error state + fallback action
│  │  └─ ToolScreen.tsx          # orchestrates the flow + Zustand state
│  ├─ platforms/PlatformGrid.tsx, PlatformTile.tsx  # hub tiles, "Coming soon"
│  ├─ marketing/Hero.tsx, Steps.tsx, FAQ.tsx, TrustNote.tsx
│  ├─ ads/AdSlot.tsx             # renders nothing unless ads enabled
│  └─ ui/                        # shadcn components (button, card, skeleton, etc.)
├─ lib/
│  ├─ config/site.ts             # reads env -> typed config (name, url, contact)
│  ├─ config/flags.ts            # feature flags from env (no-op if missing)
│  ├─ config/profiles.ts         # PLATFORM PROFILE REGISTRY (WhatsApp live + others "soon")
│  ├─ engine/                    # THE ENCODE ENGINE (see §8)
│  │  ├─ types.ts                # VideoMeta, EncodePlan, PlatformProfile, Progress
│  │  ├─ probe.ts                # extract metadata from a File
│  │  ├─ plan.ts                 # buildPlan(meta, profile) -> EncodePlan (decision tree)
│  │  ├─ encode.webcodecs.ts     # primary encoder (Mediabunny + WebCodecs)
│  │  ├─ encode.ffmpeg.ts        # ffmpeg.wasm fallback encoder
│  │  ├─ capabilities.ts         # detect WebCodecs/H.264 support -> choose path
│  │  ├─ worker.ts               # Web Worker host running the encode
│  │  └─ index.ts                # public API: optimize(file, profileId, onProgress)
│  ├─ share/share.ts             # Web Share API helpers + canShare guards
│  ├─ analytics/                 # GA/GTM init + event helpers (env-gated)
│  └─ utils/                     # formatBytes, formatDuration, cn, etc.
├─ public/                       # static icons, og fallback, ffmpeg core if self-hosted
├─ tests/                        # vitest unit tests (plan.ts decision logic, utils)
├─ .env.example
├─ next.config.ts                # headers (COOP/COEP), serwist, sentry wrapper
├─ biome.json, tsconfig.json, package.json
└─ README.md                     # setup, env, build, deploy notes
```

---

## 6. Environment variables (`.env.example`)

**Golden rule: every integration is independently optional. If its env key is absent or empty, that feature must silently disable itself and the app must work perfectly without it. No crashes, no console errors, no broken UI.**

```
# Brand
NEXT_PUBLIC_SITE_NAME=VideoNest
NEXT_PUBLIC_SITE_URL=https://videonest.pooniya.com
NEXT_PUBLIC_CONTACT_EMAIL=mahendrapuniya92@gmail.com

# Analytics (disabled if blank)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GSC_VERIFICATION=

# Ads (disabled if blank OR if flag is false)
NEXT_PUBLIC_ADS_ENABLED=false
NEXT_PUBLIC_ADSENSE_CLIENT_ID=

# Contact form provider (falls back to mailto: if blank)
NEXT_PUBLIC_FORMSPREE_ID=

# Error monitoring (disabled if blank)
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 7. Config & profile registry

- `lib/config/site.ts`: typed object built from env with sensible defaults.
- `lib/config/flags.ts`: `analyticsEnabled` (GA id present), `adsEnabled` (`NEXT_PUBLIC_ADS_ENABLED==='true'` **and** client id present), `sentryEnabled`, `contactProvider` (`'formspree' | 'mailto'`).
- `lib/config/profiles.ts`: export a `PlatformProfile[]` registry. **WhatsApp Status** is `status: 'live'` with the §3 spec encoded as data. Add `instagram-reels`, `instagram-story`, `youtube-shorts`, `youtube-long`, `facebook-video`, `facebook-story` as `status: 'soon'` placeholder objects (target specs roughly noted, `bitrateStrategy: 'overprovision'` for those) so the engine and UI are already profile-driven. The home grid and engine both read from this one registry.

```ts
type PlatformProfile = {
  id: string;
  label: string;
  status: "live" | "soon";
  icon: string;
  aspect: "9:16" | "16:9" | "source";
  maxWidth: number;
  maxHeight: number;
  maxDurationSec: number;
  fpsCap: number;
  sizeCapMB?: number;
  bitrateStrategy: "constrained" | "overprovision";
  audio: { codec: "aac"; bitrateKbps: number };
  shareHint: string; // device-specific "best way" copy
};
```

---

## 8. The encode engine (module design — describe & implement the behavior, you choose the code)

Public API (`lib/engine/index.ts`):

```ts
optimize(file: File, profileId: string, onProgress: (p: Progress) => void, signal?: AbortSignal): Promise<{ blob: Blob; meta: VideoMeta; output: OutputInfo }>
```

Flow:

1. **probe(file)** → `VideoMeta { container, vcodec, width, height, fps, durationSec, bitrate, pixfmt, hasAudio, rotation, sizeBytes }`. Use Mediabunny where possible; fall back to ffmpeg.wasm `ffprobe`-style metadata if needed.
2. **buildPlan(meta, profile)** → `EncodePlan` applying §3 rules: decide target W/H (downscale-only), fps cap, whether to blur-pad (non-9:16), whether to trim (>30s), the already-optimal fast path, bitrate/size budget, audio settings.
3. **capabilities()** → check `VideoEncoder.isConfigSupported` for H.264 (`avc1.640028`/`avc1.64002A`). Choose **WebCodecs** path if supported, else **ffmpeg.wasm** path.
4. **Run inside a Web Worker** (`worker.ts`) so the main thread stays smooth and the % updates in real time. Emit progress as `framesDone/framesTotal` (or wasm time progress). Support cancellation via `AbortSignal`.
5. **WebCodecs path** (`encode.webcodecs.ts`): demux + decode via Mediabunny, apply scale/pad via an OffscreenCanvas (for the blurred-pad case), encode H.264 with the planned config, mux to MP4 with faststart. Use the AAC encoder fallback if needed.
6. **ffmpeg.wasm path** (`encode.ffmpeg.ts`): equivalent result via an ffmpeg command implementing the same plan (scale/pad/format/x264/aac/faststart). Lazy-load the wasm core only when this path is hit.
7. **Output**: return the MP4 `Blob`, plus `OutputInfo { width, height, durationSec, sizeBytes }`. Suggested filename: `videonest-whatsapp-status.mp4`.

Error handling: every failure throws a typed `EngineError` with a `code` (`UNSUPPORTED_BROWSER`, `UNSUPPORTED_CODEC`, `OOM`, `TOO_LARGE`, `TOO_LONG`, `DECODE_FAILED`, `ENCODE_FAILED`) that the UI maps to a friendly message + fallback (see §10 error matrix). On OOM, attempt one automatic retry at a lower resolution before failing.

Unit-test `buildPlan` (`tests/`): vertical-already-optimal, horizontal-needs-pad, oversized-4K, over-30s-trim, low-res-no-upscale.

---

## 9. Pages — routes, purpose, sections, and real copy

> Use this copy. Keep it honest and warm. Headlines may use `.text-sunset` on a key phrase. Each page: proper `<title>`/meta description, canonical, OG image.

### 9.1 `/` — Home / platform hub

- **Hero:** H1 **"Post videos to WhatsApp Status — and keep them sharp."** Sub: "WhatsApp squeezes every Status video. VideoNest prepares yours so it stays crisp after the squeeze. Free, private, and it never leaves your phone." Primary CTA → `/whatsapp-status-video` ("Optimize a video"). Secondary → `/how-it-works`.
- **TrustNote** strip: "100% on-device • No upload • No sign-up • Free."
- **PlatformGrid:** tiles from the profile registry. WhatsApp Status = active (links to tool). Others = locked with a "Coming soon" badge; tapping shows a Sonner toast: "Instagram Reels support is coming soon."
- **Steps** (mini "how it works"): 1 Pick a video · 2 We optimize it on your device · 3 Share to Status or download.
- **FAQ** (accordion): "Will it look exactly like the original?" (No — WhatsApp always re-compresses; we make it as sharp as possible after that.) "Do you upload my video?" (No, everything happens in your browser.) "Is it free?" (Yes.) "Why does WhatsApp make my videos blurry?" (short explanation, link to /how-it-works.)

### 9.2 `/whatsapp-status-video` — the tool (primary screen)

- Short H1 + one-line promise. Then the `ToolScreen` flow:
  - **Idle:** `Dropzone` ("Drop a video or tap to choose • MP4, MOV, WebM, MKV, AVI").
  - **Selected:** `FileMeta` (resolution, duration, size, codec) + "Optimize" button.
  - **Processing:** `ProcessingRing` with live % + step label ("Analyzing → Optimizing → Finishing") + Cancel.
  - **Done:** `Preview` (before/after, output size & resolution) + `ShareActions`.
  - **Error:** `ErrorCard` with message + fallback.
- **"Best way" helper** near ShareActions (device-aware copy from §11).
- Honest one-liner always visible: "WhatsApp re-compresses every Status video. We can't stop that — we prepare yours so it stays as sharp as possible."
- Below the tool: a compact "how it works" + FAQ for SEO.

### 9.3 `/how-it-works`

Real explanatory article (SEO + trust): why Status looks blurry (WhatsApp re-encodes, caps ~16MB, downscales toward ≤720p), what VideoNest does (prepares a clean, correctly-sized H.264 file so WhatsApp's pass does minimal extra damage), why on-device matters (privacy + speed), and tips (upload from the WhatsApp **mobile app**, not WhatsApp Web; enable HD in WhatsApp settings). Honest, no overclaiming.

### 9.4 `/about`

Short brand story: VideoNest is a free, privacy-first toolkit that helps your videos survive social platform compression, starting with WhatsApp Status, with more platforms coming. Built for people who are tired of blurry posts.

### 9.5 `/privacy-policy` _(template — instruct user in README to have it reviewed before relying on it)_

Cover: **no video ever leaves the device** (all processing in the browser); we don't store or see user files; what analytics we use **if enabled** (GA4/GTM — anonymous usage), cookies used by analytics/ads **if enabled**; contact form data handling **if Formspree enabled**; no accounts; third-party links; children; changes; contact email. Write it so it reads correctly whether or not analytics/ads are on (use conditional, accurate language).

### 9.6 `/terms` _(template — review before relying on it)_

Standard: acceptance, description of the free service, "provided as-is" no warranty (including that we don't control WhatsApp's compression), acceptable use, IP, limitation of liability, changes, governing law placeholder, contact.

### 9.7 `/contact`

Simple form (name, email, message). If `NEXT_PUBLIC_FORMSPREE_ID` set → POST to Formspree (no `<form>`-action server needed; use fetch + handlers, per shadcn patterns). If not set → render a `mailto:` link to the contact email instead. Success/error via Sonner.

### 9.8 `not-found.tsx` + `error.tsx`

Branded 404 and error boundary with sunset accent + link home.

---

## 10. Components — responsibilities

- **Header:** logo+wordmark (home link), minimal nav (How it works, About), `ThemeToggle`. Sticky, subtle blur. `nextjs-toploader` (sunset color) mounts here/in layout.
- **Footer:** brand line + legal links (Privacy, Terms, Contact) + "© year VideoNest".
- **AppSplash:** full-screen branded loader shown on first mount (logo + sunset shimmer), fades out when the app is interactive; do not show on every navigation.
- **ThemeToggle:** light/dark via next-themes, no flash (use `suppressHydrationWarning` + script).
- **Dropzone:** drag/drop + click + paste; validates type and the §3 limits (reject >500 MB or >10 min with a **Sonner toast** explaining why); shows a thumbnail.
- **FileMeta:** human-readable detected specs.
- **ProcessingRing:** circular gradient progress (Framer Motion), big % (Geist Mono), step label, Cancel button (aborts the worker).
- **Preview:** before/after toggle or slider, plays the output Blob via object URL, shows output size/resolution and the honest note.
- **ShareActions:** `Download` (always) + `Share to WhatsApp` (only render if `navigator.canShare({files})` is true — i.e., mobile). Device-aware helper text.
- **ErrorCard + error matrix (map EngineError.code → copy + fallback):**
  - `UNSUPPORTED_BROWSER` → "Your browser can't process video here. Try Chrome or Safari, or download isn't available — open in another browser."
  - `UNSUPPORTED_CODEC` → auto-try ffmpeg.wasm; if still failing, message + suggest re-saving the video.
  - `TOO_LARGE`/`TOO_LONG` → explain limit (toast already shown at selection).
  - `OOM` → "This video was too heavy for your device — we retried smaller. If it still fails, try a shorter clip."
  - `ENCODE_FAILED`/`DECODE_FAILED` → "Something went wrong processing this video. Try a different file." + retry button.
- **PlatformTile:** active vs "Coming soon" (badge, dimmed, toast on tap).
- **AdSlot:** if `flags.adsEnabled` is false → render `null`. If true → render the AdSense unit using the client id. Loads the AdSense script conditionally on the same flag.
- **Sonner `<Toaster/>`:** top-center, rich colors, sunset-accented success.

---

## 11. UX behaviors

- **First load:** AppSplash → fade to app. **Navigation:** toploader bar fills (sunset). **Async content >300ms:** show shadcn `Skeleton` shimmer (don't flash on fast loads).
- **Processing %:** real, from the worker (frames or wasm progress) — never fake. Label clarifies it's _processing on your device_, not uploading.
- **"Best way" device-aware copy near ShareActions:**
  - Mobile + canShare: _"Tap **Share to WhatsApp**, then choose **My Status**. Quality is the same as downloading — we already optimized it."_
  - Mobile, no share: _"Tap **Download**, then post it from the WhatsApp app."_
  - Desktop: _"**Download**, then post from your phone's WhatsApp app (not WhatsApp Web — it compresses harder)."_
- All toasts top-center via Sonner. Respect reduced-motion. Everything reachable one-handed on mobile (CTAs in the thumb zone).

---

## 12. Analytics, ads, SEO (all env-gated)

- **GA4 + GTM:** mount `<GoogleAnalytics>` / `<GoogleTagManager>` from `@next/third-parties/google` in root layout **only if** their env ids exist. Add a tiny `track(event, params)` helper for key events (file_selected, optimize_started, optimize_succeeded, optimize_failed, shared, downloaded) — no-op if analytics disabled.
- **Search Console:** inject the verification `<meta>` from `NEXT_PUBLIC_GSC_VERIFICATION` if present. Generate and submit `sitemap.xml` (next-sitemap) + `robots.txt`.
- **AdSense:** fully wired but **off** (flag false). `AdSlot` renders nothing and the script doesn't load until `adsEnabled`. Place AdSlots in non-intrusive spots (e.g., below the tool, between content sections) so flipping the flag later just works.
- **SEO:** per-page Metadata API (title, description, canonical, OpenGraph, Twitter). Dynamic `opengraph-image` using the sunset template. JSON-LD: `WebApplication`/`SoftwareApplication` on the tool page, `FAQPage` where FAQs exist, `Organization` site-wide.

---

## 13. PWA

- **Serwist** service worker: precache the shell, runtime-cache static assets; the app must load and run offline (encoding is on-device anyway).
- **manifest.ts:** name/short_name from config, sunset `theme_color`/`background_color`, icons (192/512 + maskable) from the logo, `display: standalone`, `start_url: '/'`. Installable on Android, iOS, desktop. Branded splash via manifest + theme color.

---

## 14. Accessibility & performance

- WCAG AA contrast in both themes; full keyboard nav; visible focus rings (sunset); proper aria on the dropzone, progress, toggle, and tiles; `prefers-reduced-motion` honored.
- Targets: Lighthouse ≥90 across the board on the marketing pages; lazy-load ffmpeg.wasm and any heavy code; ship the engine in a worker; use `next/font`, `next/image`, route-level code splitting.

---

## 15. Definition of done (must all pass)

1. `pnpm install`, `pnpm build` complete with **zero** TS/lint/build errors; `pnpm dev` runs clean.
2. With an **empty `.env`**, the app runs fully: no analytics, no ads, contact falls back to mailto, no console errors.
3. The encode engine works end-to-end on a **real test clip**. If none is available, **generate one** (e.g. use ffmpeg to synthesize a ~40s 1080p test video, or a short colored-pattern clip) and verify: oversized/horizontal → padded 9:16 ≤30s under ~15 MB H.264 MP4 that plays; already-optimal → minimal re-encode; >30s → trimmed with toast.
4. Unit tests for `buildPlan` pass.
5. Works in Chrome (desktop+Android) and Safari; graceful fallback/message where WebCodecs is unavailable.
6. PWA installable; Lighthouse PWA + perf checks pass.
7. README documents env vars, the no-op-if-missing rule, local dev, and Vercel deploy (incl. COOP/COEP headers).

Build autonomously and fix issues until all of the above hold.

---

## 16. Build order (do in this sequence, verifying each)

1. **Scaffold:** Next.js + TS + Tailwind v4 + Biome + Husky; `next.config.ts` headers; folder structure; env + config + flags; design tokens + globals; Logo/Wordmark.
2. **Shell & UX layer:** root layout, Header/Footer/ThemeToggle, AppSplash, toploader, Sonner Toaster, Skeleton, shadcn setup.
3. **Profile registry** (§7) with WhatsApp live + others "soon".
4. **Engine** (§8) in a worker: probe → plan → capabilities → WebCodecs path → ffmpeg.wasm fallback → output; unit tests for plan.
5. **Tool screen** (§9.2, §10): dropzone → meta → processing ring → preview → share/download → error matrix; wire engine + Zustand.
6. **Remaining pages** with real copy (§9): home/hub, how-it-works, about, privacy, terms, contact, 404/error.
7. **Analytics/ads/SEO** (§12) env-gated; **PWA** (§13).
8. **A11y + perf pass** (§14); **QA against §15**; write README; final `pnpm build`.

---

## 17. Next-version roadmap (DO NOT build now — scaffold only, leave clear TODOs)

These are deferred; the architecture above (profile registry + worker engine + share adapters) must make them additive, not rewrites:

- **Server heavy-tier (v1.1):** native FFmpeg on a worker host (Fly.io/Railway) with libx264 2-pass + Cloudflare R2 storage (auto-delete), triggered only for 4K / very long / unsupported-codec sources that crash the browser; opt-in upload with explicit privacy notice. Add a real "Uploading %" path then.
- **WhatsApp auto-split (v1.1):** split >30s into sequential 30s segments instead of trimming.
- **More platforms (Waves):** flip the "soon" profiles to live one at a time, each preceded by its own spec-verification pass: Instagram Reels → Instagram Story → YouTube Shorts → Facebook Story/Reels (9:16, `overprovision` bitrate), then YouTube Long → Facebook Video (16:9, high-bitrate, server tier likely). Each needs its own share adapter + "best way" copy.
- **Cookie-consent banner:** add when analytics/ads go live (gate GA/ads behind consent).
- **Blog + FAQ pages:** for SEO and AdSense approval.
- **Native app:** wrap the PWA with Capacitor (or React Native) only after real traction — for app-store discovery and smoother share intents, not for quality gains.
- **i18n (Hindi):** keep all UI strings centralized so this is a later drop-in.

_End of specification._
