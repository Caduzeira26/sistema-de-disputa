"use client";

import { useActionState } from "react";
import { startDrawAction, type DrawActionState } from "@/lib/actions/draw";

const initialState: DrawActionState = {};

export function DrawSetupForm({
  tournamentId,
  teams,
  usesGroups,
  defaultNumGroups,
}: {
  tournamentId: string;
  teams: { id: string; name: string; pot: number | null }[];
  usesGroups: boolean;
  defaultNumGroups: number;
}) {
  const [state, formAction, pending] = useActionState(startDrawAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      {usesGroups && (
        <div className="flex flex-col gap-1">
          <label htmlFor="numGroups" className="text-sm font-medium text-slate-700">
            Número de grupos
          </label>
          <input
            id="numGroups"
            name="numGroups"
            type="number"
            min={1}
            max={Math.max(1, Math.floor(teams.length / 2))}
            defaultValue={defaultNumGroups}
            required
            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-400">Cada grupo precisa de pelo menos 2 equipes.</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700">Potes</h2>
        <p className="mb-3 text-xs text-slate-500">
          Pote 1 são os cabeças de chave (os mais fortes). Cada grupo recebe no máximo uma equipe de cada pote, e na chave
          o pote 1 enfrenta o último pote. Equipes sem pote entram no último pote. Deixe tudo em branco para um sorteio
          totalmente aberto.
        </p>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Equipe</th>
                <th className="w-32 px-4 py-2 font-medium">Pote (1 a 8)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teams.map((team) => (
                <tr key={team.id}>
                  <td className="px-4 py-2 text-slate-900">{team.name}</td>
                  <td className="px-4 py-2">
                    <input
                      name={`pot_${team.id}`}
                      type="number"
                      min={1}
                      max={8}
                      defaultValue={team.pot ?? ""}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Preparando..." : "Iniciar o sorteio"}
      </button>
    </form>
  );
}
