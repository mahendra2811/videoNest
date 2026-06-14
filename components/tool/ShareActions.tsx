"use client";

import { Download, Share2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { siteConfig } from "@/lib/config/site";
import { getPlatformContent } from "@/lib/content/platforms";
import { type DeviceShareMode, downloadBlob, getShareMode, shareFile } from "@/lib/share/share";
import { strings } from "@/lib/strings";

export function ShareActions({
  blob,
  filename,
  profileId,
}: {
  blob: Blob;
  filename: string;
  profileId: string;
}) {
  const content = getPlatformContent(profileId);
  const [mode, setMode] = React.useState<DeviceShareMode>("desktop");
  const fileRef = React.useRef<File | null>(null);

  React.useEffect(() => {
    const file = new File([blob], filename, { type: "video/mp4" });
    fileRef.current = file;
    setMode(getShareMode(file));
  }, [blob, filename]);

  const handleDownload = () => {
    downloadBlob(blob, filename);
    track("downloaded", { platform: profileId });
    toast.success("Saved! Now post it from the app.");
  };

  const handleShare = async () => {
    const file = fileRef.current;
    if (!file) return;
    try {
      const shared = await shareFile(file, {
        title: `${siteConfig.name} — optimized video`,
        text: content.shareText,
      });
      if (shared) track("shared", { platform: profileId });
    } catch {
      toast.error("Couldn't open the share sheet. Try Download instead.");
    }
  };

  const canShare = mode === "mobile-share";
  const hint =
    mode === "mobile-share"
      ? content.share.mobileShare
      : mode === "mobile-download"
        ? content.share.mobileDownload
        : content.share.desktop;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {canShare && (
          <Button onClick={handleShare} className="h-14 flex-1 text-base" size="lg">
            <Share2 className="h-5 w-5" />
            {content.shareButtonLabel}
          </Button>
        )}
        <Button
          onClick={handleDownload}
          variant={canShare ? "secondary" : "primary"}
          className="h-14 flex-1 text-base"
          size="lg"
        >
          <Download className="h-5 w-5" />
          Download
        </Button>
      </div>
      <p className="text-center text-sm text-muted">{hint}</p>
      {profileId.startsWith("whatsapp") && (
        <p className="text-center text-xs text-muted">{strings.share.whatsappHd}</p>
      )}
    </div>
  );
}
