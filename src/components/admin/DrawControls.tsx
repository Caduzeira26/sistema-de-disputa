"use client";

import { useActionState } from "react";
import {
  cancelDrawAction,
  confirmDrawAction,
  revealAllAction,
  revealNextAction,
  type DrawActionState,
} from "@/lib/actions/draw";

const initialState: DrawActionState = {};

export function DrawControls({
  tournamentId,
  revealed,
  total,
}: {
  tournamentId: string;
  revealed: number;
  total: number;
}) {
  const [confirmState, confirmAction, confirming] = useActionState(confirmDrawAction, initialState);
  const finished = revealed >= total;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {!finished && (
          <>
            <form action={revealNextAction}>
              <input type="hidden" name="tournamentId" value={tournamentId} />
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-5 py-3 text-base font-medium text-white hover:bg-slate-800"
              >
                Sortear próxima equipe
              </button>
            </form>
            <form action={revealAllAction}>
              <input type="hidden" name="tournamentId" value={tournamentId} />
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Revelar todas
              </button>
            </form>
          </>
        )}

        {finished && (
          <form action={confirmAction}>
            <input type="hidden" name="tournamentId" value={tournamentId} />
            <button
              type="submit"
              disabled={confirming}
              className="rounded-md bg-emerald-600 px-5 py-3 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {confirming ? "Gerando..." : "Confirmar sorteio e gerar chaveamento"}
            </button>
          </form>
        )}

        <form
          action={cancelDrawAction}
          onSubmit={(e) => {
            if (!confirm("Cancelar este sorteio? Ele será descartado e você poderá refazer com novos potes.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <button
            type="submit"
            className="rounded-md border border-red-300 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Cancelar sorteio
          </button>
        </form>
      </div>
      {confirmState.error && <p className="text-sm text-red-600">{confirmState.error}</p>}
    </div>
  );
}
