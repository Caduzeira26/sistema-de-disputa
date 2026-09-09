import { describe, expect, it } from "vitest";
import { generateSingleElimination } from "./singleElimination";
import { simulateBracket } from "./testUtils";
import type { TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

describe("generateSingleElimination — power of two", () => {
  it.each([2, 4, 8, 16])("creates a full bracket with no byes for %i teams", (n) => {
    const { matches, finalMatchId } = generateSingleElimination(teams(n));
    const numRounds = Math.log2(n);

    expect(matches).toHaveLength(n - 1);
    expect(new Set(matches.map((m) => m.round)).size).toBe(numRounds);
    expect(matches.every((m) => m.autoWinnerTeamId === null)).toBe(true);

    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(n / 2);
    expect(round1.every((m) => m.homeTeamId !== null && m.awayTeamId !== null)).toBe(true);

    const final = matches.find((m) => m.id === finalMatchId)!;
    expect(final.round).toBe(numRounds);
    expect(final.winnerNextMatchId).toBeNull();
  });

  it("seeds 1 and N meet only in the final for an 8-team bracket", () => {
    const { matches } = generateSingleElimination(teams(8));
    const round1 = matches.filter((m) => m.round === 1);
    // Seed order is [1,8,4,5,2,7,3,6] -> round 1 pairs (1,8) (4,5) (2,7) (3,6)
    expect(round1.map((m) => [m.homeTeamId, m.awayTeamId])).toEqual([
      ["T1", "T8"],
      ["T4", "T5"],
      ["T2", "T7"],
      ["T3", "T6"],
    ]);
  });
});

describe("generateSingleElimination — byes for non-power-of-two team counts", () => {
  it.each([
    [3, 4, 1],
    [5, 8, 3],
    [6, 8, 2],
    [7, 8, 1],
    [9, 16, 7],
  ])("%i teams -> bracket size %i with %i byes", (n, bracketSize, expectedByes) => {
    const { matches } = generateSingleElimination(teams(n));
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(bracketSize / 2);

    const byes = round1.filter((m) => m.autoWinnerTeamId !== null);
    expect(byes).toHaveLength(expectedByes);
    // A bye match has exactly one real team and the other slot empty.
    for (const bye of byes) {
      const sides = [bye.homeTeamId, bye.awayTeamId];
      expect(sides.filter((s) => s !== null)).toHaveLength(1);
      expect(bye.autoWinnerTeamId).toBe(sides.find((s) => s !== null));
    }
  });

  it("top seeds receive the byes", () => {
    // 5 teams -> bracket size 8 -> 3 byes. Seed order [1,8,4,5,2,7,3,6]; seeds
    // 6,7,8 don't exist, so round-1 pairs are (1,BYE) (4,5) (2,BYE) (3,BYE).
    const { matches } = generateSingleElimination(teams(5));
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1.map((m) => m.autoWinnerTeamId)).toEqual(["T1", null, "T2", "T3"]);
  });

  it("propagates a bye winner directly into round 2 (no dangling TBD)", () => {
    const { matches } = generateSingleElimination(teams(5));
    const round1 = matches.filter((m) => m.round === 1);
    const round2 = matches.filter((m) => m.round === 2);

    // A bye match has nowhere to advance a "winner" pointer to — its winner
    // is baked directly into round 2's homeTeamId/awayTeamId at generation
    // time instead, so T1's bye match itself has no winnerNextMatchId.
    const t1Bye = round1.find((m) => m.autoWinnerTeamId === "T1")!;
    expect(t1Bye.winnerNextMatchId).toBeNull();
    expect(round2.some((m) => m.homeTeamId === "T1" || m.awayTeamId === "T1")).toBe(true);
  });

  it("two bye-advanced teams can land in the same round-2 match (double bye cascade)", () => {
    // 5 teams: T2 and T3 both get byes and are seeded to meet in round 2.
    const { matches } = generateSingleElimination(teams(5));
    const round2 = matches.filter((m) => m.round === 2);
    const t2t3Match = round2.find(
      (m) => (m.homeTeamId === "T2" && m.awayTeamId === "T3") || (m.homeTeamId === "T3" && m.awayTeamId === "T2")
    );
    expect(t2t3Match).toBeDefined();
    expect(t2t3Match!.autoWinnerTeamId).toBeNull(); // it's a real match, not another bye
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
