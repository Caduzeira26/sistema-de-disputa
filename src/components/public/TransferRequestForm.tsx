"use client";

import { useActionState } from "react";
import { requestTransfer, type RequestTransferState } from "@/lib/actions/transfers";

const initialState: RequestTransferState = {};

export function TransferRequestForm({
  tournamentId,
  teams,
}: {
  tournamentId: string;
  teams: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(requestTransfer, initialState);

  if (state.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <p className="font-medium">Solicitação enviada com sucesso!</p>
        <p className="mt-1 text-sm">O organizador do campeonato vai analisar o pedido de transferência.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="document" className="text-sm font-medium text-slate-700">
          CPF do atleta
        </label>
        <input
          id="document"
          name="document"
          required
          inputMode="numeric"
          maxLength={14}
          placeholder="Só números"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="toTeamId" className="text-sm font-medium text-slate-700">
          Equipe de destino
        </label>
        <select
          id="toTeamId"
          name="toTeamId"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">Selecione...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="requestedByName" className="text-sm font-medium text-slate-700">
          Seu nome
        </label>
        <input
          id="requestedByName"
          name="requestedByName"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="requestedByContact" className="text-sm font-medium text-slate-700">
          Telefone ou e-mail de contato
        </label>
        <input
          id="requestedByContact"
          name="requestedByContact"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Solicitar transferência"}
      </button>
    </form>
  );
}
