import type {
  AudioMix,
  EncodeOptions,
  Overlay,
  PlatformProfile,
  TextLayer,
  VideoCodecChoice,
  VideoMeta,
} from "@/lib/engine/types";

/** Local UI state for the optional Edit step. Converted to EncodeOptions on submit. */
export type EditState = {
  /** Trim window in seconds, or null for the full clip. */
  trim: { start: number; end: number } | null;
  /** How off-aspect sources are handled. */
  aspectMode: "fit" | "fill";
  /** Normalized crop region in source space (0..1) for Fill / reframe. */
  cropRect: { x: number; y: number; width: number; height: number } | null;
  /** Burned-in text + sticker layers. */
  overlays: Overlay[];
  /** Background-music selection. */
  music: { file: File; mode: "replace" | "mix"; volume: number; duck: boolean } | null;
  /** Light unsharp (opt-in). */
  sharpen: boolean;
  /** Loudness normalize to −14 LUFS (opt-in). */
  normalizeLoudness: boolean;
  /** YouTube-only quality ceiling. */
  youtubeQuality: "1080p" | "1440p" | "4K";
  /** YouTube-only codec choice. */
  videoCodec: VideoCodecChoice;
};

export function initialEditState(): EditState {
  return {
    trim: null,
    aspectMode: "fit",
    cropRect: null,
    overlays: [],
    music: null,
    sharpen: false,
    normalizeLoudness: false,
    youtubeQuality: "1080p",
    videoCodec: "avc",
  };
}

/** Scalar options we persist and pre-apply on the next visit (E3). */
export type RememberedEditOptions = Pick<
  EditState,
  "sharpen" | "normalizeLoudness" | "aspectMode" | "youtubeQuality" | "videoCodec"
>;

/** A fresh edit state seeded with the user's remembered scalar options (E3). */
export function editStateWithRemembered(remembered: RememberedEditOptions): EditState {
  return { ...initialEditState(), ...remembered };
}

/** Extract the persistable scalar options from the current edit state. */
export function rememberedFromEditState(s: EditState): RememberedEditOptions {
  return {
    sharpen: s.sharpen,
    normalizeLoudness: s.normalizeLoudness,
    aspectMode: s.aspectMode,
    youtubeQuality: s.youtubeQuality,
    videoCodec: s.videoCodec,
  };
}

/** A reasonable default text layer (centred, legible). */
export function makeTextLayer(text = "Your text"): TextLayer {
  return {
    type: "text",
    id: `t${Math.round(performance.now())}-${text.length}`,
    text,
    x: 0.5,
    y: 0.85,
    size: 0.06,
    color: "#ffffff",
    fontFamily: "system-ui, sans-serif",
    align: "center",
    background: true,
    shadow: true,
  };
}

/** True when the source aspect differs from the target enough to need a choice. */
export function isOffAspect(profile: PlatformProfile, meta: VideoMeta | null): boolean {
  if (!meta || meta.width <= 0 || meta.height <= 0) return false;
  if (profile.aspect === "source") return false;
  const target = profile.aspect === "9:16" ? 9 / 16 : 16 / 9;
  return Math.abs(meta.width / meta.height - target) > 0.02;
}

/** True when the user has made any edit that changes the default optimize. */
export function hasEdits(s: EditState, profile: PlatformProfile): boolean {
  return (
    s.trim !== null ||
    s.aspectMode === "fill" ||
    s.cropRect !== null ||
    s.overlays.length > 0 ||
    s.music !== null ||
    s.sharpen ||
    s.normalizeLoudness ||
    (profile.brand === "youtube" && (s.youtubeQuality !== "1080p" || s.videoCodec !== "avc"))
  );
}

/** Build the engine EncodeOptions from the editor state for a given platform. */
export function editStateToOptions(s: EditState, profile: PlatformProfile): EncodeOptions {
  const opts: EncodeOptions = {
    sharpen: s.sharpen,
    normalizeLoudness: s.normalizeLoudness,
    aspectMode: s.aspectMode,
  };
  if (s.trim) opts.trim = s.trim;
  if (s.cropRect) opts.cropRect = s.cropRect;
  if (s.overlays.length > 0) opts.overlays = s.overlays;
  if (s.music) {
    const mix: AudioMix = {
      mode: s.music.mode,
      volume: s.music.volume,
      duckOriginal: s.music.duck,
    };
    opts.audioMix = mix;
    opts.musicFile = s.music.file;
  }
  if (profile.brand === "youtube") {
    opts.youtubeQuality = s.youtubeQuality;
    opts.videoCodec = s.videoCodec;
  }
  return opts;
}
