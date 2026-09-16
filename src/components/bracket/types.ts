export interface DisplayTeam {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface DisplayMatch {
  id: string;
  bracket: "WINNERS" | "LOSERS" | "GRAND_FINAL" | "GROUP";
  round: number;
  position: number;
  groupId: string | null;
  homeTeam: DisplayTeam | null;
  awayTeam: DisplayTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
  isReset: boolean;
  scheduledAt: Date | null;
  venueName: string | null;
  /** Sequential "Jogo N" label in bracket-dependency order, matching the
   *  classic paper-bracket convention. Null for byes, which never play. */
  gameNumber: number | null;
  /** Where this match's winner advances to — drives the tree layout and the
   *  connector lines drawn between matches (see BracketTree). */
  winnerNextMatchId: string | null;
  winnerNextSlot: "HOME" | "AWAY" | null;
}
