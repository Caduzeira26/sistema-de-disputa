"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/plans";
import { QUIET_ZONE } from "@/lib/qr";
import type { ManualPixSettings } from "@/lib/manualPix";

/**
 * Organizer's own PIX key, shown so teams can pay the registration outside the
 * system: the key itself, a "copia e cola" code (carries the amount) and the
 * QR code of that same payload. The code is built on the server.
 */
export function ManualPixCard({
  pix,
  payload,
  qr,
}: {
  pix: ManualPixSettings;
  payload: string;
  qr: { size: number; path: string };
}) {
  const [copied, setCopied] = useState<"key" | "code" | null>(null);
  const total = qr.size + QUIET_ZONE * 2;

  async function copy(text: string, which: "key" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the key stays visible to copy by hand.
    }
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">
        Pagamento da inscrição por PIX{pix.amountCents ? ` — ${formatBRL(pix.amountCents)} por equipe` : ""}
      </p>

      <div className="mt-3 flex flex-wrap items-start gap-4">
        <svg
          viewBox={`0 0 ${total} ${total}`}
          role="img"
          aria-label="QR Code do PIX"
          className="h-40 w-40 shrink-0 rounded bg-white"
        >
          <rect width={total} height={total} fill="#ffffff" />
          <path d={qr.path} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} fill="#0f172a" shapeRendering="crispEdges" />
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-emerald-800">Aponte a câmera do app do seu banco para o QR Code ou use a chave:</p>
          <code className="w-fit max-w-full break-all rounded bg-white px-2 py-1 text-sm text-slate-900">{pix.key}</code>
          {pix.holder && <p>Favorecido: {pix.holder}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(pix.key, "key")}
              className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800"
            >
              {copied === "key" ? "Copiado!" : "Copiar chave"}
            </button>
            <button
              type="button"
              onClick={() => copy(payload, "code")}
              className="rounded-md border border-emerald-700 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
            >
              {copied === "code" ? "Copiado!" : "Copiar PIX copia e cola"}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-emerald-800">
        Depois de pagar, envie o comprovante ao organizador para confirmar a vaga da equipe.
      </p>
    </div>
  );
}
