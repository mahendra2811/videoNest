/**
 * Core type definitions for the VideoNest encode engine.
 */

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
  /** Device-specific "best way to share" copy. */
  shareHint: string;
  /** Short marketing blurb for the platform tile. */
  blurb?: string;
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
  sizeBytes: number;
};

/** A concrete plan produced by buildPlan() from (meta, profile). */
export type EncodePlan = {
  /** Target output dimensions (already downscale-only, even, 9:16-padded etc). */
  targetWidth: number;
  targetHeight: number;
  /** True when we must composite onto a blurred 9:16 background. */
  blurPad: boolean;
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
  | { type: "optimize"; id: number; file: File; profileId: string }
  | { type: "probe"; id: number; file: File };

export type WorkerResponse =
  | { type: "progress"; id: number; progress: Progress }
  | { type: "probed"; id: number; meta: VideoMeta }
  | { type: "done"; id: number; results: OptimizeResult[] }
  | { type: "error"; id: number; code: EngineErrorCode; message: string };
