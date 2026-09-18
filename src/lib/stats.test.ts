import { describe, expect, it } from "vitest";
import {
  computeTopScorers,
  computeCardRanking,
  computeTopPointScorers,
  computeFoulRanking,
  computeGameWinRanking,
  computeGoalkeeperRanking,
  type GoalRecord,
  type CardRecord,
  type BasketRecord,
  type FoulRecord,
  type GameResultRecord,
  type TableTennisPlayer,
  type GoalkeeperRecord,
  type TeamMatchConceded,
} from "./stats";

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

function basket(playerId: string, playerName: string, points: number, teamId = "T1", teamName = "Time 1"): BasketRecord {
  return { playerId, playerName, teamId, teamName, points };
}

function foul(playerId: string, playerName: string, teamId = "T1", teamName = "Time 1"): FoulRecord {
  return { playerId, playerName, teamId, teamName };
}

describe("computeTopPointScorers", () => {
  it("sums basket points per player, not basket count", () => {
    const baskets = [basket("p1", "Ana", 3), basket("p1", "Ana", 2), basket("p2", "Bia", 2)];
    const result = computeTopPointScorers(baskets);
    expect(result).toEqual([
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time 1", points: 5 },
      { playerId: "p2", playerName: "Bia", teamId: "T1", teamName: "Time 1", points: 2 },
    ]);
  });

  it("breaks ties alphabetically", () => {
    const baskets = [basket("p2", "Bia", 2), basket("p1", "Ana", 2)];
    expect(computeTopPointScorers(baskets).map((r) => r.playerName)).toEqual(["Ana", "Bia"]);
  });
});

describe("computeFoulRanking", () => {
  it("counts fouls per player, most first", () => {
    const fouls = [foul("p1", "Ana"), foul("p1", "Ana"), foul("p2", "Bia")];
    const result = computeFoulRanking(fouls);
    expect(result).toEqual([
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time 1", fouls: 2 },
      { playerId: "p2", playerName: "Bia", teamId: "T1", teamName: "Time 1", fouls: 1 },
    ]);
  });
});

function goalkeeper(playerId: string, playerName: string, teamId: string, teamName = "Time"): GoalkeeperRecord {
  return { playerId, playerName, teamId, teamName };
}

function conceded(teamId: string, goalsConceded: number): TeamMatchConceded {
  return { teamId, goalsConceded };
}

describe("computeGoalkeeperRanking", () => {
  it("ranks by average goals conceded per match, lowest first", () => {
    const goalkeepers = [goalkeeper("p1", "Ana", "T1"), goalkeeper("p2", "Bia", "T2")];
    const teamMatches = [
      conceded("T1", 1),
      conceded("T1", 3), // T1: 4 conceded / 2 matches = 2.0
      conceded("T2", 0),
      conceded("T2", 1), // T2: 1 conceded / 2 matches = 0.5
    ];
    const result = computeGoalkeeperRanking(goalkeepers, teamMatches);
    expect(result).toEqual([
      { playerId: "p2", playerName: "Bia", teamId: "T2", teamName: "Time", matchesPlayed: 2, goalsConceded: 1, average: 0.5 },
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time", matchesPlayed: 2, goalsConceded: 4, average: 2 },
    ]);
  });

  it("shares a team's tally across multiple goalkeepers on that team", () => {
    const goalkeepers = [goalkeeper("p1", "Ana", "T1"), goalkeeper("p2", "Bia", "T1")];
    const teamMatches = [conceded("T1", 2)];
    const result = computeGoalkeeperRanking(goalkeepers, teamMatches);
    expect(result.map((r) => [r.playerId, r.average])).toEqual([
      ["p1", 2],
      ["p2", 2],
    ]);
  });

  it("excludes goalkeepers whose team hasn't played yet", () => {
    const goalkeepers = [goalkeeper("p1", "Ana", "T1")];
    expect(computeGoalkeeperRanking(goalkeepers, [])).toEqual([]);
  });

  it("breaks ties alphabetically", () => {
    const goalkeepers = [goalkeeper("p2", "Bia", "T2"), goalkeeper("p1", "Ana", "T1")];
    const teamMatches = [conceded("T1", 1), conceded("T2", 1)];
    expect(computeGoalkeeperRanking(goalkeepers, teamMatches).map((r) => r.playerName)).toEqual(["Ana", "Bia"]);
  });
});

function player(id: string, name: string, teamId: string, teamName: string): TableTennisPlayer {
  return { id, name, teamId, teamName };
}

describe("computeGameWinRanking", () => {
  it("credits both players of a doubles win", () => {
    const games: GameResultRecord[] = [
      {
        winnerSide: "HOME",
        homePlayers: [player("p1", "Ana", "T1", "Time 1"), player("p2", "Bia", "T1", "Time 1")],
        awayPlayers: [player("p3", "Caio", "T2", "Time 2")],
      },
    ];
    const result = computeGameWinRanking(games);
    expect(result).toEqual([
      { playerId: "p1", playerName: "Ana", teamId: "T1", teamName: "Time 1", wins: 1 },
      { playerId: "p2", playerName: "Bia", teamId: "T1", teamName: "Time 1", wins: 1 },
    ]);
  });

  it("ignores undecided games", () => {
    const games: GameResultRecord[] = [
      { winnerSide: null, homePlayers: [player("p1", "Ana", "T1", "Time 1")], awayPlayers: [player("p2", "Bia", "T2", "Time 2")] },
    ];
    expect(computeGameWinRanking(games)).toEqual([]);
  });

  it("sums wins across multiple games and sorts descending", () => {
    const games: GameResultRecord[] = [
      { winnerSide: "HOME", homePlayers: [player("p1", "Ana", "T1", "Time 1")], awayPlayers: [player("p2", "Bia", "T2", "Time 2")] },
      { winnerSide: "HOME", homePlayers: [player("p1", "Ana", "T1", "Time 1")], awayPlayers: [player("p2", "Bia", "T2", "Time 2")] },
      { winnerSide: "AWAY", homePlayers: [player("p1", "Ana", "T1", "Time 1")], awayPlayers: [player("p2", "Bia", "T2", "Time 2")] },
    ];
    expect(computeGameWinRanking(games).map((r) => [r.playerId, r.wins])).toEqual([
      ["p1", 2],
      ["p2", 1],
    ]);
  });
});
