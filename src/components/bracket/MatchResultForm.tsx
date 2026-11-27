"use client";

import { useActionState, useState } from "react";
import { recordMatchResultAction, type RecordResultState } from "@/lib/actions/bracket";

const initialState: RecordResultState = {};

/**
 * Placar final. Em jogo eliminatório de modalidade com desempate (`penaltiesLabel`), mostra também
 * a disputa de pênaltis, que só precisa ser preenchida se o placar empatar.
 */
export function MatchResultForm({ matchId, penaltiesLabel = null }: { matchId: string; penaltiesLabel?: string | null }) {
  const [state, formAction, pending] = useActionState(recordMatchResultAction, initialState);
  // Campos controlados: depois de um erro (ex.: empate sem pênaltis) o que foi digitado continua lá.
  const [values, setValues] = useState({ homeScore: "0", awayScore: "0", homePenalties: "", awayPenalties: "" });
  const bind = (name: keyof typeof values) => ({
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  return (
    <form action={formAction} className="mt-1.5 flex flex-wrap items-center gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <input
        {...bind("homeScore")}
        type="number"
        min={0}
        required
        className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
      />
      <span className="text-xs text-slate-400">x</span>
      <input
        {...bind("awayScore")}
        type="number"
        min={0}
        required
        className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
      />
      {penaltiesLabel && (
        <>
          <span className="w-full text-[11px] text-slate-500">
            {penaltiesLabel.charAt(0).toUpperCase() + penaltiesLabel.slice(1)} (só se empatar):
          </span>
          <input
            {...bind("homePenalties")}
            type="number"
            min={0}
            placeholder="—"
            aria-label={`${penaltiesLabel} do mandante`}
            className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
          />
          <span className="text-xs text-slate-400">x</span>
          <input
            {...bind("awayPenalties")}
            type="number"
            min={0}
            placeholder="—"
            aria-label={`${penaltiesLabel} do visitante`}
            className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
          />
        </>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "..." : "Salvar"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
