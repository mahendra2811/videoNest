"use client";

import { ChevronDown, Download, Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { canShareFiles, downloadBlob, shareFile } from "@/lib/share/share";

/**
 * B6 — "Compare on your Status" honest quality test. Lets the user post BOTH
 * the optimized file and their original (unoptimised) clip to Status and judge
 * the difference for themselves. No overclaiming — it's about showing the damage
 * platform recompression does to an unoptimised upload.
 */
export function CompareOnStatus({
  optimizedBlob,
  optimizedName,
  original,
}: {
  optimizedBlob: Blob;
  optimizedName: string;
  original: File | null;
}) {
  const [open, setOpen] = React.useState(false);
  const canShare = typeof navigator !== "undefined" && canShareFiles();

  const send = async (blob: Blob, name: string, label: string) => {
    const file = new File([blob], name, { type: blob.type || "video/mp4" });
    if (canShare) {
      const ok = await shareFile(file, { title: label, text: label });
      if (ok) return;
    }
    downloadBlob(blob, name);
    toast.success(`Saved ${label}.`);
  };

  if (!original) return null;

  return (
    <div className="rounded-2xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm"
      >
        <span className="flex-1 font-medium">Want proof? Compare on your Status</span>
        <ChevronDown
          className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-border border-t px-4 py-3">
          <p className="text-xs text-muted">
            Post both clips to your Status, then look at each after it's uploaded — you'll see the
            difference the platform's compression makes on an unoptimised vs an optimised file.
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => send(optimizedBlob, optimizedName, "optimised version")}
            >
              {canShare ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              Optimised version
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                send(original, `original-${original.name || "video.mp4"}`, "original (unoptimised)")
              }
            >
              {canShare ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              Original (unoptimised)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
