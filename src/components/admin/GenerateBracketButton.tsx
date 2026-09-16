"use client";

import { useActionState } from "react";
import {
  generateBracketAction,
  generateEliminationAction,
  resetBracketAction,
  type BracketActionState,
} from "@/lib/actions/bracket";

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

/**
 * Wipes the generated bracket (matches, groups, seeds, results) so the
 * organizer can generate it again — e.g. it was generated before every
 * team had registered. Always visible once a bracket exists, so "fazer e
 * refazer" isn't a one-way door.
 */
export function ResetBracketButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(resetBracketAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Isso apaga o chaveamento atual (partidas, grupos e resultados já registrados) para gerar de novo. Confirma?"
          )
        ) {
          e.preventDefault();
        }
      }}
      className="flex flex-col items-start gap-1"
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Apagando..." : "Apagar chaveamento e gerar de novo"}
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
