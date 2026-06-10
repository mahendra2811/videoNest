// Server/edge instrumentation. Sentry initializes only when a DSN is set, so
// an empty .env produces no monitoring and no errors.

export async function register(): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    // webpackIgnore keeps the heavy Sentry/OpenTelemetry server SDK out of the
    // bundle; it's resolved natively at runtime only when a DSN is configured.
    const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs");
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: true,
    });
  }
}

export async function onRequestError(...args: any[]): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import(/* webpackIgnore: true */ "@sentry/nextjs");
  (Sentry as any).captureRequestError?.(...args);
}
