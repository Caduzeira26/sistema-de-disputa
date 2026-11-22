"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** While a charge is open, asks the server (which re-checks Asaas) every few seconds and refreshes the page when it changes. */
export function GatewayPaymentWatcher({ paymentId, status, everyMs = 6000 }: { paymentId: string; status: string; everyMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "PENDING" && status !== "OVERDUE") return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const response = await fetch(`/api/assinatura/cobranca/${paymentId}`, { cache: "no-store" });
        if (!response.ok || stopped) return;
        const data = (await response.json()) as { status: string };
        if (data.status !== status) router.refresh();
      } catch {
        // offline or a transient error: try again on the next tick
      }
    }, everyMs);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [paymentId, status, everyMs, router]);

  return null;
}
