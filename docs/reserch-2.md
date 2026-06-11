## Bottom-line verdict

Your core premise is correct: **the platform will re-encode, so VideoNest should create a clean, compatible, moderately over-provisioned mezzanine source**, not try to “match” the platform’s final streaming bitrate. Matching the final CDN bitrate is usually worse because you are giving the platform already-compressed input, then forcing another lossy encode.

The practical rule should be:

**H.264 MP4 + AAC remains the universal default. Use moderate over-provisioning, not extreme over-provisioning.** For YouTube, allow higher-resolution/high-bitrate “quality mode” because YouTube’s transcode ladder can reward 1440p/4K uploads; for Instagram/Facebook/WhatsApp, stay mostly at 1080 vertical/landscape and spend bits on cleanliness, not on unnecessary upscaling.

---

# 1. Prioritized concrete changes to your encode plan

| Priority | Change                                                                                                                                                                                                                                                                                                       | Expected impact                                                                                                                | Risk / caveat                                                                                                             | Evidence                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | **Update stale platform limits.** WhatsApp Status is no longer safely modeled as only 30s; WhatsApp help references Status videos up to **90s**. YouTube Shorts are now up to **3 minutes**, not 60s. Instagram Reels docs now mention much longer recording/editing, while boosted Reels can still be 90s.  | Avoid wrong UX decisions, unnecessary splitting, and wrong warnings.                                                           | Rollouts can vary by account/country/app version; keep “verified date” per profile.                                       | WhatsApp media/status docs show 90s Status and 100MB/720p default video-send behavior; HD media is not for Status/profile pictures. ([WhatsApp Help Center][1]) YouTube Shorts officially moved to 3 minutes from Oct 15, 2024. ([Google Help][2]) Instagram Reels Help says Reels can be recorded/edited up to 20 minutes, while boosted Reels remain 90s. ([Instagram Help Center][3]) |
| **P0**   | **Split “platform cap” from “VideoNest product cap.”** Your YouTube long profile says 10 minutes and Shorts says 256MB, but YouTube’s platform upload limit is far higher: **256GB or 12 hours**. Keep your 500MB/10min browser cap, but don’t present it as YouTube’s cap.                                  | More honest UX and fewer false errors.                                                                                         | Very large YouTube files should trigger optional server/native path, not browser.                                         | YouTube Help says max upload is 256GB or 12 hours. ([Google Help][4])                                                                                                                                                                                                                                                                                                                    |
| **P0**   | **Make rate-control strategy profile-specific:** WhatsApp = size-constrained ABR/2-pass-lite; YouTube/Meta = quality-first capped CRF/VBR.                                                                                                                                                                   | Better file-size accuracy for WhatsApp and better visual quality elsewhere.                                                    | True 2-pass in ffmpeg.wasm is slow; use sample-based prediction + one retry on-device.                                    | FFmpeg’s H.264 guide lists CRF and two-pass ABR as the usual modes; capped CRF/VBV constrains peak bitrate while preserving quality-first behavior. ([FFmpeg Trac][5])                                                                                                                                                                                                                   |
| **P0**   | **Keep WebCodecs/hardware as default, add “software quality mode” only for constrained/important files.**                                                                                                                                                                                                    | Best UX: fast/private by default; x264 mode for WhatsApp/status or user-selected quality.                                      | ffmpeg.wasm x264 will be much slower and memory-heavy on mobile.                                                          | HandBrake notes hardware encoders are fast but usually less efficient than x264/x265; ffmpeg.wasm docs warn it is slower than native FFmpeg, even multi-threaded. ([HandBrake][6]) Recent hardware-vs-software tests found Intel/NVIDIA H.264 often close to software at common bitrates, but weaker mobile hardware can vary. ([arXiv][7])                                              |
| **P1**   | **Change YouTube GOP profile.** YouTube’s official recommendation is closed GOP, 2 B-frames, CABAC, and a GOP of **half the frame rate**. Your universal 2-second GOP is common for streaming, but not YouTube’s own upload recommendation.                                                                  | Potentially cleaner YouTube ingestion; more frequent keyframes can help seeking/transcode boundaries.                          | More I-frames increase file size. Use only for YouTube profiles, not tight WhatsApp files.                                | YouTube recommended settings specify H.264 High Profile, 2 B-frames, closed GOP, CABAC, variable bitrate, and GOP of half the frame rate. ([Google Help][8])                                                                                                                                                                                                                             |
| **P1**   | **Raise/reshape overprovision bitrate bands.** Your formula `W*H*fps*0.1` gives ~6.2 Mbps for 1080×1920@30. For IG/Reels/Stories, use about **8–12 Mbps at 30fps**, **12–18 Mbps at 60fps** when allowed. For YouTube 1080p, use YouTube’s official 8 Mbps / 12 Mbps HFR guidance as a floor, not a ceiling. | Better source detail before platform re-encode.                                                                                | Larger uploads; slower mobile export and share.                                                                           | Android media guidance says higher encoding bitrate is the largest quality lever before sharing transformations; YouTube recommends 8 Mbps for 1080p SDR and 12 Mbps for 1080p high frame rate. ([Android Developers][9])                                                                                                                                                                |
| **P1**   | **For YouTube only, allow source-resolution preservation up to 1440p/4K when source is already high-res.** Don’t downscale all YouTube long videos to 1080p.                                                                                                                                                 | YouTube final stream can improve, especially for small channels, because higher-res uploads can get better VP9/AV1 transcodes. | Browser encode cost explodes; gate behind quality/server mode. Never upscale low-res sources just to trick YouTube.       | A 2025 encoder evaluation observed YouTube often gives VP9/AV1 to 1440p+ uploads regardless of popularity, and YouTube’s AVC stream quality was much worse than VP9/AV1 in their tests. ([arXiv][7])                                                                                                                                                                                     |
| **P1**   | **Add HDR/10-bit triage.** Detect HDR/BT.2020/PQ/HLG/10-bit. For Instagram/Facebook/WhatsApp, tone-map to SDR BT.709 8-bit yuv420p. For YouTube, offer “preserve HDR” only if you can preserve correct metadata.                                                                                             | Prevents washed-out phone footage and color shifts.                                                                            | Correct HDR tone mapping in-browser is hard; Canvas paths can silently convert color. Server/native FFmpeg may be needed. | YouTube supports HDR uploads and documents BT.709/BT.2020 conversion behavior, including unsupported BT.2020-to-BT.709 conversions. ([Google Help][10])                                                                                                                                                                                                                                  |
| **P1**   | **Always bake rotation into pixels and output square pixels.** Do not rely on rotation metadata surviving platform ingest.                                                                                                                                                                                   | Fixes sideways/incorrect phone footage across social apps.                                                                     | Extra compositor step; must preserve sharpness.                                                                           | Smartphone videos commonly store orientation as metadata; platform/player handling has historically been inconsistent. WebCodecs has been adding orientation metadata support, but social upload survival is still safer when baked. ([Deconstruct Blog][11])                                                                                                                            |
| **P2**   | **Keep blur-pad, but expose crop / contain / blur-pad choices.** Default blur-pad is good for Status/Stories/Reels, but not universally best.                                                                                                                                                                | Better creator control and fewer “ugly background” complaints.                                                                 | Crop can remove content; letterbox can underperform visually in vertical feeds.                                           | Meta/Instagram vertical placements favor full-screen 9:16; Instagram Reels allow 1.91:1 to 9:16 but vertical is the practical target. ([Instagram Help Center][12])                                                                                                                                                                                                                      |
| **P2**   | **Add optional loudness normalization, not forced normalization.** Suggested preset: speech/social normalize to around **−16 LUFS integrated, −1 dBTP**, with “leave original audio” default for music.                                                                                                      | More consistent perceived loudness on mobile.                                                                                  | Platform normalization behavior is not consistently documented; forced normalization can hurt music dynamics.             | EBU R128 defines integrated loudness in LUFS for program loudness normalization; YouTube’s official upload docs specify audio codec/sample-rate/bitrate but not a required LUFS target. ([Wikipedia][13])                                                                                                                                                                                |
| **P2**   | **Do not enable generic sharpen/contrast by default.** Add optional denoise only for noisy/grainy/compressed input.                                                                                                                                                                                          | Avoids ringing/halos that get amplified by platform re-encode.                                                                 | Denoise can remove texture; sharpen can “hack” metrics while looking worse.                                               | Research shows preprocessing can manipulate VMAF while subjective quality may drop; newer adaptive preprocessing can help, but it is content-dependent, not a safe universal default. ([arXiv][14])                                                                                                                                                                                      |
| **P2**   | **Make multi-thread ffmpeg.wasm optional/desktop-gated.** Use single-thread as compatibility fallback; enable MT only after memory/device probe.                                                                                                                                                             | Faster desktop fallback.                                                                                                       | SharedArrayBuffer/COOP/COEP complexity, memory spikes, third-party script issues, weak mobile compatibility.              | ffmpeg.wasm MT requires SharedArrayBuffer; project discussions note compatibility and memory issues, and ffmpeg.wasm docs warn it remains slower than native FFmpeg. ([npm][15])                                                                                                                                                                                                         |

---

# 2. Corrected platform profile table — June 2026

This is not just “maximum allowed by platform.” It is the **recommended VideoNest output target** for private, browser-first encoding.

| Platform            |                                                                                     Corrected VideoNest target |                                                                                                                                 Duration handling |                                                                           FPS |                                                                                                                                                    Size handling | Codec/container                                                                         | What to change from your table                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------: | ----------------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------: | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **WhatsApp Status** |          Default **720×1280** 9:16 for safe mode; optional **1080×1920** quality mode if short/source is clean |                                        Official Status limit appears **90s**, not 30s; offer 30s split for compatibility, but don’t hard-force it |                                                                            30 | No reliable public Status size cap; WhatsApp media-send default is **100MB/720p**, slower connections **64MB/480p**; HD media is not for Status/profile pictures | MP4 H.264 + AAC safest; WhatsApp also supports several common containers for send media | Your **30s / 15MB** profile is too rigid/stale. Use 90s awareness + size/quality presets. ([WhatsApp Help Center][1])              |
| **Instagram Reels** |                                                                  **1080×1920**, 9:16 preferred; do not upscale |    Organic Reels docs now mention recording/editing up to **20 min**; boosted Reels still **≤90s**. Product-wise, keep 3-min/20-min warning tiers |          Minimum 30fps; preserve 30, optionally 60 when source/action demands |                                                                             Meta ad specs commonly allow up to **4GB**; practical UX should warn above 100–250MB | MP4/MOV, H.264 + AAC safest                                                             | 90s is no longer a safe universal limit. Keep 1080p, but update duration model. ([Instagram Help Center][3])                       |
| **Instagram Story** |                                                                                            **1080×1920**, 9:16 |                                                             Organic Story video up to **60s as one clip**; longer videos can be trimmed/broken up |                           30, optionally preserve 60 if source and size allow |                                                                                                      Ads docs allow 4GB, but organic UX should stay much smaller | MP4/MOV, H.264 + AAC                                                                    | 60s is okay for organic Stories; 100MB is a product cap, not official max. ([Instagram Help Center][16])                           |
| **YouTube Shorts**  |             **1080×1920** default; allow 1440×2560/2160×3840 only in quality/server mode if source is high-res |                                                                                              **3 minutes** for Shorts uploaded after Oct 15, 2024 |                                                      Preserve native up to 60 |                                                                                                     Platform max is YouTube’s general **256GB / 12h**, not 256MB | MP4 H.264 High + AAC default; HEVC/AV1 quality mode if supported                        | Your **60s / 256MB** values are stale/wrong. ([Google Help][2])                                                                    |
| **YouTube long**    | Preserve source aspect and resolution up to browser/server capability; don’t cap to 1080 if source is 1440p/4K |                                                                           Platform: **12h / 256GB**; VideoNest browser cap can remain 10min/500MB | Preserve same frame rate as source; YouTube supports common 24/25/30/48/50/60 |                                                                                               No need to force bitrate limit; use YouTube recommended VBR ranges | MP4, H.264 High, AAC-LC/Opus; faststart/no edit lists                                   | Current 10min is fine as a **browser cap**, not as platform spec. Consider “YouTube original-res quality mode.” ([Google Help][8]) |
| **Facebook Video**  |                    **1920×1080** 16:9 default, but allow 1:1/4:5/9:16 if user’s source/platform intent differs |                                                                                Feed ad specs show up to **241 minutes** and 4GB; organic can vary |                            30 default; allow 60 for source/action if accepted |                                                                                                     4GB upper bound in Meta ad specs; practical target far lower | MP4/MOV H.264 + AAC safest                                                              | 10min cap is product/browser cap, not Facebook cap. ([Facebook][17])                                                               |
| **Facebook Story**  |                                                                                            **1080×1920**, 9:16 | Older Meta story spec pages show 1–15s ad specs; newer placement docs vary by campaign/placement. For product UX, keep 60s safe and warn above it |                                                                            30 |                                                                                                              4GB max in Meta video ad docs, practical much lower | MP4/MOV H.264 + AAC safest                                                              | Keep 60s as a safe organic-style target, but don’t pretend it is the only Meta limit. ([Facebook][18])                             |

---

# 3. Central encoding trade-off: match vs over-provision

## Verdict

Use **moderate over-provisioning**.

Do **not** match the platform’s final playback bitrate. The posted stream is the result of another encode, so if you upload a file already compressed to the platform’s likely final bitrate, the platform’s encoder has fewer clean details to preserve. Android’s media guidance says higher encode bitrate is the largest quality lever before sharing transformations, while also warning that size/upload cost matters at sharing time. ([Android Developers][9])

But do **not** over-provision blindly.

For Instagram/Facebook/WhatsApp, the practical best source is usually:

```txt
1080 vertical/landscape
H.264 High
yuv420p
AAC
clean scaling
moderate bitrate
no upscaling
no aggressive filters
```

For YouTube, the exception is resolution. YouTube’s official guide recommends VBR and gives bitrate ladders, but YouTube also creates its own playback ladders. Evidence from encoder/transcode testing shows YouTube’s VP9/AV1 outputs can be much better than AVC, and 1440p+ uploads can trigger better transcodes more reliably. ([Google Help][8])

## Recommended bitrate bands

| Destination          |                                            Browser-fast mode |                                                  Quality mode |
| -------------------- | -----------------------------------------------------------: | ------------------------------------------------------------: |
| WhatsApp Status      | Size-constrained: ~1.5–4 Mbps depending duration/size target | 720p/1080p with user-chosen size preset; use x264 if possible |
| Instagram Reels      |                                             8–12 Mbps @30fps |                       12–18 Mbps for high-motion/60fps source |
| Instagram Story      |                                             6–10 Mbps @30fps |                                     10–14 Mbps if high-motion |
| YouTube Shorts 1080p |                                8 Mbps @30fps, 12 Mbps @60fps |            1440p/4K preserve-source mode using YouTube ladder |
| YouTube long 1080p   |                                8 Mbps @30fps, 12 Mbps @60fps |          1440p 16/24 Mbps; 4K 35–68 Mbps per YouTube guidance |
| Facebook Video       |                                             8–12 Mbps @1080p |                                   12–15 Mbps for motion-heavy |
| Facebook Story       |                                                    6–10 Mbps |                                                    10–14 Mbps |

Your current overprovision formula is not bad, but it is slightly low for 1080×1920@30 social video because it lands around **6.2 Mbps**. I’d raise Meta vertical defaults closer to **8–12 Mbps**, then cap based on practical upload size.

---

# 4. Rate control: CRF, capped CRF, 2-pass, per-title

## Browser default

Use **capped CRF / constrained VBR** where possible:

```txt
quality target + maxrate + bufsize
```

That is the right default for Instagram, Facebook, and YouTube because the user cares more about visual cleanliness than exact file size. VBV/capped CRF is specifically useful when you want quality-first encoding but still need a peak bitrate ceiling. ([SLHCK][19])

## WhatsApp

Use **size-constrained ABR**, ideally with a lightweight two-pass substitute.

True two-pass x264 is best when exact size matters, but it is painful in-browser. So for WhatsApp I’d do:

1. Estimate bitrate from size budget.
2. Encode a short sample or a few segments.
3. Predict final size.
4. Run one full encode.
5. If file is too large, one retry at lower bitrate/resolution.

This is better than pure CRF because WhatsApp/Status is the only profile where “under X MB” is a core user need.

## Per-title / per-scene encoding

Do **not** run full per-title encoding in-browser by default. It is computationally expensive. But you can borrow the idea cheaply: sample complexity from a few windows and adjust bitrate/resolution preset. Per-title/per-shot research can reduce bitrate for the same quality, but it assumes multiple encode passes or quality models that are more appropriate for server pipelines. ([arXiv][20])

---

# 5. WebCodecs vs software x264

## Verdict

Keep **WebCodecs hardware H.264 as the default**.

Offer **software x264 as an optional quality/compatibility path**, not the default.

Reason:

WebCodecs gives you browser-native encoders and is exactly the right architectural choice for a private, mobile-first tool. MDN’s `VideoEncoder.isConfigSupported()` and WebCodecs docs confirm that codec support is implementation-dependent, so your capability-probe design is correct. ([MDN Web Docs][21])

The quality gap is real: hardware H.264 is usually faster but less efficient per bit than x264. HandBrake’s docs are blunt: hardware encoders are very fast at the expense of some quality or larger files. ([HandBrake][6])

However, at the higher upload bitrates you should use for social prep, the gap is often not worth the UX cost. A 2025 hardware encoder evaluation found Intel/NVIDIA H.264 often close to software H.264 in VMAF at tested bitrates, while Qualcomm/mobile results were less consistent. ([arXiv][7])

So the product decision should be:

```txt
Default:
  WebCodecs H.264 hardware encode

Quality mode:
  ffmpeg.wasm x264 if file is short/small enough

Server mode:
  native FFmpeg x264/x265/AV1 for 4K, HDR, 10-bit, long files
```

Do not make ffmpeg.wasm x264 default on mobile. ffmpeg.wasm itself documents that it is slower than native FFmpeg, and multi-threading requires SharedArrayBuffer/COOP/COEP and can create memory/compatibility problems. ([ffmpeg.wasm][22])

---

# 6. Codec choice by platform

| Platform              | Default                     | Optional                                                                                                                             | Avoid                                                                                         |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| WhatsApp Status       | **H.264 MP4 + AAC**         | None needed                                                                                                                          | HEVC/AV1/VP9 for status; too risky                                                            |
| Instagram Reels/Story | **H.264 MP4/MOV + AAC**     | HEVC only if you later verify app behavior per device                                                                                | AV1/VP9 uploads as default                                                                    |
| Facebook Video/Story  | **H.264 MP4/MOV + AAC**     | H.265 may be accepted in some Meta placements; Facebook Reels docs mention H.264/H.265 recommended and H.264/H.265/VP9/AV1 supported | AV1/VP9 default for broad social                                                              |
| YouTube / Shorts      | **H.264 MP4 + AAC** default | HEVC/AV1 quality mode, especially for 4K/HDR/server path                                                                             | VP9 upload from browser unless you prove benefit; YouTube will create VP9/AV1 playback itself |

YouTube’s official upload page still recommends MP4/H.264 High Profile/AAC-LC and gives specific bitrate ladders. That is the safest default. ([Google Help][8])

---

# 7. Pre-processing recommendations

## Sharpen / contrast / denoise

Do **not** enable global sharpening or contrast by default.

Why: recompression can amplify halos, ringing, and edge overshoot. Also, metric-driven preprocessing can “hack” scores without improving subjective quality. Research on VMAF manipulation shows preprocessing can raise metric scores while subjective quality does not necessarily improve. ([arXiv][14])

What to add instead:

```txt
Auto:
  no sharpen
  no contrast boost
  no denoise

Optional:
  light denoise for noisy/grainy sources
  mild sharpen only with preview toggle
  never stack denoise + sharpen aggressively
```

## Blur-pad vs crop vs letterbox

Keep blur-pad as your default for 9:16 social outputs because it preserves full content while filling the vertical canvas. But add a user toggle:

```txt
Fit with blur background
Fill/crop center
Letterbox/contain
```

For Reels/Stories/Status, crop often looks more native, but it can cut content. Blur-pad is safer for a utility tool.

## HDR / color

Add a dedicated color pipeline:

```txt
Detect:
  bit depth
  color primaries
  transfer function
  matrix
  HDR metadata
  rotation

For WhatsApp/Instagram/Facebook:
  convert/tone-map to SDR BT.709
  8-bit
  yuv420p
  limited range

For YouTube:
  preserve HDR only if metadata can be preserved correctly
  otherwise tone-map to SDR
```

YouTube documents BT.709 expectations for SDR and how unsupported color metadata can be converted, so you should not leave phone HDR behavior to chance. ([Google Help][8])

---

# 8. Audio

Your current AAC-LC, 48kHz approach is good.

Changes I’d make:

| Platform              | Audio recommendation                                                 |
| --------------------- | -------------------------------------------------------------------- |
| WhatsApp              | AAC-LC 128k stereo; mono 96k acceptable for voice                    |
| Instagram Reels/Story | AAC-LC 128–160k stereo                                               |
| YouTube Shorts        | AAC-LC 192k minimum; 384k stereo if not size-constrained             |
| YouTube long          | AAC-LC/Opus; 384k stereo aligns with YouTube’s official upload table |
| Facebook              | AAC-LC 128–192k stereo                                               |

YouTube’s official audio table recommends 48kHz sample rate and lists 384kbps for stereo uploads. ([Google Help][8])

For loudness, add this as an **optional** preset:

```txt
Normalize speech/social audio:
  integrated loudness: about -16 LUFS
  true peak: -1 dBTP
```

Do not force it. Platforms may normalize playback, and music creators may not want loudness changes.

---

# 9. Architecture / centralization

Your centralized profile registry is the right direction. I would not look for a magical “official social media encoding spec database” because public specs are fragmented, marketing-oriented, placement-specific, and frequently stale.

Instead, evolve your registry into a versioned spec system:

```ts
type PlatformProfile = {
  id: string;
  label: string;

  appliesTo: "organic" | "ads" | "messaging" | "story" | "reels" | "shorts";

  sourcePolicy: {
    maxInputBytes: number;
    maxInputDurationSec: number;
    allowServerFallback: boolean;
  };

  output: {
    container: "mp4";
    videoCodec: "h264" | "hevc" | "av1";
    audioCodec: "aac";
    maxWidth: number;
    maxHeight: number;
    aspect: "9:16" | "16:9" | "source";
    fpsPolicy: "preserve-up-to-cap" | "force-30";
    bitratePolicy: "size-constrained" | "capped-crf" | "youtube-ladder";
    gopPolicy: "youtube" | "social-2s" | "whatsapp-size";
  };

  platformLimits: {
    durationSec?: number;
    fileSizeBytes?: number;
    official?: boolean;
    confidence: "high" | "medium" | "low";
    lastVerified: string;
    sources: string[];
  };

  warnings: string[];
};
```

The important fields are:

```txt
lastVerified
source URL
confidence
organic vs ads vs messaging
safe default vs max accepted
```

That will prevent the exact issue your current table has: mixing platform limits, ad specs, organic app behavior, and your own product/browser limits.

Mediabunny remains a reasonable browser-side abstraction because it is designed for reading/writing/converting media directly in the browser, and ffmpeg.wasm remains a useful fallback, but not a performance miracle. ([Mediabunny][23])

---

# 10. Server fallback break-even

Keep free/private on-device as the default, but trigger optional server/native FFmpeg for:

```txt
4K source
HDR / 10-bit source
HEVC / AV1 / ProRes / unusual codec source
>500MB
>10min
YouTube quality mode
software x264 2-pass request
WhatsApp exact-size request for long clips
browser memory risk
```

Server tier advantages:

```txt
native FFmpeg speed
real x264/x265/AV1
2-pass
better tone mapping
better audio loudness analysis
less browser OOM
```

Risk:

```txt
privacy promise weakens
upload cost
Vercel/serverless timeout limits
storage lifecycle complexity
```

Product copy should be:

> “Private browser export by default. Optional cloud encode for very large, HDR, or 4K videos.”

---

# 11. Reliability / browser stability checklist

Add these before adding fancy filters:

```txt
1. Preflight memory estimate:
   width * height * 1.5 * pipelineBuffers

2. Decode/encode streaming:
   never hold many VideoFrames
   always frame.close()

3. Backpressure:
   watch VideoEncoder.encodeQueueSize

4. OOM strategy:
   1080p -> 720p retry
   then WebCodecs -> ffmpeg fallback
   then server suggestion

5. MP4 faststart:
   avoid full duplicate in-memory copies for large files
   use chunked muxing / OPFS where possible

6. VFR:
   preserve timestamps when possible
   only convert to CFR when platform/profile requires fixed frame rate

7. Rotation:
   bake transform into pixels

8. Cancellation:
   AbortController + worker terminate + cleanup OPFS/memory

9. Progress:
   phase-based progress:
   probe / decode / filter / encode / mux / split

10. Capability telemetry:
   store anonymous local-only compatibility results:
   browser, codec support, failure reason
```

WebCodecs support is intentionally capability-based, so your current `isConfigSupported` check is necessary. But it is not enough: encoder initialization/encode can still fail, so keep your fallback orchestration. ([MDN Web Docs][21])

---

# 12. Competitor teardown

| Competitor                                | What they do well                                                                     | Pricing / model                                                                                | What VideoNest should copy                                             | Where VideoNest can beat them                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **WhatsApp HD toggle**                    | Native, simple, user trust                                                            | Free                                                                                           | Explain that WhatsApp HD send is different from Status                 | WhatsApp HD media is not available for Status/profile pictures; VideoNest can optimize Status specifically. ([WhatsApp Help Center][24]) |
| **Kapwing**                               | Strong web editor, resize presets, captions, collaboration                            | Kapwing Pro is listed at **$16/month billed annually**, Business **$50/month billed annually** | Simple presets, before/after preview, captions                         | Kapwing is cloud/editor-first; VideoNest can be private/on-device. ([Kapwing][25])                                                       |
| **VEED.io**                               | Fast creator UX, captions, cleanup, templates                                         | Freemium/paid creator platform                                                                 | Polished social workflow, captions, resize UX                          | VideoNest should not compete as a full editor; compete as private optimizer. ([VEED][26])                                                |
| **Clideo**                                | Simple compressor/resizer, browser UX                                                 | Paid Pro plans; app/web compressor                                                             | One-click compression simplicity                                       | Mostly upload/server-based; VideoNest privacy is stronger. ([clideo.com][27])                                                            |
| **FreeConvert**                           | Format support, advanced bitrate/resolution settings                                  | Basic **$24.99/mo**, Pro **$29.99/mo**, free limit around 1GB                                  | Advanced settings panel                                                | VideoNest can be social-specific and private. ([FreeConvert][28])                                                                        |
| **Media.io**                              | AI media suite, credits, web convenience                                              | Credit/hour subscription model                                                                 | Clean onboarding, AI-assisted presets                                  | VideoNest avoids upload and watermark/credit complexity. ([Media.io][29])                                                                |
| **Cloudinary / Mux / Coconut-style APIs** | Production-grade server transcoding, adaptive streaming, CDN                          | Usage-based                                                                                    | Optional server encoder architecture                                   | Not end-user private tools; VideoNest can be consumer-first. ([mux.com][30])                                                             |
| **CapCut**                                | Best creator workflow: templates, captions, effects, native performance               | Freemium, mobile/web/native                                                                    | Social-first UI, templates, direct platform thinking                   | Too broad/editor-heavy; VideoNest can be tiny, private, utility-focused. ([CapCut][31])                                                  |
| **InShot**                                | Mobile social editing, blur background/no-crop, HD exports                            | Free with ads/watermark; paid removes friction                                                 | Blur/crop/no-crop controls                                             | VideoNest can focus on compression science, not editing. ([App Store][32])                                                               |
| **VN**                                    | Free/no-watermark editing reputation                                                  | Free with some IAPs                                                                            | No-watermark trust positioning                                         | VideoNest should copy “free core, no watermark.” ([App Store][33])                                                                       |
| **WhatStatHD / Status HD apps**           | Very close to your WhatsApp Status use case: auto-split, 720p/1080p, HDR/color claims | Mobile app                                                                                     | WhatsApp-specific UX: split presets, direct share, status-focused copy | Avoid their risky “no quality loss” claims; be more honest. ([Google Play][34])                                                          |
| **HandBrake / FFmpeg presets**            | Best free quality controls, x264 maturity                                             | Free/open-source                                                                               | “Advanced mode” language: CRF, preset, maxrate, audio                  | Not mobile/web/simple; VideoNest wins on convenience. ([HandBrake][6])                                                                   |

Best competitor pattern to copy: **native/mobile editors win because they make the destination obvious**. Users don’t think “H.264 CRF 20”; they think “WhatsApp Status HD,” “Instagram Story,” “YouTube Shorts.” Your profile-first UX is the right wedge.

---

# 13. What you are missing / doing wrong

## Wrong or stale

```txt
WhatsApp Status:
  30s hard limit is stale.
  Treat 90s as current, but keep 30s split option.

YouTube Shorts:
  60s is stale.
  Use 3 minutes.

YouTube Shorts size:
  256MB is not YouTube’s platform cap.
  It may be your product cap, but label it that way.

Instagram Reels:
  90s is no longer universal.
  Keep separate organic vs boosted/ad constraints.

YouTube long:
  1080p-only target is too conservative.
  Preserve 1440p/4K when user chooses quality mode.
```

## Technically missing

```txt
HDR/10-bit detection and tone mapping
rotation baking
VFR timestamp strategy
source color metadata inspection
software quality mode
server/native fallback for 4K/HDR/long
profile source/version metadata
user-facing quality vs size mode
```

## Don’t bother

```txt
Do not claim lossless/no quality loss.

Do not upscale low-res videos just to hit 1080p/4K.

Do not default to HEVC/AV1 for Instagram/Facebook/WhatsApp.

Do not default to ffmpeg.wasm x264 for all users.

Do not default to sharpen/contrast filters.

Do not build a full per-title encoder in-browser.

Do not make multi-thread ffmpeg.wasm mandatory.

Do not rely on rotation metadata surviving social upload.

Do not treat Meta ad specs as identical to organic app behavior.
```

---

# Final recommended encode policy

Use this as your new engine rule:

```txt
If already optimal:
  remux, do not re-encode.

For WhatsApp Status:
  H.264 MP4 AAC
  720p safe / 1080p quality
  30fps
  size-constrained bitrate
  optional 30s split, but support 90s awareness
  no HD-status claim

For Instagram / Facebook vertical:
  H.264 MP4 AAC
  1080x1920
  30fps default, preserve 60 only when useful
  capped CRF / VBR around 8–12 Mbps
  1–2s closed GOP
  blur-pad/crop/contain options

For YouTube:
  H.264 MP4 AAC default
  preserve source fps
  use YouTube bitrate ladder
  support 1440p/4K quality mode
  YouTube-specific GOP/B-frame settings
  preserve HDR only if metadata is correct; otherwise tone-map

For fallback:
  WebCodecs first
  ffmpeg.wasm x264 quality mode for small/short files
  native server FFmpeg for 4K/HDR/long/unusual sources
```

Your current architecture is fundamentally strong. The biggest improvements are not fancy AI filters; they are **fresh platform profiles, profile-specific rate control, HDR/rotation reliability, and a clear fast-vs-quality-vs-server encoding ladder**.

[1]: https://faq.whatsapp.com/454876960047011?utm_source=chatgpt.com "About status | WhatsApp Help Center"
[2]: https://support.google.com/youtube/answer/15424877?hl=en "Understand three-minute YouTube Shorts - YouTube Help"
[3]: https://help.instagram.com/2720958398006062?utm_source=chatgpt.com "Record a reel on Instagram"
[4]: https://support.google.com/youtube/answer/71673?co=GENIE.Platform%3DDesktop&hl=en&utm_source=chatgpt.com "Upload videos longer than 15 minutes - Computer"
[5]: https://trac.ffmpeg.org/wiki/Encode/H.264?utm_source=chatgpt.com "Encode/H.264 – FFmpeg"
[6]: https://handbrake.fr/docs/en/latest/technical/performance.html "HandBrake Documentation — Performance"
[7]: https://arxiv.org/html/2511.18686v1 "Evaluation of Hardware-based Video Encoders on Modern GPUs for UHD Live-Streaming"
[8]: https://support.google.com/youtube/answer/1722171?hl=en "YouTube recommended upload encoding settings - YouTube Help"
[9]: https://developer.android.com/media/optimize/sharing "Best practices for sharing video  |  Android media  |  Android Developers"
[10]: https://support.google.com/youtube/answer/7126552?hl=en&utm_source=chatgpt.com "Upload High Dynamic Range (HDR) videos - YouTube Help"
[11]: https://blog.addpipe.com/mp4-rotation-metadata-in-mobile-video-files/?utm_source=chatgpt.com "Rotation Metadata in Video Files Created by Mobile Devices"
[12]: https://help.instagram.com/1038071743007909?utm_source=chatgpt.com "Reel size & aspect ratios on Instagram"
[13]: https://en.wikipedia.org/wiki/EBU_R_128?utm_source=chatgpt.com "EBU R 128"
[14]: https://arxiv.org/abs/2107.04510?utm_source=chatgpt.com "Hacking VMAF and VMAF NEG: vulnerability to different preprocessing methods"
[15]: https://www.npmjs.com/package/%40ffmpeg.wasm/main?utm_source=chatgpt.com "@ffmpeg.wasm/main - npm"
[16]: https://help.instagram.com/1257341144298972?utm_source=chatgpt.com "Share a photo or video to your story"
[17]: https://www.facebook.com/business/ads-guide/update/video?utm_source=chatgpt.com "Awareness Video Ad Specs on Facebook Feed"
[18]: https://www.facebook.com/business/ads-guide/update/video/instagram-story?utm_source=chatgpt.com "Awareness Video Ad Specs on Instagram Stories"
[19]: https://slhck.info/video/2017/03/01/rate-control.html?utm_source=chatgpt.com "Understanding Rate Control Modes (x264, x265, vpx)"
[20]: https://arxiv.org/abs/2408.01932?utm_source=chatgpt.com "Constructing Per-Shot Bitrate Ladders using Visual Information Fidelity"
[21]: https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/isConfigSupported_static?utm_source=chatgpt.com "VideoEncoder: isConfigSupported() static method - Web APIs"
[22]: https://ffmpegwasm.netlify.app/docs/performance?utm_source=chatgpt.com "Performance"
[23]: https://mediabunny.dev/?utm_source=chatgpt.com "Mediabunny — A complete JavaScript media toolkit for the ..."
[24]: https://faq.whatsapp.com/windows/chats/how-to-send-media/?locale=de_DE&utm_source=chatgpt.com "Medien, Kontakte und Standort senden"
[25]: https://www.kapwing.com/pricing?utm_source=chatgpt.com "Pricing"
[26]: https://www.veed.io/?utm_source=chatgpt.com "VEED – AI Video Creation Platform | Idea to Video Workflow"
[27]: https://clideo.com/compress-video?utm_source=chatgpt.com "Video Compressor Online"
[28]: https://www.freeconvert.com/pricing?utm_source=chatgpt.com "Convert Image, Video, Audio, & Document Files"
[29]: https://www.media.io/?utm_source=chatgpt.com "Media.io – All-in-One AI Video, Image & Music Platform"
[30]: https://www.mux.com/pricing?utm_source=chatgpt.com "Scalable and affordable video streaming and storage"
[31]: https://www.capcut.com/?utm_source=chatgpt.com "CapCut AI Video Editor: Smart Online Video Editing with ..."
[32]: https://apps.apple.com/us/app/inshot-video-editor/id997362197?utm_source=chatgpt.com "InShot - Video Editor - App Store - Apple"
[33]: https://apps.apple.com/us/app/vn-video-editor/id1343581380?utm_source=chatgpt.com "VN: Video Editor - App Store - Apple"
[34]: https://play.google.com/store/apps/details?hl=en_IN&id=com.calebibeh.whatstathd&utm_source=chatgpt.com "WhatStatHD: HD WhatsApp Status"
