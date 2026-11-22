"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SportBall } from "@/components/sport/SportBall";

type Phase = "idle" | "in" | "out";

/** Longest we keep the screen covered waiting for a navigation that never lands. */
const MAX_COVER_MS = 6000;

/**
 * A "full-time whistle" wipe between pages: a dark panel with a teal/blue edge
 * and a spinning ball sweeps over the screen when an internal link is clicked,
 * then slides away once the new page is there. Screen only, and skipped for
 * people who prefer reduced motion (see the .sweep-* rules in globals.css).
 */
export function PageTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastPath, setLastPath] = useState(pathname);

  // The route changed: the new page is in, so reveal it (and ignore the very first render).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setPhase("out");
  }

  // Cover the screen as soon as an internal link is clicked.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page or only a #hash / ?query
      if (url.pathname.startsWith("/api/")) return;

      setPhase("in");
      // If the navigation never lands, don't leave the screen covered.
      setTimeout(() => setPhase((current) => (current === "in" ? "out" : current)), MAX_COVER_MS);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className={`sweep-panel ${phase === "in" ? "sweep-in" : "sweep-out"}`}
      onAnimationEnd={() => {
        if (phase === "out") setPhase("idle");
      }}
    >
      <div className="sweep-ball">
        <SportBall className="anim-ball-spin h-16 w-16" />
      </div>
    </div>
  );
}
