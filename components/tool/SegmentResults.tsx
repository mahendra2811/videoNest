"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { ShareActions } from "@/components/tool/ShareActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { getPlatformContent } from "@/lib/content/platforms";
import type { OptimizeResult } from "@/lib/engine/types";
import { downloadBlob } from "@/lib/share/share";
import { formatBytes, formatDuration } from "@/lib/utils";

export function SegmentResults({
  results,
  outputUrls,
  profileId,
}: {
  results: OptimizeResult[];
  outputUrls: string[];
  profileId: string;
}) {
  const content = getPlatformContent(profileId);
  const total = results.length;

  const handleDownloadAll = () => {
    results.forEach((r, i) => {
      // Stagger downloads so the browser doesn't drop them.
      setTimeout(() => downloadBlob(r.blob, r.output.filename), i * 700);
    });
    track("downloaded", { platform: profileId, parts: total });
    toast.success(`Downloading all ${total} parts. Post them in order.`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-surface-2 p-4 text-center">
        <p className="text-sm font-semibold">Split into {total} parts</p>
        <p className="mt-1 text-xs text-muted">{content.promise} Post the parts in order.</p>
      </div>

      <Button onClick={handleDownloadAll} size="lg">
        <Download className="h-5 w-5" />
        Download all {total} parts
      </Button>

      <div className="flex flex-col gap-6">
        {results.map((r, i) => (
          <div
            key={r.output.filename}
            className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold tracking-tight">Part {i + 1}</span>
              {r.part && (
                <Badge variant="default">
                  {formatDuration(r.part.startSec)}–{formatDuration(r.part.endSec)}
                </Badge>
              )}
            </div>
            <div className="mx-auto w-full max-w-[200px] overflow-hidden rounded-2xl border border-border bg-black">
              <video
                src={outputUrls[i]}
                controls
                playsInline
                muted
                className="aspect-[9/16] h-full w-full object-contain"
              >
                <track kind="captions" />
              </video>
            </div>
            <p className="text-center text-xs text-muted">
              {r.output.width} × {r.output.height} · {formatBytes(r.output.sizeBytes)}
            </p>
            <ShareActions blob={r.blob} filename={r.output.filename} profileId={profileId} />
          </div>
        ))}
      </div>
    </div>
  );
}
