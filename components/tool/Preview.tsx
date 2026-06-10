"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { getPlatformContent } from "@/lib/content/platforms";
import type { OptimizeResult } from "@/lib/engine/types";
import { formatBytes, formatResolution } from "@/lib/utils";

type View = "after" | "before";

export function Preview({
  inputUrl,
  outputUrl,
  result,
  profileId,
}: {
  inputUrl: string | null;
  outputUrl: string | null;
  result: OptimizeResult;
  profileId: string;
}) {
  const [view, setView] = React.useState<View>("after");
  const promise = getPlatformContent(profileId).promise;

  const { output, meta } = result;
  const inSize = meta.sizeBytes;
  const outSize = output.sizeBytes;
  const delta = inSize > 0 ? Math.round((1 - outSize / inSize) * 100) : 0;
  const src = view === "after" ? outputUrl : inputUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-surface-2 p-1">
        <ToggleButton active={view === "before"} onClick={() => setView("before")}>
          Original
        </ToggleButton>
        <ToggleButton active={view === "after"} onClick={() => setView("after")}>
          Optimized
        </ToggleButton>
      </div>

      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-3xl border border-border bg-black">
        {src ? (
          <video
            key={view}
            src={src}
            controls
            playsInline
            muted
            className="aspect-[9/16] h-full w-full object-contain"
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="aspect-[9/16] w-full" />
        )}
        <Badge variant="sunset" className="absolute left-3 top-3">
          {view === "after" ? "Optimized" : "Original"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Resolution" value={formatResolution(output.width, output.height)} />
        <Stat label="New size" value={formatBytes(outSize)} />
        <Stat
          label={delta >= 0 ? "Smaller" : "Larger"}
          value={`${delta >= 0 ? "" : "+"}${Math.abs(delta)}%`}
        />
      </div>

      <p className="text-center text-xs text-muted">{promise}</p>
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
      className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
        active ? "bg-surface text-foreground shadow-warm" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
