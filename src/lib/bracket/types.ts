export type BracketKind = "WINNERS" | "LOSERS" | "GRAND_FINAL" | "GROUP";
export type Slot = "HOME" | "AWAY";

export interface TeamInput {
  id: string;
  seed: number;
}

/**
 * A slot that will be filled once, either already known (a bye winner) or
 * pending a match result. `via` says whether this entrant is the WINNER of
 * `matchId` (normal advancement) or its LOSER (dropping into the losers
 * bracket) — the two use different pointer fields on the source match.
 */
export type Entrant =
  | { type: "TEAM"; teamId: string }
  | { type: "TBD"; matchId: string; via: "WINNER" | "LOSER" };

export interface GeneratedMatch {
  id: string;
  bracket: BracketKind;
  round: number;
  position: number;
  groupId: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  /** Set only for a round-1 bye: the match is already decided at generation time. */
  autoWinnerTeamId: string | null;
  winnerNextMatchId: string | null;
  winnerNextSlot: Slot | null;
  loserNextMatchId: string | null;
  loserNextSlot: Slot | null;
  isReset: boolean;
}

export interface GeneratedBracket {
  matches: GeneratedMatch[];
  /** id of the match whose winner is the tournament champion (null for GROUP-only output). */
  finalMatchId: string | null;
}
