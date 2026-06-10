"use client";

import { Check, Download, Share } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { detectPlatform, type Platform } from "@/lib/pwa/platform";
import { useInstallPrompt } from "@/lib/pwa/useInstallPrompt";

const INSTRUCTIONS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "Install on iPhone / iPad",
    steps: [
      "Open this page in Safari.",
      "Tap the Share button (the square with an arrow).",
      "Choose “Add to Home Screen”, then tap Add.",
    ],
  },
  macos: {
    title: "Install on Mac",
    steps: [
      "Open this page in Safari.",
      "Click Share, then “Add to Dock”. (Or use Chrome/Edge’s install icon in the address bar.)",
    ],
  },
  android: {
    title: "Install on Android",
    steps: [
      "Open this page in Chrome.",
      "Tap the ⋮ menu, then “Install app” / “Add to Home screen”.",
    ],
  },
  windows: {
    title: "Install on Windows",
    steps: ["In Chrome or Edge, click the install icon in the address bar, then Install."],
  },
  desktop: {
    title: "Install on desktop",
    steps: ["In Chrome or Edge, click the install icon in the address bar, then Install."],
  },
};

export function InstallButton({ className }: { className?: string }) {
  const { canPrompt, installed, promptInstall } = useInstallPrompt();
  const [platform, setPlatform] = React.useState<Platform>("desktop");
  const [showSteps, setShowSteps] = React.useState(false);

  React.useEffect(() => setPlatform(detectPlatform()), []);

  if (installed) {
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-surface-2 px-5 py-3 text-sm font-semibold text-foreground">
          <Check className="h-5 w-5 text-brand-via" />
          App installed
        </span>
      </div>
    );
  }

  const handleClick = async () => {
    if (canPrompt) {
      track("app_install_prompt");
      const outcome = await promptInstall();
      if (outcome === "accepted") toast.success("Installing VideoNest…");
      return;
    }
    setShowSteps((s) => !s);
    track("app_install_instructions", { platform });
  };

  const info = INSTRUCTIONS[platform];

  return (
    <div className={className}>
      <Button onClick={handleClick} size="lg" className="w-full sm:w-auto">
        {canPrompt ? <Download className="h-5 w-5" /> : <Share className="h-5 w-5" />}
        {canPrompt ? "Install app" : "How to install"}
      </Button>

      {!canPrompt && showSteps && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 text-left">
          <p className="mb-2 text-sm font-bold tracking-tight">{info.title}</p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
            {info.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
