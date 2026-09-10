import Link from "next/link";
import type { DisplayMatch } from "./types";
import { MatchResultForm } from "./MatchResultForm";

function TeamRow({
  team,
  score,
  won,
}: {
  team: DisplayMatch["homeTeam"];
  score: number | null;
  won: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-2 py-1 text-sm ${won ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <span className="truncate">{team ? team.name : "A definir"}</span>
      {score !== null && <span className="ml-2 tabular-nums">{score}</span>}
    </div>
  );
}

export function MatchCard({
  match,
  editable = false,
  quickResultEntry = true,
  tournamentId,
  publicSlug,
}: {
  match: DisplayMatch;
  editable?: boolean;
  /** GOALS_CARDS matches can have their final score typed directly here.
   * Sets/baskets/games-based sports must go through the full súmula page,
   * since the score there is derived, not typed in. */
  quickResultEntry?: boolean;
  /** Admin context: enables the "Súmula" link to `/admin/torneios/[id]/partidas/[matchId]`. */
  tournamentId?: string;
  /** Public context: enables the "Súmula" link to `/torneios/[slug]/partidas/[matchId]`. */
  publicSlug?: string;
}) {
  const isFinished = match.status === "FINISHED";
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
  const playable = !isFinished && !!match.homeTeam && !!match.awayTeam;
  const detailsHref =
    match.homeTeam && match.awayTeam
      ? tournamentId
        ? `/admin/torneios/${tournamentId}/partidas/${match.id}`
        : publicSlug
          ? `/torneios/${publicSlug}/partidas/${match.id}`
          : null
      : null;

  return (
    <div className="w-56 rounded-md border border-slate-200 bg-white shadow-sm">
      {match.isReset && (
        <div className="border-b border-slate-100 px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-amber-600">
          Reset da grande final
        </div>
      )}
      <div className="divide-y divide-slate-100">
        <TeamRow team={match.homeTeam} score={match.homeScore} won={homeWon} />
        <TeamRow team={match.awayTeam} score={match.awayScore} won={awayWon} />
      </div>
      {(match.scheduledAt || match.venueName) && (
        <div className="border-t border-slate-100 px-2 py-1 text-[11px] text-slate-500">
          {match.scheduledAt &&
            new Date(match.scheduledAt).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          {match.scheduledAt && match.venueName && " · "}
          {match.venueName}
        </div>
      )}
      {editable && playable && quickResultEntry && <div className="px-2 pb-1.5">{<MatchResultForm matchId={match.id} />}</div>}
      {detailsHref && (
        <div className="border-t border-slate-100 px-2 py-1">
          <Link href={detailsHref} className="text-[11px] text-slate-500 underline">
            Súmula
          </Link>
        </div>
      )}
    </div>
  );
}
