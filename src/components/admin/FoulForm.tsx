"use client";

import { useActionState, useState } from "react";
import { addFoulAction, type ActionState } from "@/lib/actions/sumula";

const initialState: ActionState = {};

type TeamWithPlayers = { id: string; name: string; players: { id: string; name: string }[] };

export function FoulForm({ matchId, homeTeam, awayTeam }: { matchId: string; homeTeam: TeamWithPlayers; awayTeam: TeamWithPlayers }) {
  const [state, formAction, pending] = useActionState(addFoulAction, initialState);
  const [teamId, setTeamId] = useState(homeTeam.id);
  const players = teamId === homeTeam.id ? homeTeam.players : awayTeam.players;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Equipe</label>
        <select
          name="teamId"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value={homeTeam.id}>{homeTeam.name}</option>
          <option value={awayTeam.id}>{awayTeam.name}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Jogador</label>
        <select name="playerId" required className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          {players.length === 0 ? (
            <option value="">Nenhum jogador cadastrado</option>
          ) : (
            players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">Período</label>
        <input type="number" name="period" min={1} max={10} defaultValue={1} required className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
      </div>

      <button
        type="submit"
        disabled={pending || players.length === 0}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Adicionando..." : "Adicionar falta"}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
