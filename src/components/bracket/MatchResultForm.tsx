"use client";

import { useActionState } from "react";
import { recordMatchResultAction, type RecordResultState } from "@/lib/actions/bracket";

const initialState: RecordResultState = {};

export function MatchResultForm({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(recordMatchResultAction, initialState);

  return (
    <form action={formAction} className="mt-1.5 flex flex-wrap items-center gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <input
        name="homeScore"
        type="number"
        min={0}
        defaultValue={0}
        required
        className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
      />
      <span className="text-xs text-slate-400">x</span>
      <input
        name="awayScore"
        type="number"
        min={0}
        defaultValue={0}
        required
        className="w-11 rounded border border-slate-300 px-1 py-0.5 text-xs"
      />
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
