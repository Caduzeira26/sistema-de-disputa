"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Oferta encerrada";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/** endsAtIso must be an ISO timestamp — Date objects don't cross the server/client boundary. */
export function PromoCountdown({ endsAtIso }: { endsAtIso: string }) {
  const endsAt = new Date(endsAtIso).getTime();
  // Initialized directly (not via effect) to avoid a synchronous setState-in-effect;
  // suppressHydrationWarning below accepts the resulting few-ms server/client drift,
  // same as any other "current time" leaf value.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <span suppressHydrationWarning>{formatRemaining(endsAt - now)}</span>;
}
