"use client";

import * as React from "react";
import { isStandalone } from "./platform";

// The non-standard beforeinstallprompt event (Chromium).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Captures Chromium's beforeinstallprompt so we can offer a real in-app Install
 * button (Android + desktop Chrome/Edge). On browsers without it (iOS/Mac
 * Safari, Firefox) `canPrompt` is false and the UI shows manual instructions.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    if (isStandalone()) setInstalled(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return { canPrompt: Boolean(deferred), installed, promptInstall };
}
