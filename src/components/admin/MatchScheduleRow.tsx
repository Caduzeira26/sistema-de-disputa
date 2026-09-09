"use client";

import { useActionState } from "react";
import { updateMatchScheduleAction, type ActionState } from "@/lib/actions/schedule";

const initialState: ActionState = {};

function toDateInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MatchScheduleRow({
  matchId,
  label,
  scheduledAt,
  venueId,
  venues,
}: {
  matchId: string;
  label: string;
  scheduledAt: Date | null;
  venueId: string | null;
  venues: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateMatchScheduleAction, initialState);

  return (
    <tr>
      <td className="px-3 py-2 text-sm text-slate-900">{label}</td>
      <td className="px-3 py-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="date"
            name="date"
            defaultValue={toDateInput(scheduledAt)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <input
            type="time"
            name="time"
            defaultValue={toTimeInput(scheduledAt)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <select name="venueId" defaultValue={venueId ?? ""} className="rounded-md border border-slate-300 px-2 py-1 text-xs">
            <option value="">Sem local</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "..." : "Salvar"}
          </button>
          {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        </form>
      </td>
    </tr>
  );
}
