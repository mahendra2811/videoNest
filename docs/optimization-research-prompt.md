# Research brief: optimizing VideoNest's video-preparation engine

> Paste this whole document into a research-capable AI agent. It already knows
> nothing about my project — everything it needs is below. I want **deep,
> sourced research** (cite sources/dates) on how to make my video-optimization
> functionality better, not a rewrite of my UI (the UI is finished).

---

## 1. What VideoNest is (the honest goal)

VideoNest is a **mobile-first, 100% client-side web app** (Next.js, runs the
encode in a Web Worker — nothing is uploaded by default). A user drops in a
video, picks a destination platform, and we re-encode it **on their device**
into the cleanest possible file for that platform.

**The core premise (be precise about this):** every social platform
*re-compresses* what you upload — we cannot prevent that. Our job is to feed the
platform an **optimally-prepared source** so that *its own* re-encode does the
**least possible extra damage**, and the posted video stays as sharp as
possible. We never claim "no quality loss" or "lossless." So the real research
question is: **given that the destination will re-encode my file, what is the
provably-best source file to hand it?**

Supported destinations today: WhatsApp Status, Instagram Reels, Instagram Story,
YouTube, YouTube Shorts, Facebook Video, Facebook Story.

---

## 2. How it currently works (architecture)

Pipeline (all in a Web Worker):

1. **probe** — read metadata (container, codec, width/height, fps, duration,
   rotation, hasAudio, size) via the Mediabunny JS library.
2. **buildPlan(meta, profile)** — a pure decision tree that produces the encode
   parameters (target W/H, fps, bitrate, trim/split, blur-pad, fast-path).
3. **capabilities** — check `VideoEncoder.isConfigSupported` for H.264.
4. **encode**:
   - **Primary:** WebCodecs via Mediabunny `Conversion` (H.264/`avc`), with an
     `OffscreenCanvas` compositor for the blurred-pad case, MP4 `fastStart:
     'in-memory'`.
   - **Fallback:** ffmpeg.wasm (self-hosted **single-threaded** core, so no
     SharedArrayBuffer needed) when WebCodecs H.264 is unavailable or fails.
5. **orchestration** — one automatic **OOM retry at lower resolution**, then the
   ffmpeg fallback. Long WhatsApp clips are **split into sequential segments**.

Encode parameters currently used:

- Container **MP4**, faststart (moov at front).
- Video **H.264 High / yuv420p**; **2-second closed GOP** (keyint = 2×fps).
- **Downscale-only** (never upscale) to the platform box.
- **Blur-pad** for non-matching aspect ratios: a blurred, scaled "cover" copy of
  the video as the background, with the sharp source "contained" on top.
- **Already-optimal fast path**: if the source already matches the profile
  (H.264, ≤ box, ≤ fps, right aspect, under size cap), remux instead of
  re-encoding (avoid double-degrading).
- **Bitrate**:
  - *Constrained* (WhatsApp): fill a size budget — `bitrate ≈ sizeCap*8*0.92 /
    duration − audio`, clamped to a ~10 Mbps ceiling and ~0.8 Mbps floor.
  - *Overprovision* (others): `~targetW*targetH*fps*0.1`, clamped to
    [4, 20] Mbps, but capped by the platform's stated size limit if any.
- ffmpeg path specifics: `libx264 -profile:v high -pix_fmt yuv420p -preset
  veryfast -crf 20 -maxrate <b> -bufsize <2b> -g <2*fps> -c:a aac -movflags
  +faststart`.
- Audio **AAC-LC**, 48 kHz, 128–256 kbps depending on platform. **No loudness
  normalization** currently.
- **No denoise/sharpen filters** currently (hidden/reserved).
- Hard input limits: **500 MB / 10 minutes**.

Per-platform profiles (the single source of truth — already centralized):

| Platform | Aspect | Max res | Max dur | FPS cap | Size cap | Bitrate strategy | Audio |
|---|---|---|---|---|---|---|---|
| WhatsApp Status | 9:16 | 1080×1920 | 30s (auto-split) | 30 | ~15 MB | constrained | 128k |
| Instagram Reels | 9:16 | 1080×1920 | 90s | 30 | 100 MB | overprovision | 128k |
| Instagram Story | 9:16 | 1080×1920 | 60s | 30 | 100 MB | overprovision | 128k |
| YouTube Shorts | 9:16 | 1080×1920 | 60s | 60 | 256 MB | overprovision | 192k |
| YouTube (long) | 16:9 | 1920×1080 | 10min | 60 | none | overprovision | 256k |
| Facebook Video | 16:9 | 1920×1080 | 10min | 30 | none | overprovision | 192k |
| Facebook Story | 9:16 | 1080×1920 | 60s | 30 | 100 MB | overprovision | 128k |

There is also an **optional, dormant server tier** (Vercel Blob upload +
serverless ffmpeg) for sources too heavy for the browser — off by default.

---

## 3. What I want you to research (deep, with sources + dates)

### A. The central encoding question
- Given that each platform **re-encodes on upload**, what is the
  empirically-best *source* to hand it to maximize final on-platform quality?
- Specifically settle this trade-off: **match the platform's known target
  resolution/bitrate** vs **over-provision** (upload higher bitrate/resolution
  so the platform's encoder has more signal to preserve). What does evidence
  show per platform?
- Is **constrained VBR (CRF + maxrate)** the right approach, or should I use
  **2-pass**, **CRF-only**, **capped-CRF**, or **per-title/“per-scene”** encoding
  for a quality/size win? Quantify if possible.
- Optimal **GOP / keyframe** and **B-frame / reference-frame** settings for
  re-upload survival.

### B. Codec & encoder choice
- Should I offer **H.265/HEVC, VP9, or AV1** for platforms that accept them
  (e.g., YouTube), or is H.264 still the safest universal upload? Per-platform
  answer.
- **WebCodecs (hardware encoder) vs libx264 (software)**: hardware H.264 is fast
  but typically **lower quality per bitrate** than x264. Is the quality gap big
  enough that I should prefer software x264 (ffmpeg.wasm / a future wasm x264)
  even though it's slower? Any benchmarks?
- Is a **multi-threaded ffmpeg.wasm core** (SharedArrayBuffer, needs
  COOP/COEP — which I already set) worth the complexity over single-thread?

### C. Pre-processing filters
- Does **light pre-sharpening / contrast / denoise** measurably help a video
  *survive* a platform's re-compression, or does it backfire? Evidence?
- Best practice for **blur-pad vs letterbox vs crop** when the source aspect
  doesn't match (I use blur-pad).
- **HDR → SDR tone-mapping**, **10-bit → 8-bit**, **BT.709 color**, and
  **rotation metadata** handling for phone footage — what's the correct, robust
  approach in-browser?

### D. Audio
- Should I apply **loudness normalization** to each platform's target (e.g.,
  ~−14 LUFS, EBU R128)? Do these platforms normalize loudness themselves, making
  it redundant or harmful?
- Optimal AAC bitrate/profile per platform; when is mono acceptable.

### E. Exact, current platform specs (verify — these drift)
- For **each** platform above, find the **current (cite year)** real upload
  specs: accepted/preferred resolution ladders, max bitrate, accepted codecs,
  size & duration limits, frame-rate support, and **what their re-encoder
  actually does** to uploads. Flag anything my table above gets wrong or stale.

### F. Centralization & architecture
- My per-platform logic is already a single data-driven **profile registry**
  (one config object per platform consumed by both UI and engine). Is there a
  **cleaner abstraction or an industry-standard spec format** I should adopt? Is
  there an open, maintained **database of social-platform encoding specs** I can
  pull from instead of hand-maintaining?
- Should the heavy/long/4K path move to a dedicated server encoder (native
  FFmpeg, 2-pass), and where's the break-even vs on-device?

### G. Reliability / stability (this is my current focus)
- Robust in-browser handling of **large/4K/long, variable-frame-rate, rotated,
  10-bit/HDR, and unusual-codec** sources: memory limits, OOM avoidance,
  accurate progress, clean cancellation, and graceful fallback.
- Known WebCodecs/Mediabunny/ffmpeg.wasm pitfalls and how production apps work
  around them.

### H. Prior art / competitors (research these specifically)
Find and analyze tools doing the same or adjacent job — **how they do it, what
they charge, and what they do better than my approach.** Include both web and
native, free and premium. At least investigate:
- WhatsApp's own **HD** upload toggle / "send in HD" behavior.
- Web tools: **Kapwing, VEED.io, Clideo, FreeConvert, Media.io, 8mb.video,
  Veed/Adobe Express export presets, Cloudinary/Mux/Coconut (API encoders)**.
- Native/mobile: **CapCut, InShot, VN, "Send it in HD"-type apps, video
  compressor apps** on iOS/Android (note which are premium and what the paywall
  gates).
- **HandBrake / FFmpeg community presets** for "upload to social".
- Any **research papers / engineering blogs** on "pre-processing video to
  survive social-media recompression," transcoding-for-transcoding, or
  "compression-robust encoding."

---

## 4. Output I want from you

1. A **prioritized list of concrete changes** to my encode plan (per platform
   where it differs), each with: the change, the expected quality/size/speed
   impact, the risk, and a **source/citation with date**.
2. A **corrected per-platform spec table** (replacing mine where stale).
3. A clear verdict on the **A-section trade-off** (match vs over-provision) and
   on **WebCodecs vs software x264** for my use case.
4. A short **competitor teardown** (who does it best, what they charge, what to
   copy).
5. Anything I'm **missing or doing wrong**, and any **"don't bother"** items.

Constraints to respect in your recommendations: must work **on-device in a
browser** (WebCodecs + ffmpeg.wasm), stay **free/private by default** (no
mandatory upload), and keep the copy **honest** (no "lossless" claims).
