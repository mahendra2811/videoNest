"use client";

import { Camera, Clapperboard, type LucideIcon, MessageCircle, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { track } from "@/lib/analytics";
import type { PlatformProfile } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Camera,
  Clapperboard,
  ThumbsUp,
};

export function PlatformTile({ profile }: { profile: PlatformProfile }) {
  const Icon = ICONS[profile.icon] ?? MessageCircle;
  const isLive = profile.status === "live";

  if (isLive) {
    return (
      <Link
        href="/whatsapp-status-video"
        className="group relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-warm transition-all hover:shadow-warm-lg"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sunset text-white">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold tracking-tight">{profile.label}</p>
          <p className="text-sm text-muted">{profile.blurb}</p>
        </div>
        <span className="mt-1 text-sm font-semibold text-sunset">Optimize now →</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        toast(`${profile.label} support is coming soon.`);
        track("platform_soon_clicked", { platform: profile.id });
      }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-3xl border border-border bg-surface/60 p-5 text-left transition-all hover:bg-surface",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-0.5">
        <p className="font-bold tracking-tight text-foreground/80">{profile.label}</p>
        <p className="text-sm text-muted">{profile.blurb}</p>
      </div>
      <Badge variant="soon" className="absolute right-4 top-4">
        Coming soon
      </Badge>
    </button>
  );
}
