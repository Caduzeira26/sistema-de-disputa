"use client";

import { useActionState } from "react";
import { autoDistributeScheduleAction, type ActionState } from "@/lib/actions/schedule";

const initialState: ActionState = {};

export function AutoScheduleForm({
  tournamentId,
  venues,
}: {
  tournamentId: string;
  venues: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(autoDistributeScheduleAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <h3 className="text-sm font-semibold text-slate-700">Distribuição automática</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Data inicial</label>
          <input type="date" name="startDate" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Horário inicial</label>
          <input
            type="time"
            name="startTime"
            defaultValue="09:00"
            required
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Jogos por dia</label>
          <input
            type="number"
            name="gamesPerDay"
            min={1}
            defaultValue={4}
            required
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Intervalo (min)</label>
          <input
            type="number"
            name="intervalMinutes"
            min={0}
            defaultValue={60}
            required
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {venues.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600">Locais a usar (na ordem)</p>
          <div className="mt-1 flex flex-wrap gap-3">
            {venues.map((v) => (
              <label key={v.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="checkbox" name="venueIds" value={v.id} defaultChecked />
                {v.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Isso substitui a data/horário/local de <strong>todas</strong> as partidas do torneio. Você pode ajustar
        qualquer partida manualmente depois.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Distribuindo..." : "Distribuir agenda"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
