"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Progress } from "@/lib/engine/types";

const STAGE_LABELS: Record<Progress["stage"], string> = {
  analyzing: "Analyzing",
  optimizing: "Optimizing",
  finishing: "Finishing",
};

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProcessingRing({
  progress,
  onCancel,
}: {
  progress: Progress;
  onCancel: () => void;
}) {
  const pct = Math.round(Math.min(Math.max(progress.value, 0), 1) * 100);
  const offset = CIRCUMFERENCE * (1 - Math.min(Math.max(progress.value, 0), 1));
  const label = progress.label ?? STAGE_LABELS[progress.stage];

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        >
          <defs>
            <linearGradient id="ringSunset" x1="0" y1="0" x2={SIZE} y2={SIZE}>
              <stop offset="0%" stopColor="#FF8C42" />
              <stop offset="50%" stopColor="#FF5E78" />
              <stop offset="100%" stopColor="#FF2E93" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#ringSunset)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          <span className="font-mono text-4xl font-bold tabular-nums">{pct}%</span>
          <span className="mt-1 max-w-full truncate text-sm font-medium text-muted">{label}</span>
        </div>
      </div>

      <p className="max-w-xs text-center text-sm text-muted">
        Making your video sharp — keep this open.
      </p>

      <Button variant="secondary" size="lg" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
