import type { TeamInput, GeneratedBracket, GeneratedMatch, Entrant } from "./types";
import { buildEliminationTree } from "./singleElimination";
import { createIdGenerator } from "./ids";
import { pairAdjacent, zipPairs, wireEntrant } from "./pairing";

export const GRAND_FINAL_ID = "GF-1";
export const GRAND_FINAL_RESET_ID = "GF-2";

/**
 * Double elimination: a winners bracket identical to single elimination, a
 * losers bracket that receives every winners-bracket loser, and a grand
 * final between the two. If the losers-bracket finalist wins the grand
 * final, both finalists have exactly one loss and a reset match (`GF-2`,
 * pre-created here but only populated with teams once the grand final is
 * decided — see `applyMatchResult`) decides the tournament.
 *
 * Byes only ever occur in winners-bracket round 1 (see `buildEliminationTree`),
 * so a bye there simply means round 1 sends fewer than usual losers into the
 * losers bracket. The losers-bracket pairing below carries any resulting
 * odd-one-out forward until it finds a partner, which keeps every round's
 * structure valid without ever losing or duplicating a team.
 */
export function generateDoubleElimination(teams: TeamInput[]): GeneratedBracket {
  const wb = buildEliminationTree(teams, "WB");
  const matches: GeneratedMatch[] = [...wb.matches];
  const nextLbId = createIdGenerator("LB");
  let lbRound = 0;
  const lbRoundPositionCounters: Record<number, number> = {};

  function addLbMatch(home: Entrant, away: Entrant): GeneratedMatch {
    const id = nextLbId();
    lbRoundPositionCounters[lbRound] = (lbRoundPositionCounters[lbRound] ?? 0) + 1;
    const position = lbRoundPositionCounters[lbRound] - 1;
    const m: GeneratedMatch = {
      id,
      bracket: "LOSERS",
      round: lbRound,
      position,
      groupId: null,
      homeTeamId: home.type === "TEAM" ? home.teamId : null,
      awayTeamId: away.type === "TEAM" ? away.teamId : null,
      autoWinnerTeamId: null,
      winnerNextMatchId: null,
      winnerNextSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      isReset: false,
    };
    matches.push(m);
    wireEntrant(matches, home, id, "HOME");
    wireEntrant(matches, away, id, "AWAY");
    return m;
  }

  /** Pairs entrants among themselves (round-1 dropouts, or a consolidation round). */
  function pairAmongThemselves(entrants: Entrant[]): Entrant[] {
    const { pairs, leftover } = pairAdjacent(entrants);
    if (pairs.length === 0) return leftover ? [leftover] : [];
    lbRound += 1;
    const next: Entrant[] = pairs.map(([a, b]) => {
      const m = addLbMatch(a, b);
      return { type: "TBD", matchId: m.id, via: "WINNER" };
    });
    if (leftover) next.push(leftover);
    return next;
  }

  /** Pairs losers-bracket survivors against a fresh batch of winners-bracket dropouts. */
  function dropRound(survivors: Entrant[], dropouts: Entrant[]): Entrant[] {
    const { pairs, leftover } = zipPairs(survivors, dropouts);
    if (pairs.length === 0) return leftover;
    lbRound += 1;
    const next: Entrant[] = pairs.map(([a, b]) => {
      const m = addLbMatch(a, b);
      return { type: "TBD", matchId: m.id, via: "WINNER" };
    });
    next.push(...leftover);
    return next;
  }

  let queue: Entrant[] = [];
  const numWbRounds = wb.loserEntrantsByRound.length;

  for (let k = 1; k <= numWbRounds; k++) {
    const dropouts = wb.loserEntrantsByRound[k - 1];
    if (k === 1) {
      queue = pairAmongThemselves(dropouts);
    } else {
      while (queue.length > dropouts.length) {
        queue = pairAmongThemselves(queue);
      }
      queue = dropRound(queue, dropouts);
    }
  }

  if (queue.length !== 1) {
    throw new Error(
      `generateDoubleElimination: expected exactly one losers-bracket finalist, got ${queue.length}`
    );
  }
  const lbFinalist = queue[0];

  // Grand final: HOME is always the winners-bracket champion, AWAY the
  // losers-bracket champion (fixed convention used by applyMatchResult to
  // decide whether a reset is needed).
  const gf: GeneratedMatch = {
    id: GRAND_FINAL_ID,
    bracket: "GRAND_FINAL",
    round: 1,
    position: 0,
    groupId: null,
    homeTeamId: null,
    awayTeamId: null,
    autoWinnerTeamId: null,
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isReset: false,
  };
  matches.push(gf);
  wireEntrant(matches, { type: "TBD", matchId: wb.finalMatchId, via: "WINNER" }, gf.id, "HOME");
  wireEntrant(matches, lbFinalist, gf.id, "AWAY");

  const reset: GeneratedMatch = {
    id: GRAND_FINAL_RESET_ID,
    bracket: "GRAND_FINAL",
    round: 2,
    position: 0,
    groupId: null,
    homeTeamId: null,
    awayTeamId: null,
    autoWinnerTeamId: null,
    winnerNextMatchId: null,
    winnerNextSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    isReset: true,
  };
  matches.push(reset);

  // No single static "final match": the champion is the grand final's winner,
  // unless the reset is triggered, in which case it's the reset's winner.
  return { matches, finalMatchId: null };
}
