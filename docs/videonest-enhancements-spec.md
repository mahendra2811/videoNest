# VideoNest — Enhancement Build Spec (Claude Code)

> **This modifies the EXISTING VideoNest codebase — it is not a fresh build.** Respect the current architecture (`lib/engine/{index,worker,run,probe,plan,capabilities,encode.webcodecs,encode.ffmpeg,types}.ts`, `lib/config/profiles.ts`, `lib/store/tool.ts`, `components/tool/*`). Build in the phase order in §FINAL. After each item, run the build and fix all type/lint/runtime errors. Keep the prime directive intact everywhere: **we minimise WhatsApp/platform recompression damage, we never "restore" or claim "lossless."** Work autonomously; where unspecified, pick the simplest robust option consistent with the existing code.

Status tags per item: **[BUILD]** now · **[SOON]** ship as "Coming soon" placeholder only · **[BACKLOG]** document, do not build · **[SKIP]** not doing.

---

## GROUP A — Output quality / engine

### A1. Empirical measurement protocol — lock profiles to WhatsApp's *real* output **[BUILD] ★**
**What:** Stop relying on researched guesses for platform targets; measure what each platform (start with WhatsApp Status) *actually* outputs, and tune `profiles.ts` so our pre-encode lands just under the platform's real target — making the platform's re-encode as close to passthrough as possible.

**Division of labour (be honest about this):** Claude Code builds the *harness, analysis script, data schema, and profile wiring*. A human must run the actual uploads (Claude Code cannot upload to WhatsApp). Build:
- `measurement/MEASUREMENT.md` — the documented procedure and the test-clip matrix:
  - Resolution ladder: 2160p, 1440p, 1080p, 720p, 480p.
  - Frame rates: 24, 30, 60 fps.
  - Aspect: 9:16, 16:9, 1:1.
  - Content: high-motion, static/detail, dark/gradient (banding test).
  - Dynamic range: SDR and HDR/10-bit.
  - Duration: ~10s and ~29s (near the cap).
  - Devices: real Android + real iOS, both Standard and **HD** upload settings.
  - Procedure: upload each to Status → download the served copy (status-saver) → run the analysis script.
- `measurement/analyze.mjs` — a Node script that runs `ffprobe -show_streams -show_format` on each downloaded file and emits a normalized JSON row: `{ inputSpec, outputWidth, outputHeight, outputFps, vBitrate, vCodec, profile, level, pixFmt, aBitrate, aCodec, container, sizeBytes }`.
- `measurement/results.sample.json` — schema + one filled example so the human knows the shape to paste back.

**Profile wiring:** extend `PlatformProfile` in `lib/config/profiles.ts` with: `measuredOutput?: { width; height; fps; vBitrate; vCodec; profile; pixFmt; aBitrate }`, plus existing `lastVerified`, `sourceUrl`, `confidence`. `buildPlan()` should prefer `measuredOutput` when present (target ~5–8% under measured bitrate, match measured resolution/fps exactly) and fall back to the researched values otherwise.

**Acceptance:** harness + script + docs exist and run on a local folder of clips; `profiles.ts` reads `measuredOutput` when present; `MEASUREMENT.md` clearly states the human-run steps.

### A2. Profile freshness / re-verification cadence **[BUILD] ★**
**What:** Never go stale the way competitors did when WhatsApp silently changed parameters.
**Build:**
- A `confidence` + `lastVerified` (ISO date) on every profile (already partially present — make mandatory).
- A dev-time check (`lib/config/profiles.ts` or a small test) that logs a warning when any profile's `lastVerified` is older than 90 days.
- A subtle UI surfacing: on the tool/about page, a small line like "WhatsApp profile last verified {date}" using `lastVerified` — honest, builds trust, and reminds you.
- A `CONTRIBUTING`/`MEASUREMENT.md` note: re-run A1 quarterly and on any reported quality regression.

**Acceptance:** stale profiles warn in dev; `lastVerified` renders somewhere user-visible and unobtrusive.

### A3. YouTube over-provision path **[BUILD]**
**What:** YouTube *rewards* a high-bitrate, high-res source (its encoder has more signal to preserve) — the opposite of WhatsApp. Implement per-platform asymmetry properly.
**Behavior (YouTube + Shorts profiles only):**
- Allow **4K/1440p passthrough** — do NOT downscale YouTube uploads to 1080p; keep source resolution up to 2160p (downscale only if above).
- Raise the over-provision bitrate for YouTube (1080p ~12–16 Mbps; 1440p/4K per the over-provision formula, higher clamp).
- Add an **optional codec choice for YouTube only:** H.264 (default) or **AV1/HEVC**, gated on `VideoEncoder.isConfigSupported`; if unsupported, silently fall back to H.264.
- Use a **~1s closed GOP** for the YouTube profile (vs 2s elsewhere).
- Expose a small "YouTube quality" selector in the UI for that profile: `1080p · 1440p · 4K (if source allows)`.

**Integration:** `buildPlan()` branch on `profile.bitrateStrategy === 'overprovision'` + `profile.id` for YouTube specifics; `profiles.ts` adds `allowUpscaleToSourceRes:true` (passthrough), `codecOptions`, `gopSec:1`.
**Acceptance:** a 4K source targeting YouTube stays 4K (or 1440p) with high bitrate; AV1 used when supported, else H.264; 1080p WhatsApp path unchanged.

### A4. IG / WhatsApp / FB — exact 1080×1920, high-quality downscale **[BUILD]**
**What:** These platforms cap at 1080p with a low-quality internal downscaler, so we must hand them exactly 1080×1920 (or 1080×1350 / 1080×1080 per aspect) using a *good* resampler — never feed them 4K.
**Behavior:** for `bitrateStrategy === 'constrained'` and IG/FB profiles: cap target at 1080 on the long edge; downscale with **Lanczos** — ffmpeg path `scale=...:flags=lanczos`; WebCodecs/OffscreenCanvas path set `imageSmoothingEnabled=true; imageSmoothingQuality='high'` and prefer stepped halving for large ratios to reduce aliasing. Never pass a >1080p frame to these platforms.
**Acceptance:** a 4K source to WhatsApp/IG/FB is downscaled by us to exactly 1080-class with Lanczos; no 4K ever sent to these platforms.

### A5. Sharpen — manual toggle (default OFF) **[BUILD]**
**What:** Pre-sharpening usually backfires under recompression, so it stays **off by default**, but the user may opt in.
**Behavior:** add a `sharpen: boolean` option (default false) in the optimize controls, labelled honestly: "Light sharpen (optional — can add artifacts after the platform recompresses)." When on, apply a *light* unsharp mask before encode — ffmpeg `unsharp=5:5:0.4:5:5:0.0`; WebCodecs/canvas path a mild convolution or a single-pass sharpen shader. Keep the strength conservative and fixed (no aggressive slider).
**Integration:** `EncodePlan` gains `sharpen`; both encoders honor it; UI toggle in `ToolScreen` controls.
**Acceptance:** off by default; when toggled on, output is mildly sharpened; copy clearly frames it as optional.

### A6. Audio — drop default loudness-normalize; raise YouTube audio **[BUILD]**
**What:** All target platforms normalize loudness themselves, so normalizing again is redundant/harmful; keep it opt-in. YouTube source audio should be higher bitrate.
**Behavior:**
- Remove any default `loudnorm`. Add an optional "Normalize loudness (−14 LUFS)" toggle, default off, using `loudnorm=I=-14:TP=-1.5:LRA=11` when on.
- Raise per-profile AAC: YouTube/Shorts long-form → 256–384 kbps; short-form vertical (WhatsApp/IG/FB Story) → keep 128k; allow mono for silent-ish/voice WhatsApp clips to save the size budget.
**Integration:** `profiles.ts` audio kbps per profile; `buildPlan` audio block; both encoders.
**Acceptance:** no loudness change unless toggled; YouTube audio at higher bitrate.

### A7. AI "enhance low-quality video" (super-resolution / deblur) **[SOON]**
**What:** The one gap competitors refuse to fill — genuinely improving a *low-quality* source before upload. **Do NOT build now.** Add a visible **"Coming soon: AI Enhance"** entry/badge in the UI (disabled tile or a labeled toggle that's inert) so the roadmap is visible.
**Planned approach (document in code comment / roadmap only):** on-device super-resolution/deblur via an ONNX model (Real-ESRGAN-class) run with ONNX Runtime Web + WebGPU, opt-in, with a model-download progress step, clearly labelled "changes the footage." Heavy; v2; likely paired with the server tier (A/§F) for big jobs.
**Acceptance:** a "Coming soon — AI Enhance" affordance is present and clearly inert; no model is shipped.

---

## GROUP B — Editing (close the biggest gap vs PureStatus / InShot)

> Add an optional **Edit** step in `ToolScreen` between "selected" and "processing". All edits are composited in the existing OffscreenCanvas pipeline (WebCodecs path) and mirrored with ffmpeg filters in the fallback path. Editing is optional — users who just want optimisation skip it.

### B1. Trim + manual crop/frame **[BUILD] ★** (this is items 4 & 8 combined — the manual aspect decision lives here)
**What:** Let the user trim the clip and choose how an off-aspect source fits the target.
**Behavior:**
- **Trim:** a timeline scrubber with in/out handles (reuse a lightweight waveform/film-strip); sets `trim:{start,end}` already supported by the engine.
- **Aspect decision (MANUAL — replaces auto-only):** when `probe` detects source aspect ≠ target aspect, present two clearly-previewed choices:
  - **Fit** → blur-pad (sharp source contained over a blurred cover copy). Default.
  - **Fill** → crop to fill the frame (with a draggable crop box to choose the region).
  Show a live thumbnail of each so the user sees the difference before deciding.
- A manual **crop box** is also available even when aspects match (user may want to reframe).
**Integration:** `buildPlan` takes `aspectMode: 'fit' | 'fill'` and an optional `cropRect`; `encode.webcodecs.ts` compositor and `encode.ffmpeg.ts` filtergraph branch on it (`crop=` for fill, existing blur-pad for fit).
**Acceptance:** off-aspect sources prompt a Fit/Fill choice with previews; trim works; chosen mode flows through both encoders.

### B2. Text / caption / title overlay **[BUILD]**
**What:** Add text layers to the video.
**Behavior:** add/move/resize text; controls for font (ship 4–6 web-safe/bundled fonts), size, color, alignment, optional semi-opaque background pill and shadow for legibility. Positioned by drag on a preview canvas. Composited per-frame on the OffscreenCanvas (WebCodecs) and via ffmpeg `drawtext` (fallback). Store as `overlays: TextLayer[]` in the edit state.
**Acceptance:** text renders burned-in on the output, correct position/scale at the target resolution, legible on both light/dark footage.

### B3. Background music / replace audio **[BUILD]**
**What:** Add or replace the audio track.
**Behavior:** user adds an audio file; choose **Replace** original or **Mix under** it (with a volume slider for the added track and optional duck of original). Trim the music to clip length; fade in/out option. WebCodecs path: decode + mix via OfflineAudioContext before mux; fallback: ffmpeg `amix`/`-map` with volume. Respect `-shortest`.
**Acceptance:** output carries the chosen audio (replaced or mixed) at correct levels, length-matched.

### B4. Stickers & emoji overlay **[BUILD]**
**What:** Overlay stickers/emoji/PNGs.
**Behavior:** a small bundled sticker set + emoji picker; place/scale/rotate on the preview; composited like text layers (`overlays` extended with `ImageLayer`). Keep the set small and licensed/owned.
**Acceptance:** stickers burn into the output at correct transform.

### B5. Explicit before/after A-B compare **[BUILD]**
**What:** Upgrade `Preview` to a clear A-B comparison of original vs optimized.
**Behavior:** a labelled toggle or draggable split slider playing the original blob vs the optimized blob (object URLs), synced playback, with the output stats shown (see C3). Make it obvious which is which.
**Acceptance:** users can directly A-B the source and the result in-app.

### B6. "Compare on your Status" quality test **[BUILD]**
**What:** Competitors push the trick of posting both versions to prove the difference; give a guided version.
**Behavior:** an optional CTA that exports **both** the optimized file and a same-size naive re-encode (or the trimmed original), with copy guiding the user to post both to Status and judge — framed honestly ("see the difference WhatsApp's compression makes on an unoptimised vs optimised file"). No overclaiming.
**Acceptance:** the flow can produce both files + share/download for each.

---

## GROUP C — Trust, honesty & share UX

### C1. Honest messaging everywhere **[BUILD]**
Standardize the honest copy in `lib/strings.ts`: never "lossless"/"restore"; always "we prepare your video so the platform's own compression does the least damage." Audit hero, tool pages, FAQ, meta descriptions.
**Acceptance:** no "lossless"/"no quality loss" anywhere; consistent honest framing.

### C2. Device-aware share helper **[BUILD]**
Keep/expand the per-device guidance near `ShareActions`: mobile → Web Share to the chosen app + "pick My Status"; desktop → download + "post from the mobile app, not Web (it compresses harder)"; per-platform hints (e.g. enable WhatsApp HD upload).
**Acceptance:** correct guidance shown per device + per target platform.

### C3. Output stats (before/after) **[BUILD]**
In `ResultPanel`/`Preview`, show original vs output: resolution, duration, file size, and (where known) bitrate. Use Geist Mono for numbers.
**Acceptance:** before/after stats visible on every result.

### C4. One-tap Web Share **[BUILD]**
Keep/polish `navigator.share({files})` with `canShare` guard (mobile only); hide on desktop; per-platform target hint. (Already present — verify and refine.)
**Acceptance:** share hands the optimized file to the OS share sheet on mobile; download fallback elsewhere.

---

## GROUP D — Discovery & growth

### D1. Per-platform SEO landing pages **[BUILD] ★**
**What:** A dedicated, indexable page per platform that *is* the tool for that platform, with keyword-true metadata.
**Behavior:** routes like `/whatsapp-status-video`, `/instagram-reels-video`, `/instagram-story-video`, `/youtube-shorts-video`, `/youtube-video`, `/facebook-video`, `/facebook-story-video`. Each: targeted `<title>`/description, canonical, `SoftwareApplication` + `FAQPage` JSON-LD, the optimizer pre-set to that platform's profile, and honest "why your X looks blurry / how to keep it sharp" copy. Home remains the hub.
**Acceptance:** each platform has its own SEO page wired to its profile; sitemap includes them.

### D2. Blog / guides system **[BUILD]**
**What:** An MDX-based blog for honest, search-friendly guides ("Why is my WhatsApp status blurry," "Best settings to post HD Reels," etc.).
**Behavior:** `/blog` index + `/blog/[slug]` MDX posts, with metadata, OG images, `Article`/`FAQPage` JSON-LD, and a few seed posts. Structured so posts are translatable (see D3).
**Acceptance:** blog renders, is indexed (sitemap), and supports localized posts.

### D3. Multi-language — app + blog **[BUILD] ★ (BIG)**
**What:** Localize the entire UI *and* the blog. Start with **English + Hindi**, architected for many more.
**Behavior:**
- i18n with **next-intl**, locale-prefixed routing (`/`, `/hi`, … with `en` as default/unprefixed or `/en`), all UI strings already centralized in `lib/strings.ts` → move to per-locale message catalogs.
- Localized `<title>`/descriptions and **hreflang** alternates on every page for SEO.
- Blog posts authored per-locale (MDX per language); fall back to English if a translation is missing.
- Locale switcher in the header/More menu; persist choice.
- RTL-readiness in layout (logical CSS properties) even if first languages are LTR.
- Localized sitemap entries per locale.
**Acceptance:** full UI + at least the seed blog posts available in English and Hindi; hreflang correct; adding a new language = adding a catalog (+ translated posts), no refactor.

### D4. Native app (Capacitor) **[SKIP — v2]**
Not now. Leave a note in the roadmap: wrap the PWA with Capacitor for Play Store / App Store presence in a later v2 (discovery, not quality). Do not build.

---

## GROUP E — Retention & convenience

### E1. Favourites + recently-used **[BUILD]**
**What:** Let users favourite platforms/tools and see recently used ones.
**Behavior:** `lib/store/favourites.ts` (Zustand + localStorage): favourite a platform/target (heart), and track **recently used platforms** (last N with timestamp). Surface both on the home hub ("Favourites", "Recently used") and as quick-access chips on the tool screen. No accounts; private; clearable.
**Acceptance:** favourites + recents persist across reloads and appear on home.

### E2. Batch processing **[SKIP]**
Not doing. (No multi-file queue.)

### E3. Remember last platform / presets **[BUILD]**
**What:** Persist the user's last-used platform and last-used options (sharpen, aspect mode, audio settings) so repeat use is one tap.
**Behavior:** store last platform + last `EncodePlan`-relevant options in localStorage; pre-select on next visit.
**Acceptance:** reopening the app pre-selects the last platform + remembered options.

### E4. PWA install + offline **[BUILD]**
Keep Serwist + manifest; add an install prompt; ensure offline operation (processing is on-device). (Mostly present — verify.)
**Acceptance:** installable on Android/iOS/desktop; works offline.

---

## GROUP F — Reliability

### F1. Server heavy-tier (4K / long / unsupported) **[BACKLOG]**
**What:** A dormant, opt-in native-FFmpeg server tier for sources too heavy for the browser. **Document the design, do NOT build now.** Put it on the roadmap with: trigger conditions (probe shows >1080p AND >~5 min, or a codec WebCodecs can't handle, or repeated OOM), explicit user opt-in upload with a privacy notice, native FFmpeg (libx264/AV1, 2-pass), auto-delete storage. Keep VideoNest fully client-side by default.
**Acceptance:** a clear roadmap/design note exists; nothing server-side is wired.

### F2. Cross-device QA matrix **[BUILD]**
**What:** A documented test matrix + checklist so quality/perf is verified across the field.
**Behavior:** `QA.md` listing devices/browsers (Chrome desktop, Chrome Android incl. low-RAM, iOS Safari, Samsung Internet) × inputs (HDR/10-bit, rotated, VFR, 4K, >30s, no-audio, exotic codec) × expected behavior (correct output or graceful fallback). Add unit tests for `buildPlan` covering: aspectMode fit/fill, YouTube passthrough, IG/WA/FB 1080 cap, sharpen on/off, audio normalize on/off, fast-path remux, segment split.
**Acceptance:** `QA.md` exists; the listed `buildPlan` unit tests pass.

---

## GROUP G — Monetization

### G1. Ads — env-gated, OFF now **[BUILD]**
Keep the existing env-gated AdSense plumbing: `AdSlot` renders nothing while `NEXT_PUBLIC_ADS_ENABLED` is false/absent; non-intrusive placements (below the tool, between sections). Core stays free, **no watermark, ever**.
**Acceptance:** ads invisible by default; flip the env flag to enable later with no code change.

### G2. Optional premium tier (future) **[BUILD — scaffold only]**
**What:** Scaffold a feature-flag for a *future* premium tier (e.g. AI Enhance, 4K server jobs) WITHOUT activating it or gating any current feature. Core optimisation, all platforms, no-watermark remain free forever.
**Behavior:** an env/flag `NEXT_PUBLIC_PREMIUM_ENABLED` (default false) and a typed `isPremiumFeature()` helper that currently gates nothing. No paywall UI in v1.
**Acceptance:** flag exists and is off; nothing is paywalled; core stays free/no-watermark.

---

## GROUP H — Platform expansion

### H1. Ship all platforms, one at a time, each measured **[BUILD] ★**
**What:** Bring every platform profile to "live" — WhatsApp Status, Instagram Reels, Instagram Story, YouTube, YouTube Shorts, Facebook Video, Facebook Story — each backed by the A1 measurement before flipping it on. This is the biggest open opportunity (no dedicated competitor apps outside WhatsApp).
**Behavior:** each platform = a verified `PlatformProfile` (aspect, max W/H, duration, fps cap, size cap, bitrate strategy, gopSec, audio, `measuredOutput`, `lastVerified`) + its SEO page (D1) + correct share hand-off (C2). Roll out sequentially; never ship a platform whose profile is unmeasured/low-confidence — mark such ones "beta".
**Acceptance:** all seven profiles present and correct; each live one has `lastVerified` set; SEO page + share guidance wired per platform.

---

## FINAL — Build order (do in sequence, verify each)

1. **Engine correctness first:** A4 (1080 cap + Lanczos), A5 (sharpen toggle), A6 (audio), A3 (YouTube over-provision) — pure `buildPlan`/`profiles.ts`/encoder changes + their unit tests (F2 tests).
2. **Measurement + freshness:** A1 (harness/script/docs + `measuredOutput` wiring), A2 (cadence + `lastVerified` UI).
3. **Editing step:** B1 (trim + manual Fit/Fill + crop) ← highest-value gap, then B5 (A-B compare), B2 (text), B3 (audio/music), B4 (stickers), B6 (compare-on-status).
4. **Trust/UX:** C1–C4.
5. **Retention:** E1 (favourites/recents), E3 (remember last), E4 (PWA verify).
6. **Discovery:** D1 (per-platform SEO pages), D2 (blog), then **D3 (multi-language, app + blog)** — big, do after structure is stable.
7. **Expansion:** H1 (verify + ship all platform profiles, each measured).
8. **Reliability/monetization scaffolding:** F2 (QA.md + tests), G1 (ads off), G2 (premium flag off).
9. **Placeholders/roadmap:** A7 ("Coming soon: AI Enhance" inert), F1 (server-tier design note), D4 (Capacitor v2 note).

**Definition of done:** build passes with zero errors; all `buildPlan` unit tests pass; off-aspect sources prompt Fit/Fill; sharpen/audio-normalize are off-by-default toggles; YouTube keeps high-res/high-bitrate while WhatsApp/IG/FB are capped at 1080 via Lanczos; favourites/recents + last-platform persist; per-platform SEO pages live; UI + seed blog available in English + Hindi with hreflang; ads invisible by default; no feature paywalled; "Coming soon: AI Enhance" present and inert. Honest framing throughout — no "lossless" claims.

*End of enhancement spec.*
