import { describe, expect, it } from "vitest";
import { assignGameNumbers, isByeMatch, topologicalMatchOrder } from "./gameOrder";
import { generateDoubleElimination } from "./doubleElimination";
import type { TeamInput } from "./types";

function teams(n: number): TeamInput[] {
  return Array.from({ length: n }, (_, i) => ({ id: `T${i + 1}`, seed: i + 1 }));
}

describe("isByeMatch", () => {
  it("is true only for a FINISHED match with exactly one side filled in", () => {
    expect(isByeMatch({ status: "FINISHED", homeTeamId: "T1", awayTeamId: null })).toBe(true);
    expect(isByeMatch({ status: "FINISHED", homeTeamId: null, awayTeamId: "T1" })).toBe(true);
  });

  it("is false for a real finished match (both sides filled)", () => {
    expect(isByeMatch({ status: "FINISHED", homeTeamId: "T1", awayTeamId: "T2" })).toBe(false);
  });

  it("is false for a not-yet-reached future match (both sides null)", () => {
    expect(isByeMatch({ status: "SCHEDULED", homeTeamId: null, awayTeamId: null })).toBe(false);
  });
});

describe("assignGameNumbers", () => {
  it("skips a bye match if one is present (e.g. an already-generated tournament predating the minimal-byes bracket algorithm)", () => {
    const persisted = [
      { id: "m1", bracket: "WINNERS", round: 1, position: 0, status: "FINISHED", homeTeamId: "T1", awayTeamId: null },
      { id: "m2", bracket: "WINNERS", round: 1, position: 1, status: "SCHEDULED", homeTeamId: "T2", awayTeamId: "T3" },
      { id: "m3", bracket: "WINNERS", round: 2, position: 0, status: "SCHEDULED", homeTeamId: null, awayTeamId: null },
    ];
    const numbers = assignGameNumbers(persisted);
    expect(numbers.has("m1")).toBe(false); // the bye never gets a number
    expect(numbers.get("m2")).toBe(1);
    expect(numbers.get("m3")).toBe(2);
  });
});

describe("assignGameNumbers — against the current bracket generator", () => {
  function toPersisted(matches: ReturnType<typeof generateDoubleElimination>["matches"]) {
    return matches.map((m) => ({
      id: m.id,
      bracket: m.bracket,
      round: m.round,
      position: m.position,
      status: m.autoWinnerTeamId ? "FINISHED" : "SCHEDULED",
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      winnerNextMatchId: m.winnerNextMatchId,
      loserNextMatchId: m.loserNextMatchId,
    }));
  }

  it("numbers every real match sequentially in bracket-dependency order (the current generator no longer produces bye matches at all)", () => {
    const { matches } = generateDoubleElimination(teams(10));
    const byeCount = matches.filter((m) => m.autoWinnerTeamId !== null).length;
    expect(byeCount).toBe(0);

    const numbers = assignGameNumbers(toPersisted(matches));

    // Standard formula: J = (n-1)*2 + 1 reset match = 19 real games for n=10.
    expect(numbers.size).toBe(19);
    expect(new Set(numbers.values()).size).toBe(19); // no duplicate numbers
    expect(Math.max(...numbers.values())).toBe(19);
    expect(Math.min(...numbers.values())).toBe(1);
  });

  it("numbers a full power-of-two bracket with no gaps (no byes to skip)", () => {
    const { matches } = generateDoubleElimination(teams(8));
    const numbers = assignGameNumbers(toPersisted(matches));
    // J = (8-1)*2 + 1 reset = 15.
    expect(numbers.size).toBe(15);
    expect([...numbers.values()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
  });

  it.each([9, 10, 11, 13, 16, 17])(
    "%i teams: every match's number comes before both its winner-next and loser-next targets' numbers",
    (n) => {
      const { matches } = generateDoubleElimination(teams(n));
      const numbers = assignGameNumbers(toPersisted(matches));
      for (const m of matches) {
        if (m.winnerNextMatchId && numbers.has(m.winnerNextMatchId)) {
          expect(numbers.get(m.id)!).toBeLessThan(numbers.get(m.winnerNextMatchId)!);
        }
        if (m.loserNextMatchId && numbers.has(m.loserNextMatchId)) {
          expect(numbers.get(m.id)!).toBeLessThan(numbers.get(m.loserNextMatchId)!);
        }
      }
    }
  );
});

describe("topologicalMatchOrder — regression: a losers-bracket round is not simultaneous with a winners round of the same number", () => {
  it("orders a winners-bracket match before the losers-bracket match its loser drops into, even when the losers match's own round number is lower", () => {
    // Minimal reproduction of the real bug: WB round 1's loser feeds a LB
    // match that (because losers-bracket rounds are numbered independently)
    // happens to carry round 1 too — a naive (bracket, round, position)
    // sort can't tell these apart and may place the LB match first.
    const matches = [
      {
        id: "wb1",
        bracket: "WINNERS",
        round: 1,
        position: 0,
        status: "SCHEDULED",
        homeTeamId: "T1",
        awayTeamId: "T2",
        winnerNextMatchId: null,
        loserNextMatchId: "lb1",
      },
      {
        id: "lb1",
        bracket: "LOSERS",
        round: 1,
        position: 0,
        status: "SCHEDULED",
        homeTeamId: null,
        awayTeamId: null,
        winnerNextMatchId: null,
        loserNextMatchId: null,
      },
    ];

    const ordered = topologicalMatchOrder(matches);
    expect(ordered.map((m) => m.id)).toEqual(["wb1", "lb1"]);
  });
});
