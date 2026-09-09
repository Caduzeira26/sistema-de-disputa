"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updateTeam, type UpdateTeamState } from "@/lib/actions/teams";

const initialState: UpdateTeamState = {};

type Team = {
  id: string;
  tournamentId: string;
  name: string;
  managerName: string;
  contactPhone: string | null;
  contactEmail: string | null;
};

export function EditTeamForm({ team }: { team: Team }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateTeam, initialState);

  useEffect(() => {
    if (state.success) {
      router.push(`/admin/torneios/${team.tournamentId}`);
    }
  }, [state.success, router, team.tournamentId]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="teamId" value={team.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome da equipe
        </label>
        <input
          id="name"
          name="name"
          defaultValue={team.name}
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
          defaultValue={team.managerName}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
          Telefone de contato
        </label>
        <input
          id="contactPhone"
          name="contactPhone"
          defaultValue={team.contactPhone ?? ""}
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
          defaultValue={team.contactEmail ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
