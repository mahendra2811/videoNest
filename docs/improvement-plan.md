# VideoNest functionality improvement plan

Synthesis of `reserch-1.md`, `reserch-2.md`, `reserch-3.md`. Where the three
disagreed, the call follows the 2-of-3 majority backed by the strongest evidence
(research-3 has reproducible VMAF data).

## What we're ALREADY doing right (no change — all reports confirm)
- **WebCodecs (hardware H.264) primary, ffmpeg.wasm fallback.** Research‑1 alone
  said "switch to software x264"; research‑2 & 3 rebut it (modern hardware H.264
  ≈ x264‑veryfast, ~8× faster, far less power). **Keep WebCodecs primary.**
- **No forced loudness normalization.** Research‑1 said add it; research‑2 & 3
  say the platforms all normalize themselves, so forcing −14 LUFS is redundant
  or harmful. **Our current pass-through is correct.**
- **No default sharpen/denoise.** All three: defaulting these on backfires. Keep off.
- **Downscale-only to 1080 (never upscale)** for IG/WhatsApp/FB — matches "match,
  don't over-provision to 4K" for those platforms.
- **ffmpeg path = capped-CRF** (`-crf 20 -maxrate -bufsize 2x`) — the recommended
  rate control. **Single-thread wasm** (multi-thread is broken on Chromium).
- **OOM retry ladder, dormant server tier, WhatsApp 30s auto-split** — all endorsed.

## Stage 1 — quick, safe wins (config/data; low risk)
Files: `lib/config/profiles.ts`, `lib/engine/plan.ts`, `lib/engine/types.ts`.

1. **WhatsApp Status size cap 15 → 16 MB.** (research‑1, 3)
2. **YouTube Shorts duration 60s → 180s (3 min).** Official since Oct 15 2024. (all 3)
3. **Raise over-provision bitrate bands.** Current `W*H*fps*0.1` ≈ 6.2 Mbps for
   1080×1920@30 — slightly low. Target **~8–12 Mbps** for IG/FB vertical,
   **12–16 Mbps** for YouTube 1080p. Bump the per-pixel factor (~0.13) and/or
   set explicit per-profile floors. (research‑2, 3)
4. **Per-profile GOP.** Keep 2s default; use **~1s (≈half fps)** for the YouTube
   profile per YouTube's own spec. Add `keyFrameIntervalSec` to the profile. (research‑2, 3)
5. **YouTube audio bitrate up.** Shorts 192 → 256k, long 256 → 384k AAC. (research‑2, 3)
6. **Profile metadata: `lastVerified`, `sourceUrl`, `confidence`** fields + split
   "platform max" from "VideoNest product cap" in any copy. Prevents spec drift. (research‑2, 3)

## Stage 2 — correctness/quality (moderate effort)
Files: `probe.ts`, `encode.webcodecs.ts`, `encode.ffmpeg.ts`, `plan.ts`, `run.ts`.

7. **Verify + guarantee rotation is baked into pixels.** All three flag this as a
   common silent bug (sideways iPhone clips). We use Mediabunny (`sample.draw`
   auto-rotates, Conversion bakes rotation) so we're *likely* fine — but add a
   test with a rotated source and confirm both the blur-pad and non-pad paths.
8. **Force constant frame rate (CFR) on output.** VFR screen-recordings can fail
   near the end on IG. We only set `frameRate` when capping — set it always (or
   verify Mediabunny emits CFR). (research‑2, 3)
9. **YouTube "best quality" mode** (opt-in): when the source is already ≥1440p and
   the device supports it, allow resolution passthrough (1440p/4K) instead of
   forcing 1080p — research‑3's VMAF tests show native‑1080p uploads score
   *worst* on YouTube. Gate behind a quality toggle + capability check; fall back
   to 1080p/server otherwise. Optional **AV1/HEVC for YouTube** toggle gated on
   `VideoEncoder.isConfigSupported`. (research‑2, 3)

## Stage 3 — reliability hardening
10. **HDR / 10-bit → SDR BT.709 tone-map.** The biggest reliability gap per all
    three. Detect BT.2020/PQ/HLG/10-bit in `probe`; route those sources through a
    tone-map (ffmpeg.wasm `zscale`+`tonemap`, or the server tier) → output 8-bit
    BT.709. Prevents washed-out/dark HDR phone footage.
11. **Pipeline backpressure + cancellation flush.** Throttle decode→encode so
    frames don't pile up (memory); ensure cancel closes encoder/decoder and frees
    VideoFrames. (research‑2, 3)
12. **OOM preflight** (rough `w*h*1.5*buffers` estimate) → suggest lower res or
    server tier before starting on huge sources.

## Stage 4 — server tier auto-trigger (optional, keep opt-in)
13. Auto-*suggest* the (already-built, dormant) server tier specifically for
    **4K / HDR / >10 min / AV1-2pass / unusual-codec** sources that exceed
    WebCodecs — behind explicit opt-in to keep the privacy promise.

## Explicitly DON'T do (all reports agree)
- Don't make ffmpeg.wasm x264 the default; don't adopt multi-thread wasm.
- Don't force loudness normalization or default sharpen/denoise.
- Don't default to AV1/VP9/HEVC for WhatsApp/IG/FB; H.264 stays the universal default.
- Don't build full per-title encoding in-browser; don't 2-pass short clips.
- Don't ever claim "lossless"/"no quality loss" (keep copy honest).

## Biggest measurable wins
Stage 1 (#3 bitrate bands, #2 Shorts duration) + Stage 2 (#7 rotation, #9 YouTube
quality path) + Stage 3 (#10 HDR) — in that order of value-to-effort.
