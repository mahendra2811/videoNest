// Client instrumentation. Sentry initializes only when a DSN is set.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      });
    })
    .catch(() => {
      // Monitoring must never break the app.
    });
}

// Instrument client-side navigations for Sentry tracing (no-op without a DSN).
export function onRouterTransitionStart(...args: unknown[]): void {
  if (!dsn) return;
  import("@sentry/nextjs")
    .then((Sentry) => {
      (Sentry as any).captureRouterTransitionStart?.(...args);
    })
    .catch(() => {});
}
