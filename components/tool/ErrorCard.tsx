"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolError } from "@/lib/store/tool";

type ErrorCopy = { title: string; body: string; retry: boolean };

const ERROR_MATRIX: Record<string, ErrorCopy> = {
  UNSUPPORTED_BROWSER: {
    title: "This browser can't process video here",
    body: "Try the latest Chrome or Safari. Everything runs on your device, so a modern browser is needed.",
    retry: false,
  },
  UNSUPPORTED_CODEC: {
    title: "We couldn't read this video's format",
    body: "Try re-saving or exporting it as an MP4, then optimize again.",
    retry: true,
  },
  TOO_LARGE: {
    title: "That video is too large",
    body: "The limit is 500 MB. Try a shorter clip or a smaller export.",
    retry: false,
  },
  TOO_LONG: {
    title: "That video is too long",
    body: "The limit is 10 minutes. Trim it down and try again.",
    retry: false,
  },
  OOM: {
    title: "This video was too heavy for your device",
    body: "We retried at a smaller size and it still didn't fit. Try a shorter clip.",
    retry: true,
  },
  DECODE_FAILED: {
    title: "Something went wrong reading this video",
    body: "Try a different file, or re-export it as an MP4.",
    retry: true,
  },
  ENCODE_FAILED: {
    title: "Something went wrong processing this video",
    body: "Try a different file. If it keeps happening, a shorter clip usually works.",
    retry: true,
  },
  CANCELLED: {
    title: "Optimization cancelled",
    body: "No problem — pick a video whenever you're ready.",
    retry: true,
  },
};

const FALLBACK: ErrorCopy = {
  title: "Something went wrong",
  body: "Try a different video file.",
  retry: true,
};

export function ErrorCard({
  error,
  onRetry,
  onReset,
}: {
  error: ToolError;
  onRetry: () => void;
  onReset: () => void;
}) {
  const copy = ERROR_MATRIX[error.code] ?? FALLBACK;

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-brand-via">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold tracking-tight">{copy.title}</h3>
        <p className="text-sm text-muted">{copy.body}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {copy.retry && (
          <Button onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        )}
        <Button variant="secondary" onClick={onReset}>
          Choose another video
        </Button>
      </div>
    </div>
  );
}
