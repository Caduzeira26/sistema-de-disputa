"use client";

import { useActionState } from "react";
import { updateTournamentTransferDeadline, type UpdateTransferDeadlineState } from "@/lib/actions/tournaments";

const initialState: UpdateTransferDeadlineState = {};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function TournamentTransferDeadlineForm({
  tournamentId,
  transferDeadline,
}: {
  tournamentId: string;
  transferDeadline: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateTournamentTransferDeadline, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Prazo para solicitar transferências (opcional)</label>
        <input
          type="date"
          name="transferDeadline"
          defaultValue={toDateInputValue(transferDeadline)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar prazo"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      <p className="w-full text-xs text-slate-400">
        Sem prazo definido, as equipes podem solicitar transferências a qualquer momento.
      </p>
    </form>
  );
}
