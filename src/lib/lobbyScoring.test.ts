import { describe, expect, it } from "vitest";
import {
  PLACEMENT_POINTS,
  computeLobbyStandings,
  entryPoints,
  placementPoints,
  validateRoundEntries,
} from "./lobbyScoring";

describe("placementPoints", () => {
  it("matches the official LBFF table 12-9-8-7-6-5-4-3-2-1-0-0", () => {
    expect([...PLACEMENT_POINTS]).toEqual([12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(placementPoints)).toEqual([12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]);
  });

  it("gives 0 beyond 12th place", () => {
    expect(placementPoints(13)).toBe(0);
  });
});

describe("entryPoints", () => {
  it("adds one point per kill to the placement points (Booyah + 6 kills = 18)", () => {
    expect(entryPoints(1, 6)).toBe(18);
  });

  it("has no cap on kills", () => {
    expect(entryPoints(12, 25)).toBe(25);
  });

  it("gives 15 for a Booyah with 3 kills (the LBFF example)", () => {
    expect(entryPoints(1, 3)).toBe(15);
  });
});

describe("validateRoundEntries", () => {
  const sheet = (placements: number[]) => placements.map((placement, i) => ({ teamId: `t${i}`, placement, kills: 0 }));

  it("accepts a complete, unique ranking", () => {
    expect(validateRoundEntries(sheet([3, 1, 2]))).toBeNull();
  });

  it("rejects a repeated placement", () => {
    expect(validateRoundEntries(sheet([1, 1, 2]))).toMatch(/1ª colocação/);
  });

  it("rejects a placement outside 1..number of teams", () => {
    expect(validateRoundEntries(sheet([1, 2, 4]))).toMatch(/de 1 a 3/);
    expect(validateRoundEntries(sheet([0, 1, 2]))).toMatch(/de 1 a 3/);
  });

  it("rejects negative or fractional kills", () => {
    expect(validateRoundEntries([{ teamId: "a", placement: 1, kills: -1 }])).toMatch(/abates/);
    expect(validateRoundEntries([{ teamId: "a", placement: 1, kills: 1.5 }])).toMatch(/abates/);
  });
});

describe("computeLobbyStandings", () => {
  const round = (number: number, rows: [string, number | null, number][]) => ({
    number,
    entries: rows.map(([teamId, placement, kills]) => ({ teamId, placement, kills })),
  });

  it("sums placement and kill points across finished rounds", () => {
    const standings = computeLobbyStandings(["A", "B", "C"], [
      round(1, [["A", 1, 5], ["B", 2, 2], ["C", 3, 0]]), // A 17, B 11, C 8
      round(2, [["A", 3, 1], ["B", 1, 0], ["C", 2, 4]]), // A 9, B 12, C 13
    ]);
    expect(standings.map((s) => [s.teamId, s.points])).toEqual([
      ["A", 26],
      ["B", 23],
      ["C", 21],
    ]);
    expect(standings[0]).toMatchObject({ teamId: "A", points: 26, booyahs: 1, kills: 6, perRound: [17, 9] });
  });

  it("ignores rounds that haven't been played yet", () => {
    const standings = computeLobbyStandings(["A", "B"], [
      round(1, [["A", 1, 0], ["B", 2, 0]]),
      round(2, [["A", null, 0], ["B", null, 0]]),
    ]);
    expect(standings.find((s) => s.teamId === "A")!.perRound).toEqual([12]);
  });

  it("lists teams with no rounds yet at zero", () => {
    const standings = computeLobbyStandings(["A", "B"], []);
    expect(standings.map((s) => s.points)).toEqual([0, 0]);
  });

  it("breaks a points tie by Booyahs first", () => {
    // A: Booyah, 0 kills = 12; B: 2nd place with 3 kills = 12. Same points, A has the Booyah.
    const standings = computeLobbyStandings(["A", "B"], [round(1, [["A", 1, 0], ["B", 2, 3]])]);
    expect(standings.map((s) => s.points)).toEqual([12, 12]);
    expect(standings.map((s) => s.teamId)).toEqual(["A", "B"]);
  });

  it("breaks a points and Booyah tie by kills", () => {
    // Both 12 points, neither with a Booyah... A: 3rd (8) + 4 kills; B: 4th (7) + 5 kills.
    const standings = computeLobbyStandings(["A", "B"], [round(1, [["A", 3, 4], ["B", 4, 5]])]);
    expect(standings[0].points).toBe(12);
    expect(standings[1].points).toBe(12);
    expect(standings[0].teamId).toBe("B");
  });

  it("breaks a tie on points and Booyahs by kills before placement points", () => {
    // A: 5th (6) + 3 kills = 9; B: 3rd (8) + 1 kill = 9. Same points, no Booyah; A has more kills.
    const standings = computeLobbyStandings(["A", "B"], [round(1, [["A", 5, 3], ["B", 3, 1]])]);
    expect(standings.map((s) => s.points)).toEqual([9, 9]);
    expect(standings[0].teamId).toBe("A");
  });

  it("breaks a full tie by the better placement in the last queda", () => {
    const standings = computeLobbyStandings(["A", "B"], [
      round(1, [["A", 1, 0], ["B", 2, 0]]), // A 12, B 9
      round(2, [["A", 2, 0], ["B", 1, 0]]), // A 9, B 12 -> both 21, 1 Booyah, 0 kills, 21 placement pts
    ]);
    expect(standings[0].teamId).toBe("B"); // won the last queda
  });

  it("is stable regardless of the order rounds are given in", () => {
    const rounds = [
      round(2, [["A", 2, 0], ["B", 1, 0]]),
      round(1, [["A", 1, 0], ["B", 2, 0]]),
    ];
    expect(computeLobbyStandings(["A", "B"], rounds)[0].teamId).toBe("B");
  });
});
