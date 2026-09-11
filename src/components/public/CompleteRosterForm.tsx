"use client";

import { useActionState, useState } from "react";
import { addPlayersToTeam, type AddPlayersState } from "@/lib/actions/teams";

const initialState: AddPlayersState = {};

type PlayerDraft = {
  name: string;
  shirtNumber: string;
  position: string;
  birthDate: string;
  document: string;
};

function emptyPlayer(): PlayerDraft {
  return { name: "", shirtNumber: "", position: "", birthDate: "", document: "" };
}

export function CompleteRosterForm({
  teamId,
  canManageAthleteRegistry,
}: {
  teamId: string;
  canManageAthleteRegistry?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addPlayersToTeam, initialState);
  const [players, setPlayers] = useState<PlayerDraft[]>([emptyPlayer()]);

  function updatePlayer(index: number, field: keyof PlayerDraft, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, emptyPlayer()]);
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  if (state.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <p className="font-medium">Jogadores adicionados com sucesso!</p>
        <p className="mt-1 text-sm">Recarregue a página para ver a lista atualizada da equipe.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="playersJson" value={JSON.stringify(players)} />

      <div className="flex flex-col gap-4">
        {players.map((player, index) => (
          <div key={index} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Novo jogador {index + 1}</p>
              {players.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remover
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                placeholder="Nome"
                required
                value={player.name}
                onChange={(e) => updatePlayer(index, "name", e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                placeholder="Número da camisa"
                type="number"
                min={0}
                value={player.shirtNumber}
                onChange={(e) => updatePlayer(index, "shirtNumber", e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                placeholder="Posição"
                value={player.position}
                onChange={(e) => updatePlayer(index, "position", e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                placeholder="Data de nascimento"
                type="date"
                value={player.birthDate}
                onChange={(e) => updatePlayer(index, "birthDate", e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              {canManageAthleteRegistry && (
                <input
                  placeholder="CPF (só números)"
                  required
                  inputMode="numeric"
                  maxLength={14}
                  value={player.document}
                  onChange={(e) => updatePlayer(index, "document", e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addPlayer}
        className="self-start rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Adicionar jogador
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Adicionar à equipe"}
      </button>
    </form>
  );
}
