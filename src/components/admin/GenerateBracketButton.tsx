"use client";

import { useActionState } from "react";
import { generateBracketAction, generateEliminationAction, type BracketActionState } from "@/lib/actions/bracket";

const initialState: BracketActionState = {};

export function GenerateBracketButton({ tournamentId, label }: { tournamentId: string; label: string }) {
  const [state, formAction, pending] = useActionState(generateBracketAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Gerando..." : label}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function GenerateEliminationButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(generateEliminationAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Gerando..." : "Gerar eliminatória a partir da classificação"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
