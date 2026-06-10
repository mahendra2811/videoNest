import { ALL_FORMATS, BlobSource, Input } from "mediabunny";
import { EngineError, type VideoMeta } from "./types";

/**
 * Extract metadata from a source File using Mediabunny. Runs in the worker.
 * Falls back to sane defaults for any field the container doesn't expose, so
 * buildPlan always receives a usable shape.
 */
export async function probe(file: File): Promise<VideoMeta> {
  let input: Input | null = null;
  try {
    input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });

    const format = await input.getFormat().catch(() => null);
    const container = format?.name ?? guessContainerFromName(file.name);

    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new EngineError("DECODE_FAILED", "No video track found in this file.");
    }

    const [width, height, rotation, vcodec] = await Promise.all([
      safe(() => videoTrack.getDisplayWidth(), 0),
      safe(() => videoTrack.getDisplayHeight(), 0),
      safe(() => videoTrack.getRotation(), 0),
      safe(async () => videoTrack.codec ?? "", ""),
    ]);

    // Frame rate is estimated from packet statistics.
    let fps = 0;
    try {
      const stats = await videoTrack.computePacketStats(120);
      fps = stats?.averagePacketRate ?? 0;
    } catch {
      fps = 0;
    }

    const durationSec = await safe(() => input?.computeDuration() ?? 0, 0);

    const audioTrack = await input.getPrimaryAudioTrack().catch(() => null);
    const hasAudio = Boolean(audioTrack);

    const sizeBytes = file.size;
    const bitrate = durationSec > 0 ? Math.round((sizeBytes * 8) / durationSec) : 0;

    return {
      container: container || "unknown",
      vcodec: vcodec || "unknown",
      width: Math.round(width),
      height: Math.round(height),
      fps: fps > 0 ? Number(fps.toFixed(3)) : 0,
      durationSec,
      bitrate,
      // Mediabunny doesn't expose raw pixel format; consumer video is ~always
      // 4:2:0. Leave blank so the planner treats it as acceptable.
      pixfmt: "",
      hasAudio,
      rotation: normalizeRotation(rotation),
      sizeBytes,
    };
  } catch (err) {
    if (err instanceof EngineError) throw err;
    throw new EngineError("DECODE_FAILED", "Could not read this video file.", { cause: err });
  } finally {
    try {
      input?.dispose?.();
    } catch {
      // ignore dispose errors
    }
  }
}

async function safe<T>(fn: () => T | Promise<T>, fallback: T): Promise<T> {
  try {
    const value = await fn();
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeRotation(deg: number): number {
  const r = ((Math.round(deg) % 360) + 360) % 360;
  return r === 90 || r === 180 || r === 270 ? r : 0;
}

function guessContainerFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext || "unknown";
}
