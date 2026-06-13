# VideoNest — Roadmap & deferred designs

Items intentionally **not built now**, documented so they stay additive (no
rewrite). Each maps to a spec tag.

---

## A7 — AI Enhance (super-resolution / deblur) · **[SOON]**

The one gap competitors won't fill: genuinely improving a *low-quality* source
before upload. **Not built.** A clearly-inert "Coming soon: AI Enhance"
affordance ships today (mobile More sheet) so the roadmap is visible.

**Planned approach (v2):**
- On-device super-resolution / deblur via an ONNX model (Real-ESRGAN-class),
  run with **ONNX Runtime Web + WebGPU**.
- Strictly **opt-in**, with a model-download progress step and copy that clearly
  says it **changes the footage** (not "restores" — honest framing).
- Heavy; likely paired with the server tier (F1) for large jobs.
- Gated behind `isPremiumFeature("ai-enhance")` if it becomes a premium feature
  (`lib/config/premium.ts`). Core optimisation stays free regardless.

No model is shipped. No inference code exists yet.

---

## F1 — Server heavy-tier (4K / long / unsupported) · **[BACKLOG]**

A dormant, opt-in native-FFmpeg server tier for sources too heavy for the
browser. A minimal dormant scaffold already exists (`app/api/heavy/*`,
`lib/heavy/*`), returning 503 unless both `NEXT_PUBLIC_SERVER_TIER_ENABLED=true`
**and** a Vercel Blob token are present. **Do not expand now.**

**Design when activated:**
- **Trigger conditions:** probe shows >1080p **and** >~5 min, or a codec
  WebCodecs can't handle, or repeated OOM on-device.
- **Explicit user opt-in** upload with a privacy notice — the only path where a
  video leaves the device.
- Native **FFmpeg** (libx264 / AV1, 2-pass) for quality.
- **Auto-delete** the upload immediately after processing.
- Keep VideoNest **fully client-side by default** — the tier never activates on
  its own.

---

## D4 — Native app (Capacitor) · **[SKIP — v2]**

Wrap the PWA with Capacitor for Play Store / App Store presence in a later v2.
This is a **discovery** play, not a quality one — the on-device engine already
runs in the WebView. A scaffold exists (`capacitor.config.ts`) loading the
deployed URL via `server.url`. Not a current priority; do not build out native
projects in CI.
