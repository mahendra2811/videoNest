/**
 * Local (on-device) notifications — no backend, no push subscription.
 * Used for transactional alerts ("your video is ready") and product-update
 * "what's new" notices. Everything is guarded so call sites never throw.
 */

export type NotifyPermission = "default" | "granted" | "denied" | "unsupported";

export function notifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyPermission(): NotifyPermission {
  if (!notifySupported()) return "unsupported";
  return Notification.permission as NotifyPermission;
}

/** Request permission (must be called from a user gesture). */
export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (!notifySupported()) return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotifyPermission;
  } catch {
    return notifyPermission();
  }
}

type NotifyOptions = {
  body?: string;
  tag?: string;
  /** URL to open/focus when the notification is clicked. */
  url?: string;
  renotify?: boolean;
};

/**
 * Show a local notification. Prefers the service worker registration (works
 * when the tab is backgrounded / on mobile), falling back to the Notification
 * constructor. Returns false if not permitted or unsupported.
 */
export async function showLocalNotification(
  title: string,
  opts: NotifyOptions = {},
): Promise<boolean> {
  if (notifyPermission() !== "granted") return false;

  const options: NotificationOptions & { renotify?: boolean } = {
    body: opts.body,
    icon: "/icon-192.png",
    badge: "/favicon-48.png",
    tag: opts.tag,
    renotify: opts.renotify,
    data: { url: opts.url ?? "/" },
  };

  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
    // Fallback for browsers without an active SW registration.
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
