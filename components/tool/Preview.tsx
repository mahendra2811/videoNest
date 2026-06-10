"use client";

import { motion } from "framer-motion";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { OptimizeResult } from "@/lib/engine/types";

type View = "after" | "before";

export function Preview({
  inputUrl,
  outputUrl,
}: {
  inputUrl: string | null;
  outputUrl: string | null;
  result: OptimizeResult;
  profileId: string;
}) {
  const [view, setView] = React.useState<View>("after");
  const src = view === "after" ? outputUrl : inputUrl;

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
