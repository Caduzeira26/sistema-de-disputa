"use client";

import { useActionState } from "react";
import { updatePlayerGoalkeepers, type UpdateGoalkeepersState } from "@/lib/actions/teams";

const initialState: UpdateGoalkeepersState = {};

export function PlayerGoalkeeperEditor({
  teamId,
  players,
}: {
  teamId: string;
  players: { id: string; name: string; shirtNumber: number | null; isGoalkeeper: boolean }[];
}) {
  const [state, formAction, pending] = useActionState(updatePlayerGoalkeepers, initialState);

  if (players.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum jogador cadastrado.</p>;
  }

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="teamId" value={teamId} />

      <div className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {players.map((p) => (
          <label key={p.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            <span className="text-slate-900">
              {p.name}
              {p.shirtNumber !== null && <span className="ml-1 text-slate-400">#{p.shirtNumber}</span>}
            </span>
            <span className="flex items-center gap-2 text-slate-600">
              É goleiro
              <input
                type="checkbox"
                name={`goalkeeper_${p.id}`}
                defaultChecked={p.isGoalkeeper}
                className="h-4 w-4 rounded border-slate-300"
              />
            </span>
          </label>
        ))}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Salvo!</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar goleiros"}
      </button>
    </form>
  );
}
