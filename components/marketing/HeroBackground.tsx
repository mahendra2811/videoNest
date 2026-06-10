"use client";

import dynamic from "next/dynamic";
import * as React from "react";

// The shader chunk loads only when we decide to render it (good connection,
// motion allowed, after first paint).
const HeroShader = dynamic(() => import("./HeroShader"), { ssr: false });

type Connection = { saveData?: boolean; effectiveType?: string };

function connectionIsFast(): boolean {
  if (typeof navigator === "undefined") return true;
  const conn = (navigator as unknown as { connection?: Connection }).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.effectiveType && /(^|\s)(slow-2g|2g|3g)\b/.test(conn.effectiveType)) return false;
  return true;
}

/**
 * Hero background: a static sunset gradient that's always present (no layout
 * shift, works everywhere), upgraded to the animated "blur → sharp" shader only
 * after the page has loaded AND the device/connection can afford it. A scrim
 * keeps the headline readable in light and dark themes.
 */
export function HeroBackground() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const reduce =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !connectionIsFast()) return;

    let timer: number | undefined;
    const enable = () => {
      timer = window.setTimeout(() => setShow(true), 500);
    };
    if (document.readyState === "complete") enable();
    else window.addEventListener("load", enable, { once: true });

    return () => {
      window.removeEventListener("load", enable);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Always-present static fallback — a soft sunset wash. */}
      <div
        className={`absolute inset-0 bg-sunset transition-opacity duration-700 ${
          show ? "opacity-0" : "opacity-[0.12]"
        }`}
      />
      {show && <div className="absolute inset-0">{<HeroShader />}</div>}
      {/* Readability scrim: fade the background toward the page color at the
          edges and keep a gentle veil over the center so text stays crisp. */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_130%_at_50%_35%,transparent_0%,var(--background)_78%)]" />
      <div className="absolute inset-0 bg-background/25" />
    </div>
  );
}
