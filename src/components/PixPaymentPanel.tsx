"use client";

import { useState } from "react";
import { checkPixPaymentStatus } from "@/lib/actions/pix";
import { formatBRL } from "@/lib/plans";

export function PixPaymentPanel({
  txid,
  amountCents,
  qrCode,
  qrCodeImageBase64,
  initialStatus,
  paidMessage,
}: {
  txid: string;
  amountCents: number;
  qrCode: string | null;
  qrCodeImageBase64: string | null;
  initialStatus: string;
  paidMessage: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCheck() {
    setChecking(true);
    const result = await checkPixPaymentStatus(txid);
    setStatus(result.status);
    setChecking(false);
  }

  async function handleCopy() {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "PAID") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <p className="font-medium">Pagamento confirmado!</p>
        <p className="mt-1 text-sm">{paidMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
      <p className="text-lg font-semibold text-slate-900">{formatBRL(amountCents)}</p>
      <p className="text-sm text-slate-500">Escaneie o QR code no app do seu banco ou copie o código PIX.</p>

      {qrCodeImageBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrCodeImageBase64}
          alt="QR code PIX"
          className="h-56 w-56 rounded-md border border-slate-200"
        />
      )}

      {qrCode && (
        <div className="flex w-full flex-col gap-2">
          <textarea
            readOnly
            value={qrCode}
            rows={3}
            className="w-full resize-none rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleCheck}
        disabled={checking}
        className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {checking ? "Verificando..." : "Já paguei, verificar"}
      </button>
    </div>
  );
}
