"use client";

import { useActionState } from "react";
import { recordMatchResultAction, type RecordResultState } from "@/lib/actions/bracket";

const initialState: RecordResultState = {};

/**
 * Result entry for 1x1 electronic games (FIFA, Just Dance): there are no
 * goals/cards to log, just the final score — and, for FIFA knockouts, an
 * optional penalty shootout used only when the score is level.
 */
export function ScoreOnlyResultForm({
  matchId,
  homeName,
  awayName,
  scoreLabel,
  allowPenalties,
}: {
  matchId: string;
  homeName: string;
  awayName: string;
  scoreLabel: string;
  allowPenalties: boolean;
}) {
  const [state, formAction, pending] = useActionState(recordMatchResultAction, initialState);

  const numberInput = "w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">{homeName}</label>
          <input name="homeScore" type="number" min={0} defaultValue={0} required className={numberInput} />
        </div>
        <span className="pb-2 text-slate-400">x</span>
        <div className="flex flex-col items-end gap-1">
          <label className="text-xs font-medium text-slate-600">{awayName}</label>
          <input name="awayScore" type="number" min={0} defaultValue={0} required className={numberInput} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-400">{scoreLabel}</p>

      {allowPenalties && (
        <div className="rounded-md border border-dashed border-slate-300 p-3">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Disputa de pênaltis (só preencha se o placar terminou empatado em jogo eliminatório)
          </p>
          <div className="flex items-center gap-2">
            <input name="homePenalties" type="number" min={0} placeholder="—" className={numberInput} />
            <span className="text-slate-400">x</span>
            <input name="awayPenalties" type="number" min={0} placeholder="—" className={numberInput} />
          </div>
        </div>
      )}

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Encerrar partida"}
      </button>
    </form>
  );
}
