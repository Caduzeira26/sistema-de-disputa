const BRACKET_ORDER: Record<string, number> = { GROUP: 0, WINNERS: 1, LOSERS: 1, GRAND_FINAL: 2 };

/**
 * A bye: auto-resolved at bracket-generation time, never actually played.
 * Its signature is unambiguous — exactly one side filled in and already
 * FINISHED — unlike a real future match (both sides null until earlier
 * rounds decide them) or a real played one (both sides filled in).
 */
export function isByeMatch(m: { status: string; homeTeamId: string | null; awayTeamId: string | null }): boolean {
  return m.status === "FINISHED" && (m.homeTeamId === null) !== (m.awayTeamId === null);
}

/** The order matches are meant to be played in: group stage first, then the
 *  elimination rounds in order, grand final last. Same order used to
 *  auto-distribute kickoff times. */
export function compareBracketOrder(
  a: { bracket: string; round: number; position: number },
  b: { bracket: string; round: number; position: number }
): number {
  const rankA = BRACKET_ORDER[a.bracket] ?? 9;
  const rankB = BRACKET_ORDER[b.bracket] ?? 9;
  if (rankA !== rankB) return rankA - rankB;
  if (a.round !== b.round) return a.round - b.round;
  return a.position - b.position;
}

export interface OrderableMatch {
  id: string;
  bracket: string;
  round: number;
  position: number;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

/**
 * Sequential "Jogo N" numbers for real (non-bye) matches, in bracket-
 * dependency order — the same paper-bracket convention the printed
 * templates use (Jogo 01, 02, 03...), independent of whether kickoff times
 * have been assigned yet. Byes never get a number.
 */
export function assignGameNumbers(matches: OrderableMatch[]): Map<string, number> {
  const ordered = matches.filter((m) => !isByeMatch(m)).sort(compareBracketOrder);
  const map = new Map<string, number>();
  ordered.forEach((m, i) => map.set(m.id, i + 1));
  return map;
}
