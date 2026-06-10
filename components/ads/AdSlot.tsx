"use client";

import * as React from "react";
import { flags } from "@/lib/config/flags";
import { cn } from "@/lib/utils";

type AdSlotProps = {
  slot?: string;
  className?: string;
  format?: string;
};

/**
 * Renders an AdSense unit only when ads are enabled (flag true AND client id
 * present). When disabled it renders nothing — flipping the flag later "just
 * works" without touching layouts.
 */
export function AdSlot({ slot, className, format = "auto" }: AdSlotProps) {
  const ref = React.useRef<HTMLModElement>(null);

  React.useEffect(() => {
    if (!flags.adsEnabled) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      // ignore — never break the page on ad errors
    }
  }, []);

  if (!flags.adsEnabled) return null;

  return (
    <div className={cn("my-8 flex w-full justify-center", className)} aria-hidden="true">
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={flags.adsClientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
