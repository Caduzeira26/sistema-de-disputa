"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renders the (server) page every few seconds so a public live view follows the ceremony. */
export function AutoRefresh({ everyMs = 4000 }: { everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(id);
  }, [router, everyMs]);

  return null;
}
