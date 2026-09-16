export interface LayoutMatchInput {
  id: string;
  round: number;
  winnerNextMatchId: string | null;
  winnerNextSlot: "HOME" | "AWAY" | null;
}

export interface MatchLayout {
  round: number;
  /** Vertical position in leaf-slot units (not pixels) — a match sits
   *  midway between its two feeders (or leaf slots, where a side has no
   *  feeder within this set — e.g. a raw team entering directly). */
  y: number;
}

/**
 * Lays out one bracket tree (e.g. just the winners bracket, or just the
 * losers bracket) for line-and-box rendering: each match gets a vertical
 * position centered between whatever feeds its two sides. A side with no
 * feeder *within this match set* (a raw team, or — for the losers bracket
 * — a loser dropping in from the winners bracket) is treated as its own
 * fresh leaf slot, assigned left-to-right, top-to-bottom as the tree is
 * walked from its root(s).
 */
export function layoutBracketTree(matches: LayoutMatchInput[]): Map<string, MatchLayout> {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const feederOf = new Map<string, { HOME?: string; AWAY?: string }>();
  for (const m of matches) {
    if (m.winnerNextMatchId && m.winnerNextSlot && byId.has(m.winnerNextMatchId)) {
      const entry = feederOf.get(m.winnerNextMatchId) ?? {};
      entry[m.winnerNextSlot] = m.id;
      feederOf.set(m.winnerNextMatchId, entry);
    }
  }

  const result = new Map<string, MatchLayout>();
  let nextLeaf = 0;

  function visit(matchId: string): number {
    if (result.has(matchId)) return result.get(matchId)!.y;
    const m = byId.get(matchId)!;
    const feeders = feederOf.get(matchId) ?? {};
    const homeY = feeders.HOME ? visit(feeders.HOME) : nextLeaf++;
    const awayY = feeders.AWAY ? visit(feeders.AWAY) : nextLeaf++;
    const y = (homeY + awayY) / 2;
    result.set(matchId, { round: m.round, y });
    return y;
  }

  // Roots are matches whose winner doesn't advance to another match in this
  // same set (e.g. the winners-bracket final, whose winner goes to the
  // grand final — outside this set). Visited in round order so ties (more
  // than one root) still lay out top-to-bottom sensibly.
  const roots = [...matches].sort((a, b) => a.round - b.round);
  for (const m of roots) {
    if (!m.winnerNextMatchId || !byId.has(m.winnerNextMatchId)) {
      visit(m.id);
    }
  }
  // Safety net: any match not reached from a root (shouldn't happen for a
  // well-formed bracket) still gets laid out rather than silently dropped.
  for (const m of matches) {
    if (!result.has(m.id)) visit(m.id);
  }

  return result;
}
