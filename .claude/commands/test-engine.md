---
description: End-to-end verify the encode engine in a real browser with generated test clips
---

The encode engine uses WebCodecs/Mediabunny + ffmpeg.wasm in a Web Worker, so it can only be
verified in a real browser (not Node/Vitest — those only cover `buildPlan`). Reproduce the
end-to-end check:

1. **Get ffmpeg** (not in PATH by default): download the static build to `/tmp/ffmpeg`
   (`https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`).
2. **Generate test clips** with `testsrc2` + `sine` audio:
   - Horizontal 1920×1080, 40s (exercises blur-pad + trim-to-30s + downscale).
   - Already-optimal vertical 1080×1920, 20s, <15 MB (exercises the fast path / minimal re-encode).
   Copy them **inside the project** (Playwright MCP only allows file uploads from the repo root).
3. `pnpm build && PORT=3210 pnpm start` (background). Confirm `Cross-Origin-Opener-Policy` /
   `Cross-Origin-Embedder-Policy` headers are present and the tool page returns 200.
4. Drive `/whatsapp-status-video` with the Playwright MCP browser: check
   `crossOriginIsolated === true` and `VideoEncoder` exists, upload a clip via the file chooser,
   click **Optimize for WhatsApp Status**, wait for the done state.
5. Assert on the output `<video>` and stats: **1080×1920**, duration ≤30s, size under ~15 MB, and
   that the blob is a faststart MP4 (`ftyp` then `moov` near the front, `avc1` video, `mp4a` audio).
   Verify **zero** console errors/warnings throughout (also proves the empty-`.env` path is clean).
6. Clean up: delete generated clips, any downloaded output mp4 in the repo root, and the
   `.playwright-mcp/` dir (it's gitignored). Stop the server.

Reference: the original verification confirmed horizontal 40s → padded 1080×1920, trimmed to
~30s, 13.8 MB H.264+AAC; vertical 20s → kept dimensions, minimal re-encode.
