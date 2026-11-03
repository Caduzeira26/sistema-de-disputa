"use client";

import { useState } from "react";
import { formatBRL } from "@/lib/plans";
import type { ManualPixSettings } from "@/lib/manualPix";

/** Organizer's own PIX key, shown so teams can pay the registration outside the system. */
export function ManualPixCard({ pix }: { pix: ManualPixSettings }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pix.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); the key stays visible to copy by hand.
    }
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">
        Pagamento da inscrição por PIX{pix.amountCents ? ` — ${formatBRL(pix.amountCents)} por equipe` : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="break-all rounded bg-white px-2 py-1 text-sm text-slate-900">{pix.key}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800"
        >
          {copied ? "Copiado!" : "Copiar chave"}
        </button>
      </div>
      {pix.holder && <p className="mt-2">Favorecido: {pix.holder}</p>}
      <p className="mt-2 text-xs text-emerald-800">
        Depois de pagar, envie o comprovante ao organizador para confirmar a vaga da equipe.
      </p>
    </div>
  );
}
