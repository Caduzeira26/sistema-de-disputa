"use client";

import { useActionState } from "react";
import { saveHeatAction, type HeatActionState } from "@/lib/actions/heats";

const initialState: HeatActionState = {};

export function HeatForm({
  roundId,
  dancers,
}: {
  roundId: string;
  dancers: { id: string; name: string; score: number | null }[];
}) {
  const [state, formAction, pending] = useActionState(saveHeatAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="roundId" value={roundId} />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Dançarino</th>
              <th className="w-48 px-4 py-2 font-medium">Pontuação na música</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dancers.map((dancer) => (
              <tr key={dancer.id}>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {dancer.name}
                  <input type="hidden" name="teamId" value={dancer.id} />
                </td>
                <td className="px-4 py-2">
                  <input
                    name={`score_${dancer.id}`}
                    type="number"
                    min={0}
                    required
                    defaultValue={dancer.score ?? ""}
                    className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        A colocação é calculada pela pontuação (a maior vence). Em bateria com mais de 2 dançarinos avançam os 2 melhores;
        com 2 dançarinos, só o vencedor. Se duas pontuações empatarem, repitam a música e lancem a nova pontuação.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar bateria"}
      </button>
    </form>
  );
}
