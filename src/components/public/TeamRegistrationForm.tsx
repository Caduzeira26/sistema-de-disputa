"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerTeam, type RegisterTeamState } from "@/lib/actions/teams";

const initialState: RegisterTeamState = {};

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

export function TeamRegistrationForm({
  tournamentId,
  tournamentSlug,
  canManageAthleteRegistry,
}: {
  tournamentId: string;
  tournamentSlug: string;
  canManageAthleteRegistry?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerTeam, initialState);
  const [players, setPlayers] = useState<PlayerDraft[]>([emptyPlayer()]);

  useEffect(() => {
    if (state.paymentTxid) {
      router.push(`/torneios/${tournamentSlug}/inscricao/pagamento/${state.paymentTxid}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.paymentTxid]);

  function updatePlayer(index: number, field: keyof PlayerDraft, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addPlayer() {
    setPlayers((prev) => [...prev, emptyPlayer()]);
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  if (state.success && !state.paymentTxid) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <p className="font-medium">Inscrição enviada com sucesso!</p>
        <p className="mt-1 text-sm">
          O organizador vai analisar os dados da equipe. Você pode ser contatado para confirmar detalhes.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <input type="hidden" name="playersJson" value={JSON.stringify(players)} />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-slate-900">Dados da equipe</legend>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nome da equipe
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="managerName" className="text-sm font-medium text-slate-700">
            Responsável/técnico
          </label>
          <input
            id="managerName"
            name="managerName"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
              Telefone de contato
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
              E-mail de contato
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logo" className="text-sm font-medium text-slate-700">
            Escudo/logo (opcional, até 5MB)
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" className="text-sm" />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-base font-semibold text-slate-900">Jogadores</legend>

        <div className="flex flex-col gap-4">
          {players.map((player, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Jogador {index + 1}</p>
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
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar inscrição"}
      </button>
    </form>
  );
}
