"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { flags } from "@/lib/config/flags";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Report to Sentry only if it's enabled.
    if (!flags.sentryEnabled) return;
    import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {
        // ignore — monitoring must never break the error page
      });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sunset text-white">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted">
          An unexpected error occurred. Your videos are safe — nothing was uploaded.
        </p>
      </div>
      <Button onClick={reset} size="lg">
        Try again
      </Button>
    </div>
  );
}
