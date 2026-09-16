"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { removePlayerFromTeam, type RemovePlayerState } from "@/lib/actions/teams";

const initialState: RemovePlayerState = {};

function RosterItem({
  teamId,
  playerId,
  label,
  canRemove,
}: {
  teamId: string;
  playerId: string;
  label: string;
  canRemove: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(removePlayerFromTeam, initialState);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <li className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
      <span>{label}</span>
      {canRemove && (
        <form
          action={formAction}
          onSubmit={(e) => {
            if (!confirm(`Remover ${label} da equipe?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="playerId" value={playerId} />
          <button
            type="submit"
            disabled={pending}
            aria-label={`Remover ${label}`}
            title="Remover jogador"
            className="text-slate-400 hover:text-red-600 disabled:opacity-50"
          >
            ×
          </button>
        </form>
      )}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </li>
  );
}

export function TeamRosterList({
  teamId,
  players,
  canRemove,
}: {
  teamId: string;
  players: { id: string; name: string; shirtNumber: number | null }[];
  canRemove: boolean;
}) {
  if (players.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum jogador cadastrado ainda.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((p) => (
        <RosterItem
          key={p.id}
          teamId={teamId}
          playerId={p.id}
          label={p.shirtNumber !== null ? `${p.name} (${p.shirtNumber})` : p.name}
          canRemove={canRemove}
        />
      ))}
    </ul>
  );
}
