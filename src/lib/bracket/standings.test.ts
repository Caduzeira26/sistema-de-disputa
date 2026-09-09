import { describe, expect, it } from "vitest";
import { computeStandings, type StandingsInputMatch } from "./standings";

const A = "A";
const B = "B";
const C = "C";

function match(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  status: StandingsInputMatch["status"] = "FINISHED"
): StandingsInputMatch {
  return { homeTeamId, awayTeamId, homeScore, awayScore, status };
}

describe("computeStandings", () => {
  it("starts every team at zero", () => {
    const table = computeStandings([A, B, C], []);
    expect(table).toHaveLength(3);
    expect(table.every((t) => t.played === 0 && t.points === 0)).toBe(true);
  });

  it("awards points for wins, draws and losses", () => {
    const matches = [
      match(A, B, 2, 0), // A beats B
      match(B, C, 1, 1), // draw
    ];
    const table = computeStandings([A, B, C], matches);
    const byId = Object.fromEntries(table.map((t) => [t.teamId, t]));

    expect(byId[A]).toMatchObject({ played: 1, wins: 1, draws: 0, losses: 0, points: 3, goalsFor: 2, goalsAgainst: 0 });
    expect(byId[B]).toMatchObject({ played: 2, wins: 0, draws: 1, losses: 1, points: 1, goalsFor: 1, goalsAgainst: 3 });
    expect(byId[C]).toMatchObject({ played: 1, wins: 0, draws: 1, losses: 0, points: 1, goalsFor: 1, goalsAgainst: 1 });
  });

  it("ignores matches that aren't finished or aren't fully scored", () => {
    const matches: StandingsInputMatch[] = [
      match(A, B, 2, 0, "SCHEDULED"),
      { homeTeamId: A, awayTeamId: B, homeScore: null, awayScore: null, status: "FINISHED" },
    ];
    const table = computeStandings([A, B], matches);
    expect(table.every((t) => t.played === 0)).toBe(true);
  });

  it("sorts by points, then wins, then goal difference, then goals for", () => {
    const matches = [
      match(A, B, 1, 0),
      match(A, C, 1, 0),
      match(B, C, 5, 0),
    ];
    // A: 2 wins, 6 pts, GD +2. B: 1 win 1 loss, 3 pts, GD +4. C: 2 losses, 0 pts.
    const table = computeStandings([A, B, C], matches);
    expect(table.map((t) => t.teamId)).toEqual([A, B, C]);
  });

  it("uses custom points config", () => {
    const table = computeStandings([A, B], [match(A, B, 1, 1)], { win: 3, draw: 2, loss: 1 });
    expect(table.find((t) => t.teamId === A)!.points).toBe(2);
  });
});
