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

/** Tie-breaker among matches that are equally "ready" in the dependency
 *  order below: group stage first, then winners/losers by round and
 *  position, grand final last. On its own this is *not* a safe ordering —
 *  a winners-bracket round and a losers-bracket round with the same number
 *  aren't simultaneous, since the losers round depends on that winners
 *  round's losers — which is exactly why `topologicalMatchOrder` only uses
 *  it to break ties among matches with no unresolved dependency between
 *  them, never to compare across brackets directly. */
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
  winnerNextMatchId?: string | null;
  loserNextMatchId?: string | null;
}

/**
 * Orders matches so that anything a match's winner *or* loser feeds into
 * always comes after it — a real topological sort over both advancement
 * pointers, not just a comparison of `round` numbers. `round` is tracked
 * independently for the winners and losers brackets (see
 * `generateDoubleElimination`), so "round 1" in each isn't the same point
 * in the tournament: a losers-bracket round depends on a winners-bracket
 * round's losers, and naively sorting by (bracket, round, position) can
 * schedule that losers match *before* the winners match that decides who's
 * even in it. `compareBracketOrder` is only used here to break ties among
 * matches with no dependency on each other, so the result still reads
 * front-to-back the way a printed bracket does.
 */
export function topologicalMatchOrder<T extends OrderableMatch>(matches: T[]): T[] {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const dependents = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const m of matches) inDegree.set(m.id, 0);

  for (const m of matches) {
    const targets = [m.winnerNextMatchId, m.loserNextMatchId].filter(
      (id): id is string => !!id && byId.has(id) && id !== m.id
    );
    for (const targetId of new Set(targets)) {
      (dependents.get(m.id) ?? dependents.set(m.id, []).get(m.id)!).push(targetId);
      inDegree.set(targetId, (inDegree.get(targetId) ?? 0) + 1);
    }
  }

  const ready = matches.filter((m) => inDegree.get(m.id) === 0);
  const ordered: T[] = [];
  while (ready.length > 0) {
    ready.sort(compareBracketOrder);
    const next = ready.shift()!;
    ordered.push(next);
    for (const targetId of dependents.get(next.id) ?? []) {
      const remaining = inDegree.get(targetId)! - 1;
      inDegree.set(targetId, remaining);
      if (remaining === 0) ready.push(byId.get(targetId)!);
    }
  }

  // Safety net: a cycle or missing pointer shouldn't happen for a
  // well-formed bracket, but if it did, append whatever's left rather than
  // silently dropping matches.
  if (ordered.length < matches.length) {
    const seen = new Set(ordered.map((m) => m.id));
    for (const m of [...matches].sort(compareBracketOrder)) {
      if (!seen.has(m.id)) ordered.push(m);
    }
  }

  return ordered;
}

/**
 * Sequential "Jogo N" numbers for real (non-bye) matches, in true
 * dependency order — the same paper-bracket convention the printed
 * templates use (Jogo 01, 02, 03...), independent of whether kickoff times
 * have been assigned yet. Byes never get a number.
 */
export function assignGameNumbers(matches: OrderableMatch[]): Map<string, number> {
  const ordered = topologicalMatchOrder(matches.filter((m) => !isByeMatch(m)));
  const map = new Map<string, number>();
  ordered.forEach((m, i) => map.set(m.id, i + 1));
  return map;
}
