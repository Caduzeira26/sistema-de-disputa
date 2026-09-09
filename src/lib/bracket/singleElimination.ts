import type { TeamInput, GeneratedBracket, GeneratedMatch, Entrant } from "./types";
import { nextPowerOfTwo, seedOrder } from "./seeding";
import { createIdGenerator } from "./ids";
import { wireEntrant } from "./pairing";

export interface EliminationTree {
  matches: GeneratedMatch[];
  finalMatchId: string;
  /** Losers dropping out after each winners-bracket round, index 0 = round 1.
   *  Round 1 only includes REAL matches — a bye produces no loser. */
  loserEntrantsByRound: Entrant[][];
}

/**
 * Builds a single elimination tree. Shared by `generateSingleElimination` and
 * `generateDoubleElimination` (which also needs the per-round loser lists to
 * build the losers bracket).
 */
export function buildEliminationTree(teams: TeamInput[], idPrefix: string): EliminationTree {
  if (teams.length < 2) {
    throw new Error("buildEliminationTree: need at least 2 teams");
  }

  const sorted = [...teams].sort((a, b) => a.seed - b.seed);
  const size = nextPowerOfTwo(sorted.length);
  const order = seedOrder(size);
  const teamBySeed = new Map(sorted.map((t) => [t.seed, t.id]));
  const positionTeam: (string | null)[] = order.map((seedNum) => teamBySeed.get(seedNum) ?? null);

  const nextId = createIdGenerator(idPrefix);
  const matches: GeneratedMatch[] = [];
  const loserEntrantsByRound: Entrant[][] = [];
  const numRounds = Math.log2(size);

  // Round 1: pair up seeded positions directly; a lone real team vs. an empty
  // slot is a bye and is resolved immediately (no loser produced).
  let currentFeed: Entrant[] = [];
  const round1Losers: Entrant[] = [];
  const round1Count = size / 2;
  for (let i = 0; i < round1Count; i++) {
    const home = positionTeam[2 * i];
    const away = positionTeam[2 * i + 1];
    const id = nextId();
    const isBye = (home === null) !== (away === null);
    const autoWinnerTeamId = isBye ? (home ?? away) : null;

    matches.push({
      id,
      bracket: "WINNERS",
      round: 1,
      position: i,
      groupId: null,
      homeTeamId: home,
      awayTeamId: away,
      autoWinnerTeamId,
      winnerNextMatchId: null,
      winnerNextSlot: null,
      loserNextMatchId: null,
      loserNextSlot: null,
      isReset: false,
    });

    if (autoWinnerTeamId) {
      currentFeed.push({ type: "TEAM", teamId: autoWinnerTeamId });
    } else {
      currentFeed.push({ type: "TBD", matchId: id, via: "WINNER" });
      round1Losers.push({ type: "TBD", matchId: id, via: "LOSER" });
    }
  }
  loserEntrantsByRound.push(round1Losers);

  // Rounds 2..numRounds: every slot is either a known bye-winner or TBD.
  for (let round = 2; round <= numRounds; round++) {
    const matchCount = size / 2 ** round;
    const nextFeed: Entrant[] = [];
    const roundLosers: Entrant[] = [];
    for (let i = 0; i < matchCount; i++) {
      const left = currentFeed[2 * i];
      const right = currentFeed[2 * i + 1];
      const id = nextId();

      matches.push({
        id,
        bracket: "WINNERS",
        round,
        position: i,
        groupId: null,
        homeTeamId: left.type === "TEAM" ? left.teamId : null,
        awayTeamId: right.type === "TEAM" ? right.teamId : null,
        autoWinnerTeamId: null,
        winnerNextMatchId: null,
        winnerNextSlot: null,
        loserNextMatchId: null,
        loserNextSlot: null,
        isReset: false,
      });

      wireEntrant(matches, left, id, "HOME");
      wireEntrant(matches, right, id, "AWAY");

      nextFeed.push({ type: "TBD", matchId: id, via: "WINNER" });
      roundLosers.push({ type: "TBD", matchId: id, via: "LOSER" });
    }
    currentFeed = nextFeed;
    loserEntrantsByRound.push(roundLosers);
  }

  const finalMatchId = matches[matches.length - 1].id;
  return { matches, finalMatchId, loserEntrantsByRound };
}

export function generateSingleElimination(teams: TeamInput[]): GeneratedBracket {
  const { matches, finalMatchId } = buildEliminationTree(teams, "WB");
  return { matches, finalMatchId };
}
