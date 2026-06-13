# VideoNest — functionality & the post-input pipeline

> What this project is, the functionality we use to keep videos sharp, and —
> the focus of this doc — **exactly what happens, step by step, after a user
> hands us a video.**

---

## 1. What VideoNest is

VideoNest is a **mobile-first, 100% client-side web app** that re-encodes a
user's video — **entirely on their device, nothing uploaded** — into the
cleanest possible file for a chosen social platform (WhatsApp Status, Instagram
Reels/Story, YouTube/Shorts, Facebook Video/Story).

**The honest premise (the whole reason the app exists):** every platform
*re-compresses* what you upload — we can't stop that. So we don't "restore" or
"fix" quality and we never claim "lossless." Instead we hand the platform an
**optimally-prepared source** so its own re-encode does the **least possible
extra damage**, and the posted video stays as sharp as possible.

So "clarity" here = giving the platform's encoder a clean, correctly-shaped,
correctly-bitrated, compatible file to start from.

---

## 2. The functionality we use to achieve clarity

| Concern | What we do | Tech |
| --- | --- | --- |
| Run on-device, no upload | Whole pipeline in a **Web Worker** | WebCodecs, OffscreenCanvas |
| Read the source | Probe metadata (dims, fps, duration, rotation, HDR, audio) | **Mediabunny** |
| Decide the output | Pure decision tree `buildPlan()` per platform profile | own code |
| Primary encode | Demux/decode/scale/pad/encode → faststart MP4 | **Mediabunny `Conversion` + WebCodecs (H.264)** |
| Fallback encode | When WebCodecs H.264 is unavailable/fails | **ffmpeg.wasm** (self-hosted, single-thread) |
| Right shape | Downscale-only to the platform box; **blur-pad** off-aspect sources | OffscreenCanvas compositor |
| Right format | H.264 High / yuv420p / MP4 / faststart / **CFR** / 2s (or 1s) closed GOP | encoder config |
| Right bitrate | Constrained (size-capped) vs over-provision (quality-first), per platform | `buildPlan` |
| Correct orientation | **Bake rotation into pixels** (don't trust metadata) | `allowRotationMetadata:false` / canvas |
| Correct color | **HDR/10-bit → SDR** tone-map via 2D canvas | OffscreenCanvas |
| Long clips | **Auto-split** WhatsApp >30s into sequential parts | `computeSegments()` |
| Resilience | One **OOM retry** at lower res, then ffmpeg fallback | `run.ts` orchestration |
| Output & share | Preview (before/after), Web Share / download | Web Share API |

Each platform's exact targets live in **one registry**:
`lib/config/profiles.ts` (`PLATFORM_PROFILES`) — aspect, max W/H, max duration,
fps cap, size cap, bitrate strategy, per-profile `bitratePerPixel` / `gopSec` /
`maxBitrate`, audio kbps, and `lastVerified`/`sourceUrl`/`confidence`.

---

## 3. The pipeline — what happens AFTER a video is given

Entry point: `optimize(file, profileId, onProgress, signal)`
(`lib/engine/index.ts`) spawns a short-lived **Web Worker**
(`lib/engine/worker.ts`), which calls **`runOptimize()`** (`lib/engine/run.ts`).
Everything below runs off the main thread; progress is real, never faked.

```
File ─▶ probe ─▶ buildPlan ─▶ capabilities ─▶ [segment loop] ─▶ encode ─▶ output(s)
        (meta)   (EncodePlan)  (WebCodecs?)     (1..N windows)   (WC│ffmpeg)  Blob[]
```

### Step 0 — Guards (`run.ts`)
- Reject `> 500 MB` → `TOO_LARGE`; `> 10 min` → `TOO_LONG`.
- `onProgress({stage:'analyzing'})`.

### Step 1 — `probe(file)` (`lib/engine/probe.ts`, via Mediabunny)
Reads the source `File` and returns `VideoMeta`:
- `container`, `vcodec`, `width`/`height` (**display** dims — already
  rotation-adjusted), `fps` (estimated from packet stats), `durationSec`,
  `rotation`, `hasAudio`, **`isHdr`** (`hasHighDynamicRange()`), `sizeBytes`.

### Step 2 — `buildPlan(meta, profile)` (`lib/engine/plan.ts`, pure & unit-tested)
The decision tree that turns "this source + this platform" into concrete encode
parameters (`EncodePlan`):
1. **Duration:** if longer than the profile's `maxDurationSec` → either mark for
   **split** (WhatsApp, `splitOversize`) or **trim**.
2. **Frame rate:** cap at the profile's `fpsCap` (leave lower rates alone).
3. **Resolution / aspect:**
   - Source aspect matches the target → **downscale-only** to fit the box (never
     upscale), even dimensions.
   - Doesn't match → **blur-pad**: target box is the canvas; the source is drawn
     "contained" on a blurred, scaled "cover" copy of itself.
4. **Bitrate:**
   - **Constrained** (WhatsApp): fill the size budget (`sizeCap·8·0.92 /
     duration − audio`), capped ~10 Mbps.
   - **Over-provision** (others): `targetW·targetH·fps · bitratePerPixel`,
     clamped to `[4 Mbps, maxBitrate]`, then capped by any stated size budget.
5. **GOP:** `profile.gopSec ?? 2` seconds, closed.
6. **Fast path:** if the source is already optimal (H.264, ~yuv420p, fits the
   box, fps OK, right aspect, not over-duration, under size cap, **not HDR**) →
   plan a **remux** (no re-encode — never double-degrade a good file).
7. **Audio:** AAC-LC @ 48 kHz, per-profile kbps (or none if the source is silent).

### Step 3 — `canUseWebCodecs(plan)` (`lib/engine/capabilities.ts`)
Probes `VideoEncoder.isConfigSupported` for H.264. Chooses the **WebCodecs** path
if supported, else the **ffmpeg.wasm** path.

### Step 4 — Segment loop (`run.ts`)
If splitting: `computeSegments(duration, maxDurationSec)` → N windows
(`{start,end}`). Each window gets its own plan (`trim` window, fast-path
disabled) and contributes its slice of the progress bar. Otherwise: one pass.

### Step 5 — Encode each segment — `encodeWithFallback()`
**A. Primary — WebCodecs via Mediabunny (`encode.webcodecs.ts`)**
`Mediabunny.Conversion` with `Input(BlobSource)` → `Output(Mp4OutputFormat
{ fastStart:'in-memory' }, BufferTarget)`. Video options depend on the plan:
- **Fast path:** `forceTranscode:false` → copy/remux the H.264 track.
- **Blur-pad:** a `process` callback composites each frame onto an
  `OffscreenCanvas` (blurred cover bg + sharp contained fg). Because the canvas
  is 2D/SDR, this **also tone-maps HDR → SDR**.
- **Scale:** `width/height/fit` for plain downscale; for **HDR** sources, route
  through an SDR canvas `process` instead so the browser tone-maps to SDR.
- Always: `codec:'avc'`, `bitrate`, `keyFrameInterval`, `forceTranscode:true`,
  **`allowRotationMetadata:false`** (bake rotation into pixels), **`frameRate`**
  (force **CFR**), and `trim:{start,end}` for segments.
- Audio: AAC; if the browser lacks native AAC encode, register
  `@mediabunny/aac-encoder`.
- **OOM retry:** on a memory error, `reducePlan()` (×0.7 dims, ×0.6 bitrate) and
  retry once, then fall through to ffmpeg.

**B. Fallback — ffmpeg.wasm (`encode.ffmpeg.ts`, lazy-loaded)**
Self-hosted single-thread core in `public/ffmpeg/`. Builds the equivalent:
`-vf` scale or blur-pad filtergraph, `-r fps` (CFR), `libx264 -profile:v high
-pix_fmt yuv420p -crf 20 -maxrate -bufsize -g <gop> -c:a aac -movflags
+faststart`, `-ss/-t` for the segment window. ffmpeg auto-rotates (bakes
rotation). Used when WebCodecs is unsupported, or for sources WebCodecs can't
handle.

### Step 6 — Output
Each segment yields an MP4 `Blob` + `OutputInfo {width, height, durationSec,
sizeBytes, filename}` (`videonest-<platform>.mp4`, or `…-partNofM.mp4` when
split). `runOptimize` returns `OptimizeResult[]`; progress ends at `finishing`.

### Step 7 — Back on the main thread (UI)
`ToolScreen.tsx` (state in `lib/store/tool.ts`, Zustand) calls `setDone(results)`
and renders:
- **`Preview`** — before/after toggle playing the original vs optimized blob
  (object URLs).
- **`ShareActions`** — Web Share API (`navigator.share({files})`) on mobile, or
  Download; device-aware copy.
- **`SegmentResults`** — for multi-part outputs, each part with its own
  preview + share + a "Download all" action.
- If the tab was backgrounded during encode, a **local notification** ("your
  video is ready").

---

## 4. Files involved (quick map)

```
lib/engine/
  index.ts            optimize() / probeFile() — spawn the worker (public API)
  worker.ts           Web Worker message host (optimize / probe / cancel)
  run.ts              orchestration: guards → probe → plan → segments → encode
  probe.ts            Mediabunny metadata read  → VideoMeta (incl. isHdr, rotation)
  plan.ts             buildPlan() decision tree + computeSegments()  (pure, tested)
  capabilities.ts     WebCodecs H.264 support check
  encode.webcodecs.ts primary encoder (Mediabunny Conversion + OffscreenCanvas)
  encode.ffmpeg.ts    ffmpeg.wasm fallback encoder
  types.ts            VideoMeta, EncodePlan, PlatformProfile, OptimizeResult, …
lib/config/profiles.ts   per-platform targets (single source of truth)
lib/store/tool.ts        UI state machine (idle→selected→processing→done→error)
components/tool/         Dropzone, ProcessingRing, Preview, ShareActions, SegmentResults
```

---

## 5. The "clarity" levers, in one line each
- **Right shape** — 9:16 / 16:9, downscale-only, blur-pad off-aspect (no stretch).
- **Right container/codec** — MP4 / H.264 High / yuv420p / faststart.
- **Right bitrate** — generous (over-provision) or size-capped (WhatsApp), tuned per platform.
- **Smooth + seekable** — capped fps, **CFR**, 2s (1s for YouTube) closed GOP.
- **Correct orientation & color** — baked rotation, HDR→SDR tone-map.
- **No double-degrade** — remux already-optimal sources; never upscale.

That combination is what survives the platform's own re-compression and keeps
the posted video sharp.
