import { describe, expect, it } from "vitest";
import { computeTopScorers, computeCardRanking, type GoalRecord, type CardRecord } from "./stats";

function goal(playerId: string, playerName: string, teamId = "T1", teamName = "Time 1"): GoalRecord {
  return { playerId, playerName, teamId, teamName };
}

function card(playerId: string, playerName: string, type: "YELLOW" | "RED", teamId = "T1", teamName = "Time 1"): CardRecord {
  return { playerId, playerName, teamId, teamName, type };
}

describe("computeTopScorers", () => {
  it("counts goals per player and sorts descending", () => {
    const goals = [goal("p1", "Ana"), goal("p2", "Bia"), goal("p1", "Ana"), goal("p1", "Ana")];
    const result = computeTopScorers(goals);
    expect(result).toEqual([
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time 1", goals: 3 },
      { playerId: "p2", playerName: "Bia", teamId: "T1", teamName: "Time 1", goals: 1 },
    ]);
  });

  it("breaks ties alphabetically", () => {
    const goals = [goal("p2", "Bia"), goal("p1", "Ana")];
    const result = computeTopScorers(goals);
    expect(result.map((r) => r.playerName)).toEqual(["Ana", "Bia"]);
  });

  it("returns an empty list for no goals", () => {
    expect(computeTopScorers([])).toEqual([]);
  });
});

describe("computeCardRanking", () => {
  it("counts yellow and red cards separately per player", () => {
    const cards = [card("p1", "Ana", "YELLOW"), card("p1", "Ana", "YELLOW"), card("p1", "Ana", "RED"), card("p2", "Bia", "YELLOW")];
    const result = computeCardRanking(cards);
    expect(result).toEqual([
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time 1", yellow: 2, red: 1 },
      { playerId: "p2", playerName: "Bia", teamId: "T1", teamName: "Time 1", yellow: 1, red: 0 },
    ]);
  });

  it("sorts red cards above yellow-only, then by yellow count", () => {
    const cards = [card("p1", "Ana", "YELLOW"), card("p1", "Ana", "YELLOW"), card("p2", "Bia", "RED")];
    const result = computeCardRanking(cards);
    expect(result.map((r) => r.playerId)).toEqual(["p2", "p1"]);
  });
});
