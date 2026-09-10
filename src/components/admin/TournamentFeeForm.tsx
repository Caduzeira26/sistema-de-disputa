"use client";

import { useActionState } from "react";
import { updateTournamentFee, type UpdateFeeState } from "@/lib/actions/tournaments";

const initialState: UpdateFeeState = {};

function toReaisInputValue(feeCents: number | null): string {
  if (!feeCents) return "";
  return (feeCents / 100).toFixed(2).replace(".", ",");
}

export function TournamentFeeForm({
  tournamentId,
  registrationFeeCents,
}: {
  tournamentId: string;
  registrationFeeCents: number | null;
}) {
  const [state, formAction, pending] = useActionState(updateTournamentFee, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Valor da inscrição por equipe (R$, opcional)</label>
        <input
          type="text"
          inputMode="decimal"
          name="feeReais"
          placeholder="Grátis"
          defaultValue={toReaisInputValue(registrationFeeCents)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar valor"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <p className="w-full text-xs text-slate-400">
        Cobrado via PIX na inscrição. Uma taxa de R$ 2,00 da plataforma é somada automaticamente.
      </p>
    </form>
  );
}
