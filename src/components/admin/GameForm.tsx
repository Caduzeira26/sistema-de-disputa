"use client";

import { useActionState } from "react";
import { addTableTennisGameAction, type ActionState } from "@/lib/actions/sumula";

const initialState: ActionState = {};

type TeamWithPlayers = { id: string; name: string; players: { id: string; name: string }[] };

export function GameForm({ matchId, homeTeam, awayTeam }: { matchId: string; homeTeam: TeamWithPlayers; awayTeam: TeamWithPlayers }) {
  const [state, formAction, pending] = useActionState(addTableTennisGameAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">{homeTeam.name} (1 = simples, 2 = duplas)</label>
        <select multiple name="homePlayerIds" required size={Math.min(4, Math.max(2, homeTeam.players.length))} className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {homeTeam.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">{awayTeam.name} (1 = simples, 2 = duplas)</label>
        <select multiple name="awayPlayerIds" required size={Math.min(4, Math.max(2, awayTeam.players.length))} className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {awayTeam.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={pending || homeTeam.players.length === 0 || awayTeam.players.length === 0}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Adicionando..." : "Adicionar jogo"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
