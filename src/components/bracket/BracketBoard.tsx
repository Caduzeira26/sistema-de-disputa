import type { DisplayMatch } from "./types";
import { MatchCard } from "./MatchCard";

const BRACKET_LABEL: Record<string, string> = {
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

function BracketSection({
  title,
  matches,
  editable,
  quickResultEntry,
  tournamentId,
  publicSlug,
}: {
  title: string;
  matches: DisplayMatch[];
  editable: boolean;
  quickResultEntry: boolean;
  tournamentId?: string;
  publicSlug?: string;
}) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="flex gap-6 overflow-x-auto pb-2">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col gap-4">
            <p className="text-xs font-medium text-slate-400">Rodada {round}</p>
            <div className="flex flex-col justify-around gap-4">
              {matches
                .filter((m) => m.round === round)
                .sort((a, b) => a.position - b.position)
                .map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    editable={editable}
                    quickResultEntry={quickResultEntry}
                    tournamentId={tournamentId}
                    publicSlug={publicSlug}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketBoard({
  matches,
  editable = false,
  quickResultEntry = true,
  tournamentId,
  publicSlug,
}: {
  matches: DisplayMatch[];
  editable?: boolean;
  quickResultEntry?: boolean;
  tournamentId?: string;
  publicSlug?: string;
}) {
  const elimination = matches.filter((m) => m.bracket !== "GROUP");
  if (elimination.length === 0) return null;

  const byBracket: Record<string, DisplayMatch[]> = {
    WINNERS: elimination.filter((m) => m.bracket === "WINNERS"),
    LOSERS: elimination.filter((m) => m.bracket === "LOSERS"),
    GRAND_FINAL: elimination.filter((m) => m.bracket === "GRAND_FINAL" && (m.homeTeam || m.awayTeam || !m.isReset)),
  };

  return (
    <div className="flex flex-col gap-8">
      {(["WINNERS", "LOSERS", "GRAND_FINAL"] as const).map(
        (key) =>
          byBracket[key].length > 0 && (
            <BracketSection
              key={key}
              title={BRACKET_LABEL[key]}
              matches={byBracket[key]}
              editable={editable}
              quickResultEntry={quickResultEntry}
              tournamentId={tournamentId}
              publicSlug={publicSlug}
            />
          )
      )}
    </div>
  );
}
