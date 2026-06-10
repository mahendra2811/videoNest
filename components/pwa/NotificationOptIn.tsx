"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import {
  type NotifyPermission,
  notifyPermission,
  requestNotifyPermission,
  showLocalNotification,
} from "@/lib/notify/notify";

/**
 * Opt-in control for local notifications. We use them for "your video is ready"
 * alerts and occasional product updates — never for spam, and never via a
 * server (there's no push backend).
 */
export function NotificationOptIn() {
  const [perm, setPerm] = React.useState<NotifyPermission>("unsupported");

  React.useEffect(() => setPerm(notifyPermission()), []);

  if (perm === "unsupported") return null;

  if (perm === "granted") {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted">
        <BellRing className="h-4 w-4 text-brand-via" />
        Notifications are on — we'll ping you when a video is ready.
      </p>
    );
  }

  if (perm === "denied") {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted">
        <BellOff className="h-4 w-4" />
        Notifications are blocked. Enable them in your browser settings.
      </p>
    );
  }

  const enable = async () => {
    const result = await requestNotifyPermission();
    setPerm(result);
    track("notifications_opt_in", { result });
    if (result === "granted") {
      toast.success("Notifications on. We'll let you know when a video is ready.");
      void showLocalNotification("Notifications enabled · VideoNest", {
        body: "You're all set — we'll ping you when your optimized video is ready.",
        tag: "welcome",
      });
    } else if (result === "denied") {
      toast("No problem — you can enable them later in browser settings.");
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={enable}>
      <Bell className="h-4 w-4" />
      Enable notifications
    </Button>
  );
}
