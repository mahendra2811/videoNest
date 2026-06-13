# VideoNest — Cross-device QA matrix (F2)

A documented test matrix so output quality and performance stay verified across
the field. Pair this with the automated `buildPlan` unit tests (`tests/plan.test.ts`,
`tests/freshness.test.ts`, `tests/copy.test.ts`) and the measurement protocol
(`measurement/MEASUREMENT.md`).

## Devices / browsers

| Environment | Engine path | Notes |
| --- | --- | --- |
| Chrome desktop | WebCodecs | Primary path; fastest. |
| Chrome Android (mid/high-end) | WebCodecs | Primary path on most phones. |
| Chrome Android (low-RAM, ≤3 GB) | WebCodecs → OOM retry → ffmpeg | Watch for OOM on 4K; one retry at lower res then ffmpeg. |
| iOS Safari | WebCodecs (16.4+) | Verify H.264 encode + Web Share to apps. |
| Samsung Internet | WebCodecs | Chromium-based; should match Chrome Android. |
| Firefox desktop | WebCodecs / ffmpeg | WebCodecs encode support varies; ffmpeg fallback must work. |

## Input × expected behaviour

| Input | Expected |
| --- | --- |
| 4K SDR, on-aspect | Downscaled to platform cap (1080 for WA/IG/FB via Lanczos; passthrough ≤1440p for YouTube), re-encoded. |
| HDR / 10-bit | Tone-mapped to SDR (canvas / ffmpeg), never fast-path remuxed. |
| Rotated (90/180/270) | Rotation baked into pixels (`allowRotationMetadata:false`), correct orientation. |
| VFR (variable frame rate) | Forced to CFR at the capped fps. |
| > platform duration | WhatsApp: auto-split into parts; others: trimmed to the cap. |
| No audio | Output has no audio track (no silent AAC). |
| Already-optimal H.264 | Fast-path remux (no re-encode) — unless any edit/option is active. |
| Exotic codec WebCodecs can't encode | Falls back to ffmpeg.wasm; if that fails, a typed, friendly error. |
| Off-aspect source | Prompts Fit (blur-pad) / Fill (crop) in the Edit step; Fit is default. |
| Sharpen on | Routed through ffmpeg (`unsharp`), output mildly sharpened. |
| Loudness-normalize on | Routed through ffmpeg (`loudnorm`); off by default. |
| Music added (mix/replace) | Second ffmpeg pass (`-c:v copy`), correct levels, length-matched. |
| Text / sticker overlays | Burned in on the OffscreenCanvas at the target resolution. |

## Automated `buildPlan` coverage (F2)

`tests/plan.test.ts` covers: aspectMode fit/fill, YouTube passthrough + quality
selector + codec, IG/WhatsApp/FB 1080 cap + hqDownscale, sharpen on/off, loudness
on/off, measuredOutput preference, fast-path remux, editor trim, and segment split
(`computeSegments`). Run with `pnpm test`.

## Manual smoke checklist (per release)

1. Each of the 7 platform pages loads, optimizes a short clip, and shares/downloads.
2. Off-aspect clip → Fit/Fill choice renders with a live preview.
3. A-B before/after compare + stats render on the result.
4. Favourites/recents persist across reload; last platform + options remembered.
5. `/hi` renders Hindi nav + switcher works; hreflang present in `<head>`.
6. Installs as a PWA; works offline after install.
7. With an empty `.env`: no ads, no analytics, no crashes.
