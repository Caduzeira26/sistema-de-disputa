"use client";

import { useActionState } from "react";
import {
  createSingleHeatAction,
  finishHeatsTournamentAction,
  generateNextHeatRoundAction,
  reopenHeatsTournamentAction,
  type HeatActionState,
} from "@/lib/actions/heats";

const initialState: HeatActionState = {};
const primaryButton =
  "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50";

function ActionButton({
  action,
  tournamentId,
  label,
  pendingLabel,
  className = primaryButton,
}: {
  action: (prev: HeatActionState, formData: FormData) => Promise<HeatActionState>;
  tournamentId: string;
  label: string;
  pendingLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button type="submit" disabled={pending} className={className}>
        {pending ? pendingLabel : label}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function CreateSingleHeatButton({ tournamentId }: { tournamentId: string }) {
  return (
    <ActionButton action={createSingleHeatAction} tournamentId={tournamentId} label="Criar a bateria" pendingLabel="Criando..." />
  );
}

export function NextRoundButton({ tournamentId }: { tournamentId: string }) {
  return (
    <ActionButton
      action={generateNextHeatRoundAction}
      tournamentId={tournamentId}
      label="Gerar a próxima rodada com os 2 melhores de cada bateria"
      pendingLabel="Gerando..."
    />
  );
}

export function FinishHeatsButton({ tournamentId }: { tournamentId: string }) {
  return (
    <ActionButton
      action={finishHeatsTournamentAction}
      tournamentId={tournamentId}
      label="Encerrar campeonato e definir o campeão"
      pendingLabel="Encerrando..."
      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    />
  );
}

export function ReopenHeatsButton({ tournamentId }: { tournamentId: string }) {
  return (
    <form action={reopenHeatsTournamentAction}>
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Reabrir campeonato para corrigir uma bateria
      </button>
    </form>
  );
}
