import { create } from "zustand";
import type { OptimizeResult, Progress, VideoMeta } from "@/lib/engine/types";

export type ToolPhase = "idle" | "selected" | "processing" | "done" | "error";

export type ToolError = { code: string; message: string };

type ToolState = {
  phase: ToolPhase;
  file: File | null;
  meta: VideoMeta | null;
  /** True while the selected file's metadata is still being probed. */
  probing: boolean;
  progress: Progress;
  /** One result per output file (usually 1; >1 when split into segments). */
  results: OptimizeResult[];
  /** Object URLs aligned with `results`. */
  outputUrls: string[];
  inputUrl: string | null;
  error: ToolError | null;

  selectFile: (file: File) => void;
  setMeta: (meta: VideoMeta | null) => void;
  setProbing: (probing: boolean) => void;
  startProcessing: () => void;
  setProgress: (progress: Progress) => void;
  setDone: (results: OptimizeResult[]) => void;
  setError: (error: ToolError) => void;
  reset: () => void;
};

const initialProgress: Progress = { stage: "analyzing", value: 0 };

function revoke(url: string | null) {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

function revokeAll(urls: string[]) {
  for (const u of urls) revoke(u);
}

export const useToolStore = create<ToolState>((set, get) => ({
  phase: "idle",
  file: null,
  meta: null,
  probing: false,
  progress: initialProgress,
  results: [],
  outputUrls: [],
  inputUrl: null,
  error: null,

  selectFile: (file) => {
    const { inputUrl, outputUrls } = get();
    revoke(inputUrl);
    revokeAll(outputUrls);
    set({
      phase: "selected",
      file,
      meta: null,
      probing: true,
      progress: initialProgress,
      results: [],
      outputUrls: [],
      inputUrl: URL.createObjectURL(file),
      error: null,
    });
  },

  setMeta: (meta) => set({ meta }),
  setProbing: (probing) => set({ probing }),

  startProcessing: () => set({ phase: "processing", progress: initialProgress, error: null }),

  setProgress: (progress) => set({ progress }),

  setDone: (results) => {
    revokeAll(get().outputUrls);
    set({
      phase: "done",
      results,
      outputUrls: results.map((r) => URL.createObjectURL(r.blob)),
      progress: { stage: "finishing", value: 1 },
    });
  },

  setError: (error) => set({ phase: "error", error }),

  reset: () => {
    const { inputUrl, outputUrls } = get();
    revoke(inputUrl);
    revokeAll(outputUrls);
    set({
      phase: "idle",
      file: null,
      meta: null,
      probing: false,
      progress: initialProgress,
      results: [],
      outputUrls: [],
      inputUrl: null,
      error: null,
    });
  },
}));
