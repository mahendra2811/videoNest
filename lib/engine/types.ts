/**
 * Core type definitions for the VideoNest encode engine.
 */

/** Output video codec choice. AV1/HEVC are opt-in (YouTube) and capability-gated. */
export type VideoCodecChoice = "avc" | "av1" | "hevc";

/**
 * A real, measured platform output (from the A1 measurement protocol). When
 * present on a profile, buildPlan() targets just under the measured bitrate and
 * matches the measured resolution/fps, so the platform's own re-encode is as
 * close to passthrough as possible.
 */
export type MeasuredOutput = {
  width: number;
  height: number;
  fps: number;
  /** Measured video bitrate in bits/sec. */
  vBitrate: number;
  vCodec: string;
  profile?: string;
  pixFmt?: string;
  /** Measured audio bitrate in bits/sec. */
  aBitrate?: number;
};

/**
 * Per-run user choices (from the optional Edit step). All optional; the engine
 * works with an empty object. Threaded buildPlan ← run ← worker ← optimize().
 */
export type EncodeOptions = {
  /** Light unsharp mask. Default false (off). */
  sharpen?: boolean;
  /** EBU R128 loudness normalize to −14 LUFS. Default false (off). */
  normalizeLoudness?: boolean;
  /** Preferred output codec (YouTube only); falls back to avc if unsupported. */
  videoCodec?: VideoCodecChoice;
  /** YouTube quality ceiling chosen by the user. Caps the target long edge. */
  youtubeQuality?: "1080p" | "1440p" | "4K";
  /** Manual aspect handling for off-aspect sources (editor B1). */
  aspectMode?: "fit" | "fill";
  /** Normalized crop rect in source space (0..1). Editor B1 (Fill / reframe). */
  cropRect?: { x: number; y: number; width: number; height: number };
  /** Explicit trim window in seconds (editor B1). */
  trim?: { start: number; end: number };
};

/** A platform-specific output profile (see lib/config/profiles.ts). */
export type PlatformProfile = {
  id: string;
  label: string;
  status: "live" | "soon";
  /** Route slug for this platform's tool page (e.g. "instagram-reels-video"). */
  slug: string;
  /** Brand family, used to group platforms on the home grid. */
  brand: "whatsapp" | "instagram" | "youtube" | "facebook";
  /** Short format label within the brand (e.g. "Status", "Reels", "Shorts"). */
  format: string;
  /** lucide-react icon name (resolved in the UI). */
  icon: string;
  aspect: "9:16" | "16:9" | "source";
  maxWidth: number;
  maxHeight: number;
  maxDurationSec: number;
  fpsCap: number;
  sizeCapMB?: number;
  bitrateStrategy: "constrained" | "overprovision";
  audio: { codec: "aac"; bitrateKbps: number };
  /** If true, sources over maxDurationSec are split into sequential segments
   * instead of trimmed (e.g. WhatsApp Status). */
  splitOversize?: boolean;
  /** Overprovision video bitrate per (w*h*fps). Higher = more bits for the
   * platform's re-encode to preserve. Ignored for the constrained strategy.
   * Defaults to 0.13. */
  bitratePerPixel?: number;
  /** Upper clamp for the overprovision bitrate (bits/s). Defaults to 20 Mbps. */
  maxBitrate?: number;
  /** Keyframe interval in seconds (closed GOP). Defaults to 2. YouTube prefers ~1. */
  gopSec?: number;
  /** Allowed output codecs the user may pick (YouTube). First entry is default. */
  codecOptions?: VideoCodecChoice[];
  /** Real measured output for this platform (A1). Preferred over researched values. */
  measuredOutput?: MeasuredOutput;
  /** Device-specific "best way to share" copy. */
  shareHint: string;
  /** Short marketing blurb for the platform tile. */
  blurb?: string;
  /** Spec provenance, so profiles don't silently drift. */
  lastVerified?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low";
};

/** Metadata probed from the source file. */
export type VideoMeta = {
  container: string;
  vcodec: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  /** Estimated overall bitrate in bits/sec (0 if unknown). */
  bitrate: number;
  pixfmt: string;
  hasAudio: boolean;
  /** Rotation in degrees clockwise (0/90/180/270). */
  rotation: number;
  /** True when the source is High Dynamic Range (BT.2020/PQ/HLG). */
  isHdr: boolean;
  sizeBytes: number;
};

/** A concrete plan produced by buildPlan() from (meta, profile). */
export type EncodePlan = {
  /** Target output dimensions (already downscale-only, even, 9:16-padded etc). */
  targetWidth: number;
  targetHeight: number;
  /** True when we must composite onto a blurred 9:16 background. */
  blurPad: boolean;
  /** Manual aspect handling: "fit" = blur-pad, "fill" = crop-to-fill. */
  aspectMode: "fit" | "fill";
  /** Normalized crop rect in source space (0..1), when the user reframes / fills. */
  cropRect?: { x: number; y: number; width: number; height: number };
  /** Use the high-quality stepped/Lanczos downscaler (IG/WhatsApp/FB). */
  hqDownscale: boolean;
  /** Output video codec (avc by default; av1/hevc for YouTube when supported). */
  videoCodec: VideoCodecChoice;
  /** Apply a light unsharp mask before encode (opt-in, default false). */
  sharpen: boolean;
  /** Normalize loudness to −14 LUFS (opt-in, default false). */
  normalizeLoudness: boolean;
  /** Output frame rate. */
  fps: number;
  /** Trim to this many seconds from the start (undefined = keep full). */
  trimToSec?: number;
  /** Explicit trim window (overrides trimToSec). Used for segment encoding. */
  trim?: { start: number; end: number };
  /** True when the source is already optimal -> minimal re-encode. */
  fastPath: boolean;
  /** Target video bitrate in bits/sec. */
  videoBitrate: number;
  /** Audio settings (null when source has no audio). */
  audio: { codec: "aac"; bitrate: number; sampleRate: number } | null;
  /** Keyframe interval in frames (2s closed GOP). */
  keyFrameIntervalSec: number;
  /** The effective duration after any trim (used for size budgeting). */
  effectiveDurationSec: number;
  /** Size ceiling in bytes that the plan targets. */
  sizeCapBytes: number;
  /** Human-readable notes for telemetry/UI (e.g. "trimmed", "blur-padded"). */
  notes: string[];
};

/** Information about the produced output file. */
export type OutputInfo = {
  width: number;
  height: number;
  durationSec: number;
  sizeBytes: number;
  filename: string;
};

/** Which engine path executed. */
export type EnginePath = "webcodecs" | "ffmpeg" | "server";

/** Progress stages surfaced to the UI. */
export type ProgressStage = "analyzing" | "optimizing" | "finishing";

export type Progress = {
  stage: ProgressStage;
  /** 0..1 overall fraction. */
  value: number;
  /** Optional human label for the current step. */
  label?: string;
};

export type OnProgress = (p: Progress) => void;

/** When a source is split into segments, which part this result is. */
export type SegmentInfo = {
  index: number; // 0-based
  total: number;
  startSec: number;
  endSec: number;
};

/** Result of a full optimize() call (one output file). */
export type OptimizeResult = {
  blob: Blob;
  meta: VideoMeta;
  output: OutputInfo;
  plan: EncodePlan;
  path: EnginePath;
  /** Present only when the source was split into multiple segments. */
  part?: SegmentInfo;
};

/** Error codes the UI maps to friendly messages (see §10). */
export type EngineErrorCode =
  | "UNSUPPORTED_BROWSER"
  | "UNSUPPORTED_CODEC"
  | "OOM"
  | "TOO_LARGE"
  | "TOO_LONG"
  | "DECODE_FAILED"
  | "ENCODE_FAILED"
  | "CANCELLED";

export class EngineError extends Error {
  code: EngineErrorCode;
  constructor(code: EngineErrorCode, message?: string, options?: { cause?: unknown }) {
    super(message ?? code, options);
    this.name = "EngineError";
    this.code = code;
  }
}

/** Hard input limits enforced at file selection (Dropzone) and probe. */
export const INPUT_LIMITS = {
  maxFileBytes: 500 * 1024 * 1024, // 500 MB
  maxDurationSec: 10 * 60, // 10 minutes
} as const;

/** Worker message protocol. */
export type WorkerRequest =
  | { type: "optimize"; id: number; file: File; profileId: string; options?: EncodeOptions }
  | { type: "probe"; id: number; file: File };

export type WorkerResponse =
  | { type: "progress"; id: number; progress: Progress }
  | { type: "probed"; id: number; meta: VideoMeta }
  | { type: "done"; id: number; results: OptimizeResult[] }
  | { type: "error"; id: number; code: EngineErrorCode; message: string };
