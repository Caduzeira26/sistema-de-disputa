"use client";

import { useActionState } from "react";
import {
  createLobbyRoundsAction,
  finishLobbyTournamentAction,
  generateLobbyFinalAction,
  reopenLobbyTournamentAction,
  type LobbyActionState,
} from "@/lib/actions/lobby";

const initialState: LobbyActionState = {};
const inputClass = "w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm";
const primaryButton =
  "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";

export function CreateRoundsForm({ tournamentId, label }: { tournamentId: string; label: string }) {
  const [state, formAction, pending] = useActionState(createLobbyRoundsAction, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Quantas quedas</label>
        <input name="count" type="number" min={1} max={20} defaultValue={6} required className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Criando..." : label}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function GenerateFinalForm({ tournamentId, defaultTop }: { tournamentId: string; defaultTop: number }) {
  const [state, formAction, pending] = useActionState(generateLobbyFinalAction, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Classificam por grupo</label>
        <input name="topPerGroup" type="number" min={1} defaultValue={defaultTop} required className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Quedas da final</label>
        <input name="count" type="number" min={1} max={20} defaultValue={6} required className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Gerando..." : "Gerar grande final"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function FinishTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [state, formAction, pending] = useActionState(finishLobbyTournamentAction, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Encerrando..." : "Encerrar campeonato e definir o campeão"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function ReopenTournamentButton({ tournamentId }: { tournamentId: string }) {
  return (
    <form action={reopenLobbyTournamentAction}>
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Reabrir campeonato para corrigir uma queda
      </button>
    </form>
  );
}
