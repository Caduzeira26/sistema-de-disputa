"use client";

import { useActionState } from "react";
import { addSetAction, type ActionState } from "@/lib/actions/sumula";

const initialState: ActionState = {};

export function SetForm({ matchId, nextSetNumber }: { matchId: string; nextSetNumber: number }) {
  const [state, formAction, pending] = useActionState(addSetAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Set</label>
        <input
          type="number"
          name="setNumber"
          min={1}
          max={10}
          defaultValue={nextSetNumber}
          required
          className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Pontos casa</label>
        <input type="number" name="homePoints" min={0} required className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Pontos fora</label>
        <input type="number" name="awayPoints" min={0} required className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar set"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
