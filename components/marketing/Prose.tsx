import type * as React from "react";
import { cn } from "@/lib/utils";

/** Lightweight prose styling (no typography plugin) for article/legal pages. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-relaxed text-foreground",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold",
        "[&_p]:mb-4 [&_p]:text-muted",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted [&_li]:mb-1.5",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-sunset",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
