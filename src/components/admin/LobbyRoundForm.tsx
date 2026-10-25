"use client";

import { useActionState } from "react";
import { saveLobbyRoundAction, type LobbyActionState } from "@/lib/actions/lobby";

const initialState: LobbyActionState = {};

export function LobbyRoundForm({
  roundId,
  teams,
}: {
  roundId: string;
  teams: { id: string; name: string; placement: number | null; kills: number }[];
}) {
  const [state, formAction, pending] = useActionState(saveLobbyRoundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="roundId" value={roundId} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Equipe</th>
              <th className="w-32 px-4 py-2 font-medium">Colocação (1 = Booyah)</th>
              <th className="w-28 px-4 py-2 font-medium">Abates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => (
              <tr key={team.id}>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {team.name}
                  <input type="hidden" name="teamId" value={team.id} />
                </td>
                <td className="px-4 py-2">
                  <input
                    name={`placement_${team.id}`}
                    type="number"
                    min={1}
                    max={teams.length}
                    required
                    defaultValue={team.placement ?? ""}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    name={`kills_${team.id}`}
                    type="number"
                    min={0}
                    defaultValue={team.kills}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Pontos da colocação: 1º = 12, 2º = 9, 3º = 8, 4º = 7, 5º = 6, 6º = 5, 7º = 4, 8º = 3, 9º = 2, 10º = 1, 11º e 12º = 0.
        Cada abate vale 1 ponto.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar queda"}
      </button>
    </form>
  );
}
