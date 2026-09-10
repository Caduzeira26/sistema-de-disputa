"use client";

import { useActionState } from "react";
import { updateTournamentDates, type UpdateDatesState } from "@/lib/actions/tournaments";

const initialState: UpdateDatesState = {};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function TournamentDatesForm({
  tournamentId,
  startDate,
  endDate,
}: {
  tournamentId: string;
  startDate: Date | null;
  endDate: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateTournamentDates, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Início</label>
        <input
          type="date"
          name="startDate"
          defaultValue={toDateInputValue(startDate)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Término</label>
        <input
          type="date"
          name="endDate"
          defaultValue={toDateInputValue(endDate)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar datas"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
