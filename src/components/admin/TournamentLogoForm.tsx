"use client";

import { useActionState } from "react";
import { updateTournamentLogo, removeTournamentLogo, type UpdateLogoState } from "@/lib/actions/tournaments";

const initialState: UpdateLogoState = {};

export function TournamentLogoForm({ tournamentId, logoUrl }: { tournamentId: string; logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(updateTournamentLogo, initialState);

  return (
    <div className="flex items-center gap-4">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Logo do torneio" className="h-16 w-16 rounded-md border border-slate-200 bg-white object-contain p-1" />
      )}
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">{logoUrl ? "Trocar logo do torneio" : "Logo do torneio (opcional)"}</label>
          <input type="file" name="logo" accept="image/*" required className="text-sm" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Salvar logo"}
        </button>
        {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      </form>
      {logoUrl && (
        <form action={removeTournamentLogo}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <button type="submit" className="text-xs text-red-600 hover:text-red-800">
            Remover logo
          </button>
        </form>
      )}
    </div>
  );
}
