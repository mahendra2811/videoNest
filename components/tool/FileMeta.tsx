"use client";

import { Clock, Film, HardDrive, Ratio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoMeta } from "@/lib/engine/types";
import { formatBytes, formatDuration, formatLabel, formatResolution } from "@/lib/utils";

function Stat({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-4 w-16" />
        ) : (
          <p className="truncate text-sm font-semibold">{value}</p>
        )}
      </div>
    </div>
  );
}

export function FileMeta({
  file,
  meta,
  loading,
}: {
  file: File;
  meta: VideoMeta | null;
  loading: boolean;
}) {
  const resolution = meta && meta.width > 0 ? formatResolution(meta.width, meta.height) : "—";
  const duration = meta && meta.durationSec > 0 ? formatDuration(meta.durationSec) : "—";
  const codec = meta ? formatLabel(meta.vcodec) : "—";

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat
        icon={<Ratio className="h-5 w-5" />}
        label="Resolution"
        value={resolution}
        loading={loading}
      />
      <Stat
        icon={<Clock className="h-5 w-5" />}
        label="Duration"
        value={duration}
        loading={loading}
      />
      <Stat icon={<HardDrive className="h-5 w-5" />} label="Size" value={formatBytes(file.size)} />
      <Stat icon={<Film className="h-5 w-5" />} label="Codec" value={codec} loading={loading} />
    </div>
  );
}
