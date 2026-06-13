"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { OptimizeResult } from "@/lib/engine/types";
import { formatDuration } from "@/lib/utils";

type View = "after" | "before";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

function formatMbps(bitsPerSec: number): string {
  if (!bitsPerSec || bitsPerSec <= 0) return "—";
  return `${(bitsPerSec / 1_000_000).toFixed(1)} Mbps`;
}

export function Preview({
  inputUrl,
  outputUrl,
  result,
}: {
  inputUrl: string | null;
  outputUrl: string | null;
  result: OptimizeResult;
  profileId: string;
}) {
  const [view, setView] = React.useState<View>("after");
  const src = view === "after" ? outputUrl : inputUrl;

  const { meta, output } = result;
  const inBitrate =
    meta.bitrate ||
    (meta.sizeBytes && meta.durationSec ? (meta.sizeBytes * 8) / meta.durationSec : 0);
  const outBitrate =
    output.sizeBytes && output.durationSec ? (output.sizeBytes * 8) / output.durationSec : 0;

  const rows: { label: string; before: string; after: string }[] = [
    {
      label: "Resolution",
      before: meta.width ? `${meta.width}×${meta.height}` : "—",
      after: `${output.width}×${output.height}`,
    },
    {
      label: "Duration",
      before: meta.durationSec ? formatDuration(meta.durationSec) : "—",
      after: formatDuration(output.durationSec),
    },
    {
      label: "File size",
      before: formatBytes(meta.sizeBytes),
      after: formatBytes(output.sizeBytes),
    },
    { label: "Bitrate", before: formatMbps(inBitrate), after: formatMbps(outBitrate) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <p className="text-center text-base font-bold tracking-tight">Your video is ready ✨</p>

      <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface-2 p-1">
        <ToggleButton active={view === "before"} onClick={() => setView("before")}>
          Before
        </ToggleButton>
        <ToggleButton active={view === "after"} onClick={() => setView("after")}>
          After
        </ToggleButton>
      </div>

      <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl border border-border bg-black">
        {src ? (
          <video
            key={view}
            src={src}
            controls
            playsInline
            muted
            className="max-h-[46vh] w-full object-contain"
          />
        ) : (
          <div className="aspect-[9/16] w-full" />
        )}
        <Badge variant="sunset" className="absolute left-3 top-3">
          {view === "after" ? "After" : "Before"}
        </Badge>
      </div>

      {/* Before / after stats (C3) */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-surface-2 px-3 py-2 text-[11px] font-medium text-muted">
          <span />
          <span className="text-center">Before</span>
          <span className="text-center text-brand-via">After</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[1.2fr_1fr_1fr] items-center border-border border-t px-3 py-2 text-xs"
          >
            <span className="text-muted">{r.label}</span>
            <span className="text-center font-mono text-muted">{r.before}</span>
            <span className="text-center font-mono font-medium">{r.after}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted">
        We prepare your video so the platform's own compression does the least damage.
      </p>
    </motion.div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
        active ? "bg-surface text-foreground shadow-warm" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
