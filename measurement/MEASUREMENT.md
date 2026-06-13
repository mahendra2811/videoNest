# VideoNest — Empirical Measurement Protocol (A1)

> **Why this exists.** We stop guessing what WhatsApp / Instagram / YouTube /
> Facebook *actually* output, and measure it. Then we tune each profile in
> `lib/config/profiles.ts` (`measuredOutput`) so our pre-encode lands **just
> under** the platform's real target — making the platform's own re-encode as
> close to passthrough as possible. The prime directive holds: we **minimise**
> recompression damage; we never "restore" or claim "lossless."

## Division of labour (be honest about this)

- **Claude Code built:** this doc, the test-clip matrix, the analysis script
  (`analyze.mjs`), the data schema (`results.sample.json`), and the profile
  wiring (`buildPlan()` prefers `measuredOutput` when present).
- **A human must run the uploads.** Claude Code **cannot** upload to WhatsApp /
  Instagram / etc. You post each test clip, download the served copy, drop the
  files in a folder, and run the script. Then paste the resulting JSON back so
  the `measuredOutput` values can be filled in.

---

## 1. Build the test-clip matrix

Generate (or shoot) a small matrix of source clips. Name each file with its
spec so the analyzer can parse it (see §3 naming). Dimensions to cross:

| Axis | Values |
| --- | --- |
| Resolution | 2160p, 1440p, 1080p, 720p, 480p |
| Frame rate | 24, 30, 60 fps |
| Aspect | 9:16, 16:9, 1:1 |
| Content | high-motion, static/detail, dark/gradient (banding test) |
| Dynamic range | SDR, HDR/10-bit |
| Duration | ~10s and ~29s (near the WhatsApp Status cap) |

You do **not** need the full Cartesian product. A practical core set (~12–16
clips) covers the signal: each resolution at 30fps 9:16 SDR 29s, plus a 60fps,
a 16:9, a 1:1, an HDR, a dark-gradient, and a high-motion variant.

Synthetic clips can be generated locally with ffmpeg, e.g.:

```bash
# 1080p 30fps 9:16 SDR 29s high-motion (testsrc2 is busy → good motion test)
ffmpeg -f lavfi -i testsrc2=size=1080x1920:rate=30 -t 29 \
  -c:v libx264 -pix_fmt yuv420p -b:v 20M \
  "1080p_30fps_9x16_highmotion_sdr_29s.mp4"

# dark gradient banding test
ffmpeg -f lavfi -i "gradients=size=1080x1920:rate=30:c0=black:c1=#101820" -t 10 \
  -c:v libx264 -pix_fmt yuv420p -b:v 20M \
  "1080p_30fps_9x16_darkgradient_sdr_10s.mp4"
```

(For HDR/10-bit, capture on a real phone — synthetic HDR rarely matches what a
device produces.)

## 2. Run the uploads (human, per platform)

For **each** clip, and for the platforms you're verifying:

1. Transfer the source clip to a **real Android** device and a **real iOS**
   device (don't rely on emulators — they re-encode differently).
2. Post it to the target (start with **WhatsApp Status**). Repeat with the
   account's upload-quality setting at both **Standard** and **HD** (WhatsApp
   Settings → Storage and data → Media upload quality).
3. Download the **served** copy back (a status-saver / "save status" flow, or
   re-download from the platform). This served file is what we measure — not
   your source.
4. Save it next to the source, naming it `<sourcename>__<device>_<quality>.<ext>`
   e.g. `1080p_30fps_9x16_highmotion_sdr_29s__android_HD.mp4`.

Put **all** downloaded served files in one folder (e.g. `measurement/clips/`).

## 3. File naming (so the analyzer can parse the input spec)

```
<res>_<fps>fps_<aspect>_<content>_<range>_<dur>[__<device>_<quality>].<ext>
   2160p  30    9x16   highmotion  sdr   29s     android   HD       mp4
```

- `res`: `2160p|1440p|1080p|720p|480p`
- `aspect`: `9x16|16x9|1x1`
- `range`: `sdr|hdr`
- `device`: `android|ios` · `quality`: `Standard|HD` (optional)

Unparseable parts are recorded as `null` in `inputSpec` — the **measured
output** (from ffprobe) is always authoritative regardless of the name.

## 4. Analyze

```bash
node measurement/analyze.mjs measurement/clips > measurement/results.json
# requires ffprobe on PATH (part of ffmpeg)
```

It runs `ffprobe -show_streams -show_format` on each file and emits a JSON array
of normalized rows (schema in `results.sample.json`). Paste `results.json` back.

## 5. Wire results into profiles

For each platform, pick the representative served output (usually the HD-upload
row at the platform's cap) and set `measuredOutput` on its profile in
`lib/config/profiles.ts`:

```ts
measuredOutput: {
  width: 720, height: 1280, fps: 30,
  vBitrate: 2_000_000, vCodec: "h264",
  profile: "High", pixFmt: "yuv420p", aBitrate: 128_000,
},
```

`buildPlan()` then targets **~7% under** `vBitrate` and matches the measured
resolution/fps exactly (still downscale-only — never upscales a smaller source).
Also bump `lastVerified` to the current `YYYY-MM` and set `confidence: "high"`.

## 6. Cadence (A2)

- **Re-run this protocol quarterly**, and immediately on any reported quality
  regression (a platform silently changing its parameters is the classic way
  competitors went stale).
- Profiles whose `lastVerified` is older than **90 days** emit a dev warning
  (see `tests/freshness.test.ts`) and surface a subtle "last verified" line in
  the UI.
- Never ship a platform whose profile is unmeasured/low-confidence as anything
  but **beta**.
