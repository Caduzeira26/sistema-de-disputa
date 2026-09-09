"use client";

import { deleteTeam } from "@/lib/actions/teams";

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  return (
    <form
      action={deleteTeam}
      onSubmit={(e) => {
        if (!confirm("Remover esta equipe? Essa ação não pode ser desfeita.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <button type="submit" className="text-sm text-red-600 hover:text-red-800">
        Remover
      </button>
    </form>
  );
}
