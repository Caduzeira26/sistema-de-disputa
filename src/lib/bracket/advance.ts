import type { BracketKind, Slot } from "./types";

export interface MatchRecord {
  id: string;
  bracket: BracketKind;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerNextMatchId: string | null;
  winnerNextSlot: Slot | null;
  loserNextMatchId: string | null;
  loserNextSlot: Slot | null;
  isReset: boolean;
}

export interface MatchSlotUpdate {
  matchId: string;
  slot: Slot;
  teamId: string;
}

export interface ApplyResultOutcome {
  winnerTeamId: string;
  loserTeamId: string;
  /** Other matches that must have a team slot filled in as a result. */
  slotUpdates: MatchSlotUpdate[];
  /** Set once the tournament's winner is decided by this result. */
  championTeamId: string | null;
  /** Set in the same result as championTeamId: the deciding match's loser. */
  runnerUpTeamId: string | null;
  /** Set when this result eliminates a bronze-medal contender — a
   *  single-elimination semifinal loser, or the double-elimination
   *  losers-bracket-final loser. Null otherwise. */
  thirdPlaceTeamId: string | null;
  /** True if this result just populated the grand-final reset match. */
  resetActivated: boolean;
}

/**
 * True if `match`'s loser is a bronze-medal contender: either a
 * single-elimination semifinal (feeds directly into the tournament final,
 * which itself has nowhere further to advance to) or a double-elimination
 * losers-bracket final (feeds into the grand final's AWAY slot, by the fixed
 * HOME=winners-bracket/AWAY=losers-bracket convention used when wiring the
 * grand final at generation time).
 */
export function decidesThirdPlace(match: MatchRecord, allMatches: MatchRecord[]): boolean {
  if (!match.winnerNextMatchId || !match.winnerNextSlot) return false;
  const target = allMatches.find((m) => m.id === match.winnerNextMatchId);
  if (!target) return false;
  const isEliminationFinal = target.bracket === "WINNERS" && !target.winnerNextMatchId;
  const isLosersBracketFinal =
    target.bracket === "GRAND_FINAL" && !target.isReset && match.winnerNextSlot === "AWAY";
  return isEliminationFinal || isLosersBracketFinal;
}

/**
 * Pure function: given one elimination-bracket match's final score, works
 * out who advances (and, in a double-elimination bracket, who drops to the
 * losers bracket) using the pointers set at generation time — plus the
 * grand-final/reset special case. Never touches a database; the caller
 * applies `slotUpdates` and `championTeamId` to persisted rows.
 *
 * Not for GROUP-stage matches: those allow draws and don't advance anyone —
 * standings are computed fresh from all finished group matches instead.
 */
export function applyMatchResult(
  match: MatchRecord,
  homeScore: number,
  awayScore: number,
  allMatches: MatchRecord[]
): ApplyResultOutcome {
  if (match.bracket === "GROUP") {
    throw new Error("applyMatchResult: group-stage matches don't advance a winner");
  }
  if (!match.homeTeamId || !match.awayTeamId) {
    throw new Error("applyMatchResult: match has no teams assigned yet");
  }
  if (homeScore === awayScore) {
    throw new Error("applyMatchResult: elimination and grand-final matches cannot end in a draw");
  }

  const homeWon = homeScore > awayScore;
  const winnerTeamId = homeWon ? match.homeTeamId : match.awayTeamId;
  const loserTeamId = homeWon ? match.awayTeamId : match.homeTeamId;

  const slotUpdates: MatchSlotUpdate[] = [];
  let championTeamId: string | null = null;
  let runnerUpTeamId: string | null = null;
  let resetActivated = false;
  const thirdPlaceTeamId = decidesThirdPlace(match, allMatches) ? loserTeamId : null;

  if (match.bracket === "GRAND_FINAL" && match.isReset) {
    championTeamId = winnerTeamId;
    runnerUpTeamId = loserTeamId;
  } else if (match.bracket === "GRAND_FINAL") {
    if (winnerTeamId === match.homeTeamId) {
      // Winners-bracket finalist (HOME, by convention) won outright.
      championTeamId = winnerTeamId;
      runnerUpTeamId = loserTeamId;
    } else {
      // Losers-bracket finalist forced a reset: both now have one loss.
      const reset = allMatches.find((m) => m.bracket === "GRAND_FINAL" && m.isReset);
      if (!reset) {
        throw new Error("applyMatchResult: grand-final reset match not found");
      }
      slotUpdates.push({ matchId: reset.id, slot: "HOME", teamId: match.homeTeamId });
      slotUpdates.push({ matchId: reset.id, slot: "AWAY", teamId: match.awayTeamId });
      resetActivated = true;
    }
  } else {
    if (match.winnerNextMatchId && match.winnerNextSlot) {
      slotUpdates.push({ matchId: match.winnerNextMatchId, slot: match.winnerNextSlot, teamId: winnerTeamId });
    } else if (match.bracket === "WINNERS") {
      // Single-elimination final: nowhere left to advance to.
      championTeamId = winnerTeamId;
      runnerUpTeamId = loserTeamId;
    }

    if (match.loserNextMatchId && match.loserNextSlot) {
      slotUpdates.push({ matchId: match.loserNextMatchId, slot: match.loserNextSlot, teamId: loserTeamId });
    }
  }

  return { winnerTeamId, loserTeamId, slotUpdates, championTeamId, runnerUpTeamId, thirdPlaceTeamId, resetActivated };
}
