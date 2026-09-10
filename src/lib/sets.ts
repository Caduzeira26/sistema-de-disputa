export interface SetScore {
  homePoints: number;
  awayPoints: number;
}

/** Counts sets won by each side. A tied set (should never happen in a real
 * match) counts for neither side. */
export function countSetsWon(sets: SetScore[]): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (const s of sets) {
    if (s.homePoints > s.awayPoints) home += 1;
    else if (s.awayPoints > s.homePoints) away += 1;
  }
  return { home, away };
}
