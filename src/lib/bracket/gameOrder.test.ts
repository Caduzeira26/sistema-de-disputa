import { describe, expect, it } from "vitest";
import { assignGameNumbers, isByeMatch } from "./gameOrder";
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
  it("numbers real matches sequentially in bracket-dependency order, skipping byes", () => {
    // 10 teams, double elimination -> bracket size 16, 6 byes in WB round 1,
    // per the standard formula from the reference spreadsheets.
    const { matches } = generateDoubleElimination(teams(10));
    const byeCount = matches.filter((m) => m.autoWinnerTeamId !== null).length;
    expect(byeCount).toBe(6);

    // Simulate persistence: a bye is FINISHED with one side set, mirroring
    // persistGeneratedBracket's status/homeScore logic.
    const persisted = matches.map((m) => ({
      id: m.id,
      bracket: m.bracket,
      round: m.round,
      position: m.position,
      status: m.autoWinnerTeamId ? "FINISHED" : "SCHEDULED",
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
    }));

    const numbers = assignGameNumbers(persisted);

    // Standard formula: J = (n-1)*2 + 1 reset match = 19 real games for n=10.
    expect(numbers.size).toBe(19);
    expect(new Set(numbers.values()).size).toBe(19); // no duplicate numbers
    expect(Math.max(...numbers.values())).toBe(19);
    expect(Math.min(...numbers.values())).toBe(1);

    // No bye ever gets a number.
    for (const m of persisted) {
      if (m.status === "FINISHED" && (m.homeTeamId === null) !== (m.awayTeamId === null)) {
        expect(numbers.has(m.id)).toBe(false);
      }
    }
  });

  it("numbers a full power-of-two bracket with no gaps (no byes to skip)", () => {
    const { matches } = generateDoubleElimination(teams(8));
    const persisted = matches.map((m) => ({
      id: m.id,
      bracket: m.bracket,
      round: m.round,
      position: m.position,
      status: m.autoWinnerTeamId ? "FINISHED" : "SCHEDULED",
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
    }));
    const numbers = assignGameNumbers(persisted);
    // J = (8-1)*2 + 1 reset = 15.
    expect(numbers.size).toBe(15);
    expect([...numbers.values()].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
  });
});
