import type { Entrant, GeneratedMatch, Slot } from "./types";

export function findMatch(matches: GeneratedMatch[], id: string): GeneratedMatch {
  const m = matches.find((mm) => mm.id === id);
  if (!m) throw new Error(`findMatch: match ${id} not found`);
  return m;
}

/** Points `entrant`'s source match at `toMatchId`/`toSlot`, using the winner or loser pointer as appropriate. */
export function wireEntrant(matches: GeneratedMatch[], entrant: Entrant, toMatchId: string, toSlot: Slot) {
  if (entrant.type !== "TBD") return;
  const source = findMatch(matches, entrant.matchId);
  if (entrant.via === "WINNER") {
    source.winnerNextMatchId = toMatchId;
    source.winnerNextSlot = toSlot;
  } else {
    source.loserNextMatchId = toMatchId;
    source.loserNextSlot = toSlot;
  }
}

export function entrantTeamId(entrant: Entrant): string | null {
  return entrant.type === "TEAM" ? entrant.teamId : null;
}

export interface PairResult {
  pairs: Array<[Entrant, Entrant]>;
  leftover: Entrant | null;
}

/** Pairs adjacent entrants; an odd one out carries over unpaired (untouched) into `leftover`. */
export function pairAdjacent(entrants: Entrant[]): PairResult {
  const pairs: Array<[Entrant, Entrant]> = [];
  const pairCount = Math.floor(entrants.length / 2);
  for (let i = 0; i < pairCount; i++) {
    pairs.push([entrants[2 * i], entrants[2 * i + 1]]);
  }
  const leftover = entrants.length % 2 === 1 ? entrants[entrants.length - 1] : null;
  return { pairs, leftover };
}

export interface ZipResult {
  pairs: Array<[Entrant, Entrant]>;
  leftover: Entrant[];
}

/** Pairs `a[i]` with `b[i]`; entries beyond the shorter list carry over unpaired into `leftover`. */
export function zipPairs(a: Entrant[], b: Entrant[]): ZipResult {
  const n = Math.min(a.length, b.length);
  const pairs: Array<[Entrant, Entrant]> = [];
  for (let i = 0; i < n; i++) pairs.push([a[i], b[i]]);
  return { pairs, leftover: [...a.slice(n), ...b.slice(n)] };
}
