"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/lib/config/site";

const SPLASH_KEY = "vn-splash-seen";

/**
 * Full-screen branded loader shown on first mount only (per session), fading
 * out once the app is interactive. Not shown on subsequent navigations.
 */
export function AppSplash() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Only show once per browser session.
    let seen = false;
    try {
      seen = sessionStorage.getItem(SPLASH_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    setVisible(true);
    try {
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      // ignore storage failures (private mode etc.)
    }

    const timeout = window.setTimeout(() => setVisible(false), reduce ? 350 : 1100);
    return () => window.clearTimeout(timeout);
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background"
          aria-hidden="true"
        >
          <motion.div
            initial={reduce ? { scale: 1 } : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
          >
            <Logo className="h-20 w-20" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg font-bold tracking-tight"
          >
            {siteConfig.name}
          </motion.span>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full w-1/2 bg-sunset"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
