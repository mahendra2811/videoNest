"use client";

import { Download, Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { siteConfig } from "@/lib/config/site";
import { type DeviceShareMode, downloadBlob, getShareMode, shareFile } from "@/lib/share/share";

const HINTS: Record<DeviceShareMode, string> = {
  "mobile-share":
    "Tap Share to WhatsApp, then choose My Status. Quality is the same as downloading — we already optimized it.",
  "mobile-download": "Tap Download, then post it from the WhatsApp app.",
  desktop:
    "Download, then post from your phone's WhatsApp app (not WhatsApp Web — it compresses harder).",
};

export function ShareActions({ blob, filename }: { blob: Blob; filename: string }) {
  const [mode, setMode] = React.useState<DeviceShareMode>("desktop");
  const fileRef = React.useRef<File | null>(null);

  React.useEffect(() => {
    const file = new File([blob], filename, { type: "video/mp4" });
    fileRef.current = file;
    setMode(getShareMode(file));
  }, [blob, filename]);

  const handleDownload = () => {
    downloadBlob(blob, filename);
    track("downloaded");
    toast.success("Saved! Now post it from the WhatsApp app.");
  };

  const handleShare = async () => {
    const file = fileRef.current;
    if (!file) return;
    try {
      const shared = await shareFile(file, {
        title: `${siteConfig.name} — optimized video`,
        text: "Optimized for WhatsApp Status",
      });
      if (shared) track("shared");
    } catch {
      toast.error("Couldn't open the share sheet. Try Download instead.");
    }
  };

  const canShare = mode === "mobile-share";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {canShare && (
          <Button onClick={handleShare} className="flex-1" size="lg">
            <Share2 className="h-5 w-5" />
            Share to WhatsApp
          </Button>
        )}
        <Button
          onClick={handleDownload}
          variant={canShare ? "secondary" : "primary"}
          className="flex-1"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Download
        </Button>
      </div>
      <p className="text-center text-sm text-muted">{HINTS[mode]}</p>
    </div>
  );
}
