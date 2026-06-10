import { canEncodeVideo } from "mediabunny";
import type { EncodePlan } from "./types";

/** True if the WebCodecs VideoEncoder API exists in this context. */
export function hasWebCodecs(): boolean {
  return typeof globalThis !== "undefined" && typeof globalThis.VideoEncoder !== "undefined";
}

/**
 * Decide whether the WebCodecs (Mediabunny) path can produce H.264 for this
 * plan. Tries Mediabunny's capability check first, then a raw
 * VideoEncoder.isConfigSupported probe across common AVC levels.
 */
export async function canUseWebCodecs(plan: EncodePlan): Promise<boolean> {
  if (!hasWebCodecs()) return false;

  // Mediabunny's own check (knows how it will configure the encoder).
  try {
    const ok = await canEncodeVideo("avc", {
      width: plan.targetWidth,
      height: plan.targetHeight,
      bitrate: plan.videoBitrate,
    });
    if (ok) return true;
  } catch {
    // fall through to raw probe
  }

  // Raw WebCodecs probe — High profile at a few levels.
  const codecs = ["avc1.640028", "avc1.64002A", "avc1.4D4028", "avc1.42E028"];
  for (const codec of codecs) {
    try {
      const support = await globalThis.VideoEncoder.isConfigSupported({
        codec,
        width: plan.targetWidth,
        height: plan.targetHeight,
        bitrate: plan.videoBitrate,
        framerate: plan.fps,
      });
      if (support?.supported) return true;
    } catch {
      // try next codec string
    }
  }

  return false;
}
