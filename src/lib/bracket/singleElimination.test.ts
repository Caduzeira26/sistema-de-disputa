import { describe, expect, it } from "vitest";
import { generateSingleElimination } from "./singleElimination";
import { simulateBracket } from "./testUtils";
import type { TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

/** Ground truth transcribed from the reference "Eliminatória Simples" paper
 *  bracket templates (Sesi/PR), by letter position (A=team1, B=team2, ...):
 *  each entry is a set of the real (non-bye) round-1 pairs. This is the
 *  exact convention the organizer asked to match — minimal byes, byes at
 *  the extremes, everyone else paired off immediately. */
const REFERENCE_ROUND1_PAIRS: Record<number, Array<[number, number]>> = {
  // 9 teams: only A(seed1) sits out; B..I pair off.
  9: [
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
  ],
  // 10 teams: A(seed1) and J(seed10) sit out; B..I pair off.
  10: [
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
  ],
  // 13 teams: A(seed1), H(seed8), M(seed13) sit out; the rest pair off.
  13: [
    [2, 3],
    [4, 5],
    [6, 7],
    [9, 10],
    [11, 12],
  ],
};

describe("generateSingleElimination — minimal byes (matches the reference paper templates)", () => {
  it.each(Object.keys(REFERENCE_ROUND1_PAIRS).map(Number))(
    "%i teams: round 1 has exactly the reference's real pairs, byes sit out untouched",
    (n) => {
      const { matches } = generateSingleElimination(teams(n));
      const round1 = matches.filter((m) => m.round === 1);
      const actualPairs = round1
        .map((m) => [Number(m.homeTeamId!.slice(1)), Number(m.awayTeamId!.slice(1))].sort((a, b) => a - b))
        .sort((a, b) => a[0] - b[0]);
      const expectedPairs = [...REFERENCE_ROUND1_PAIRS[n]].sort((a, b) => a[0] - b[0]);
      expect(actualPairs).toEqual(expectedPairs);
    }
  );

  it("never creates an already-decided (bye) match — every match has two real sides once its inputs are known", () => {
    for (const n of [2, 3, 5, 6, 7, 9, 10, 13, 16, 17]) {
      const { matches } = generateSingleElimination(teams(n));
      for (const m of matches) {
        expect(m.autoWinnerTeamId).toBeNull();
      }
    }
  });

  it("byes = min(n - prevPow2, nextPow2 - n): round 1 match count matches the formula", () => {
    // (n, expected round-1 real match count)
    const cases: Array<[number, number]> = [
      [9, 4],
      [10, 4],
      [11, 4], // byes >= 3 here, so the field splits into two halves recursed independently
      [13, 5],
      [16, 8], // power of two: no byes at all
    ];
    for (const [n, expectedMatches] of cases) {
      const { matches } = generateSingleElimination(teams(n));
      const round1 = matches.filter((m) => m.round === 1);
      expect(round1).toHaveLength(expectedMatches);
    }
  });
});

describe("generateSingleElimination — full-tree regression against the reference template", () => {
  /** Walks the generated match tree back from the final, resolving every
   *  TBD reference, and returns the set of "who plays whom" pairs as
   *  sorted-seed-number tuples — independent of match id/order, so it can
   *  be compared directly against a hand-transcribed reference bracket. */
  function pairSet(matches: ReturnType<typeof generateSingleElimination>["matches"], finalMatchId: string): Set<string> {
    const byId = new Map(matches.map((m) => [m.id, m]));
    const seedOf = (teamId: string) => Number(teamId.slice(1));
    const pairs = new Set<string>();

    function resolve(matchId: string): number {
      const m = byId.get(matchId)!;
      const home = m.homeTeamId ? seedOf(m.homeTeamId) : resolve(matches.find((x) => x.winnerNextMatchId === matchId && x.winnerNextSlot === "HOME")!.id);
      const away = m.awayTeamId ? seedOf(m.awayTeamId) : resolve(matches.find((x) => x.winnerNextMatchId === matchId && x.winnerNextSlot === "AWAY")!.id);
      pairs.add(JSON.stringify([home, away].sort((a, b) => a - b)));
      return Math.min(home, away); // arbitrary: real "who won" isn't known pre-play, just need *a* representative
    }
    resolve(finalMatchId);
    return pairs;
  }

  // Ground truth transcribed directly from the reference spreadsheet's
  // "Vencedor Jogo NN-A" chains (seed numbers = list position, 1-indexed).
  const REFERENCE_TREES: Record<number, Array<[number, number]>> = {
    9: [
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9],
      [1, 2], // seed1 (bye) vs winner(2,3)
      [6, 8], // winner(6,7) vs winner(8,9)
      [1, 4], // [seed1+winner(2,3)] vs winner(4,5)
      [1, 6], // final: [seed1 branch] vs [winner(6,7)+winner(8,9)]
    ],
    10: [
      [2, 3],
      [8, 9],
      [6, 7],
      [4, 5],
      [1, 2], // seed1 (bye) vs winner(2,3)
      [8, 10], // winner(8,9) vs seed10 (bye)
      [1, 4], // [seed1 branch] vs winner(4,5)
      [6, 8], // winner(6,7) vs [winner(8,9)+seed10 branch]
      [1, 6], // final
    ],
    13: [
      [2, 3],
      [11, 12],
      [9, 10],
      [4, 5],
      [6, 7],
      [11, 13], // winner(11,12) vs seed13 (bye)
      [8, 9], // seed8 (bye) vs winner(9,10)
      [1, 2], // seed1 (bye) vs winner(2,3)
      [4, 6], // winner(4,5) vs winner(6,7)
      [8, 11], // [seed8 branch] vs [winner(11,12)+seed13 branch]
      [1, 4], // [seed1 branch] vs [winner(4,5)+winner(6,7)]
      [8, 1], // final
    ],
  };

  it.each(Object.keys(REFERENCE_TREES).map(Number))(
    "%i teams: the full tree (every merge, not just round 1) matches the reference bracket exactly",
    (n) => {
      const { matches, finalMatchId } = generateSingleElimination(teams(n));
      const actual = pairSet(matches, finalMatchId!);
      const expected = new Set(REFERENCE_TREES[n].map(([a, b]) => JSON.stringify([a, b].sort((x, y) => x - y))));
      expect(actual).toEqual(expected);
    }
  );
});

describe("generateSingleElimination — power of two", () => {
  it.each([2, 4, 8, 16])("creates a full bracket with no byes for %i teams", (n) => {
    const { matches, finalMatchId } = generateSingleElimination(teams(n));
    expect(matches).toHaveLength(n - 1);
    expect(matches.every((m) => m.homeTeamId !== null || m.round > 1)).toBe(true);

    const final = matches.find((m) => m.id === finalMatchId)!;
    expect(final.winnerNextMatchId).toBeNull();
  });
});

describe("generateSingleElimination — structural invariants across many sizes", () => {
  it.each(Array.from({ length: 31 }, (_, i) => i + 2))("%i teams: exactly n-1 matches, every team appears exactly once", (n) => {
    const { matches } = generateSingleElimination(teams(n));
    expect(matches).toHaveLength(n - 1);

    const seen = new Set<string>();
    for (const m of matches) {
      if (m.homeTeamId) seen.add(m.homeTeamId);
      if (m.awayTeamId) seen.add(m.awayTeamId);
    }
    // Every raw team eventually appears as a side in some match (nobody
    // walks to the championship without ever playing, for n >= 2).
    expect(seen.size).toBe(n);
  });
});

describe("generateSingleElimination — full simulation", () => {
  it.each([2, 3, 4, 5, 6, 7, 8, 9, 13, 16])(
    "produces exactly one champion for %i teams, and it's always the top seed when the top seed always wins",
    (n) => {
      const ts = teams(n);
      const { matches } = generateSingleElimination(ts);
      const result = simulateBracket(matches, (home, away) => {
        const seedOf = (id: string) => ts.find((t) => t.id === id)!.seed;
        return seedOf(home) < seedOf(away) ? home : away;
      });
      expect(result.championTeamId).toBe("T1");
      // Every non-champion loses exactly once in single elimination.
      for (const t of ts.slice(1)) {
        expect(result.lossCount.get(t.id)).toBe(1);
      }
      expect(result.lossCount.get("T1") ?? 0).toBe(0);
    }
  );

  it("rejects fewer than 2 teams", () => {
    expect(() => generateSingleElimination(teams(1))).toThrow();
    expect(() => generateSingleElimination([])).toThrow();
  });
});
