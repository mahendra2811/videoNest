"use client";

import * as React from "react";
import { toast } from "sonner";
import { LATEST_UPDATE } from "@/lib/content/updates";
import { notifyPermission, showLocalNotification } from "@/lib/notify/notify";

const STORAGE_KEY = "vn-last-update";

/**
 * Surfaces product updates without a backend: on load, if the latest shipped
 * update differs from what this device last saw, show an in-app toast (and a
 * local notification if the user opted in). First-ever visitors are silently
 * baselined so we never nag a brand-new user.
 */
export function WhatsNew() {
  React.useEffect(() => {
    const update = LATEST_UPDATE;
    if (!update) return;
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }

    if (seen === update.id) return;

    // Persist the baseline regardless of whether we notify.
    try {
      localStorage.setItem(STORAGE_KEY, update.id);
    } catch {
      // ignore storage failures
    }

    // First-ever visit: just baseline, don't announce.
    if (seen === null) return;

    const timer = window.setTimeout(() => {
      toast(update.title, { description: update.body });
      if (notifyPermission() === "granted") {
        void showLocalNotification(`${update.title} · VideoNest`, {
          body: update.body,
          tag: `update-${update.id}`,
          url: "/",
        });
      }
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
