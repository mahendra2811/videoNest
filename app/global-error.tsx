"use client";

import * as React from "react";
import { flags } from "@/lib/config/flags";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (!flags.sentryEnabled) return;
    import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
          background: "#FFF9F5",
          color: "#1A1416",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: "#6B5B60", maxWidth: "24rem" }}>
          An unexpected error occurred. Please reload the page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "1rem",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            background: "linear-gradient(135deg,#FF8C42,#FF5E78,#FF2E93)",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
