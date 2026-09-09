"use client";

import { useActionState } from "react";
import { reopenMatchAction, type ActionState } from "@/lib/actions/sumula";

const initialState: ActionState = {};

export function ReopenMatchButton({ matchId }: { matchId: string }) {
  const [state, formAction, pending] = useActionState(reopenMatchAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Reabrir esta partida? O placar será apagado e será preciso registrá-lo novamente.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="matchId" value={matchId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
      >
        {pending ? "Reabrindo..." : "Reabrir partida para correção"}
      </button>
      {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
