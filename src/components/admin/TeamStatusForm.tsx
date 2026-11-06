"use client";

import { useFormStatus } from "react-dom";
import { approveAllPendingTeams, setTeamStatus } from "@/lib/actions/teams";

/** Submit button that says it's working: these actions take a few seconds and used to give no feedback. */
function SubmitButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-50`}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function TeamStatusForm({
  teamId,
  status,
  label,
  pendingLabel,
  className,
}: {
  teamId: string;
  status: "APPROVED" | "REJECTED";
  label: string;
  pendingLabel: string;
  className: string;
}) {
  return (
    <form action={setTeamStatus}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton label={label} pendingLabel={pendingLabel} className={className} />
    </form>
  );
}

export function ApproveAllTeamsForm({ tournamentId, count }: { tournamentId: string; count: number }) {
  return (
    <form action={approveAllPendingTeams}>
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <SubmitButton
        label={`Aprovar todas as pendentes (${count})`}
        pendingLabel="Aprovando..."
        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      />
    </form>
  );
}
