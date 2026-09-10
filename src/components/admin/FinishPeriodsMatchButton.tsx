"use client";

import { useActionState } from "react";
import { finishPeriodsMatchAction, type ActionState } from "@/lib/actions/sumula";

const initialState: ActionState = {};

export function FinishPeriodsMatchButton({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(finishPeriodsMatchAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Encerrando..." : "Encerrar partida"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
