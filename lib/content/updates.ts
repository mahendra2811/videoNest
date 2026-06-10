/**
 * Shipped product-update feed. Because there's no backend, "product update"
 * notifications are driven by this list: when the app loads and the latest id
 * differs from what the user last saw (localStorage), we surface a what's-new
 * notice (and a local notification if they opted in). Add new entries on top of
 * the list as features ship.
 */
export type AppUpdate = {
  id: string;
  date: string;
  title: string;
  body: string;
};

export const APP_UPDATES: AppUpdate[] = [
  {
    id: "2026-06-install-app",
    date: "2026-06-11",
    title: "Install VideoNest as an app",
    body: "Add it to your home screen or desktop — it works offline and stays on your device.",
  },
  {
    id: "2026-06-all-platforms",
    date: "2026-06-10",
    title: "Instagram, YouTube & Facebook are live",
    body: "Optimize videos for every major platform, not just WhatsApp Status.",
  },
];

/** Newest update (the list is maintained newest-first). */
export const LATEST_UPDATE: AppUpdate | undefined = APP_UPDATES[0];
