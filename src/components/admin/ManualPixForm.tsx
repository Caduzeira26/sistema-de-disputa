"use client";

import { useActionState } from "react";
import { updateManualPix, type UpdateManualPixState } from "@/lib/actions/tournaments";
import { MANUAL_PIX_HOLDER_MAX_LENGTH, MANUAL_PIX_KEY_MAX_LENGTH, type ManualPixSettings } from "@/lib/manualPix";

const initialState: UpdateManualPixState = {};

const inputClass = "rounded-md border border-slate-300 px-2 py-1.5 text-sm";

function toReaisInputValue(cents: number | null | undefined): string {
  if (!cents) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function ManualPixForm({ tournamentId, current }: { tournamentId: string; current: ManualPixSettings | null }) {
  const [state, formAction, pending] = useActionState(updateManualPix, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="manual-pix-key" className="text-xs font-medium text-slate-600">
          Chave PIX (CPF, CNPJ, e-mail, celular ou chave aleatória)
        </label>
        <input
          id="manual-pix-key"
          name="key"
          defaultValue={current?.key ?? ""}
          maxLength={MANUAL_PIX_KEY_MAX_LENGTH}
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="manual-pix-holder" className="text-xs font-medium text-slate-600">
            Nome do favorecido (opcional)
          </label>
          <input
            id="manual-pix-holder"
            name="holder"
            defaultValue={current?.holder ?? ""}
            maxLength={MANUAL_PIX_HOLDER_MAX_LENGTH}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="manual-pix-amount" className="text-xs font-medium text-slate-600">
            Valor da inscrição, R$ (opcional)
          </label>
          <input
            id="manual-pix-amount"
            name="amount"
            inputMode="decimal"
            placeholder="Ex.: 30,00"
            defaultValue={toReaisInputValue(current?.amountCents)}
            className={`${inputClass} w-36`}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar chave PIX"}
        </button>
        {state.success && <p className="text-xs text-emerald-700">Salvo.</p>}
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <p className="text-xs text-slate-400">
        A chave aparece na ficha de inscrição e na tela de confirmação. O pagamento cai direto na sua conta e você aprova
        as equipes manualmente. Deixe a chave em branco para remover.
      </p>
    </form>
  );
}
