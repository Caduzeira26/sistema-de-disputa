import type { DisplayMatch } from "./types";
import { BracketTree } from "./BracketTree";

const BRACKET_LABEL: Record<string, string> = {
  WINNERS: "Chave principal",
  LOSERS: "Repescagem",
  GRAND_FINAL: "Grande final",
};

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
            <div key={key}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{BRACKET_LABEL[key]}</h3>
              <BracketTree
                matches={byBracket[key]}
                editable={editable}
                quickResultEntry={quickResultEntry}
                tournamentId={tournamentId}
                publicSlug={publicSlug}
              />
            </div>
          )
      )}
    </div>
  );
}
