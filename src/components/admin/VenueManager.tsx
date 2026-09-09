"use client";

import { useActionState } from "react";
import { addVenueAction, deleteVenueAction, type ActionState } from "@/lib/actions/schedule";

const initialState: ActionState = {};

export function VenueManager({
  tournamentId,
  venues,
}: {
  tournamentId: string;
  venues: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(addVenueAction, initialState);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">Locais</h3>
      {venues.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">Nenhum local cadastrado.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {venues.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
            >
              {v.name}
              <form action={deleteVenueAction}>
                <input type="hidden" name="venueId" value={v.id} />
                <button type="submit" className="text-slate-400 hover:text-red-600">
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="mt-3 flex items-center gap-2">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <input
          name="name"
          placeholder="Nome do local (ex: Quadra 1)"
          required
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? "Adicionando..." : "Adicionar"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
