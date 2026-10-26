"use client";

import { useActionState } from "react";
import { renameTournament, type RenameTournamentState } from "@/lib/actions/tournaments";
import { TOURNAMENT_NAME_MAX_LENGTH } from "@/lib/tournamentName";

const initialState: RenameTournamentState = {};

export function TournamentNameForm({ tournamentId, name }: { tournamentId: string; name: string }) {
  const [state, formAction, pending] = useActionState(renameTournament, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor="tournament-name" className="text-xs font-medium text-slate-600">
          Nome
        </label>
        <input
          id="tournament-name"
          name="name"
          defaultValue={name}
          required
          minLength={2}
          maxLength={TOURNAMENT_NAME_MAX_LENGTH}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Renomear"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-xs text-emerald-700">Nome atualizado. Os links e QR Codes continuam os mesmos.</p>}
    </form>
  );
}
