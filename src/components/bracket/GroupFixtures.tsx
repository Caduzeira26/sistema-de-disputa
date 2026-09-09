import type { DisplayMatch } from "./types";
import { MatchCard } from "./MatchCard";

export function GroupFixtures({
  title,
  matches,
  editable = false,
  tournamentId,
  publicSlug,
}: {
  title: string;
  matches: DisplayMatch[];
  editable?: boolean;
  tournamentId?: string;
  publicSlug?: string;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-slate-700">{title}</h4>
      <div className="flex flex-col gap-3">
        {rounds.map((round) => (
          <div key={round}>
            <p className="mb-1 text-xs font-medium text-slate-400">Rodada {round}</p>
            <div className="flex flex-wrap gap-3">
              {matches
                .filter((m) => m.round === round)
                .map((m) => (
                  <MatchCard key={m.id} match={m} editable={editable} tournamentId={tournamentId} publicSlug={publicSlug} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
