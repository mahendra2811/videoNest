"use client";

import dynamic from "next/dynamic";
import * as React from "react";

// The three.js scene is a separate chunk, fetched only when we decide to render
// it (good connection, motion allowed, after the page has loaded).
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

type Connection = { saveData?: boolean; effectiveType?: string };

function connectionIsFast(): boolean {
  if (typeof navigator === "undefined") return true;
  const conn = (navigator as unknown as { connection?: Connection }).connection;
  if (!conn) return true; // unknown → assume OK
  if (conn.saveData) return false;
  if (conn.effectiveType && /(^|\s)(slow-2g|2g|3g)\b/.test(conn.effectiveType)) return false;
  return true;
}

/**
 * Decorative hero element. Always shows a static gradient orb (no layout shift,
 * works everywhere); upgrades to a subtle rotating 3D nest only after the page
 * has fully loaded AND the device/connection can comfortably afford it.
 */
export function HeroVisual() {
  const [show3d, setShow3d] = React.useState(false);

  React.useEffect(() => {
    const reduce =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !connectionIsFast()) return;

    let timer: number | undefined;
    const enable = () => {
      // Defer a little past load so it never competes with first paint.
      timer = window.setTimeout(() => setShow3d(true), 600);
    };

    if (document.readyState === "complete") {
      enable();
    } else {
      window.addEventListener("load", enable, { once: true });
    }
    return () => {
      window.removeEventListener("load", enable);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="pointer-events-none relative mx-auto h-40 w-40 sm:h-48 sm:w-48"
      aria-hidden="true"
    >
      {/* Static fallback orb — always present. */}
      <div
        className={`absolute inset-2 rounded-full bg-sunset blur-2xl transition-opacity duration-700 ${
          show3d ? "opacity-30" : "opacity-60"
        }`}
      />
      {show3d && (
        <div className="absolute inset-0">
          <HeroScene />
        </div>
      )}
    </div>
  );
}
