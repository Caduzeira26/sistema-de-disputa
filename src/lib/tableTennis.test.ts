import { describe, expect, it } from "vitest";
import { countGamesWon } from "./tableTennis";

describe("countGamesWon", () => {
  it("counts decided games per side", () => {
    expect(
      countGamesWon([{ winnerSide: "HOME" }, { winnerSide: "HOME" }, { winnerSide: "AWAY" }, { winnerSide: null }])
    ).toEqual({ home: 2, away: 1 });
  });

  it("ignores undecided games", () => {
    expect(countGamesWon([{ winnerSide: null }, { winnerSide: null }])).toEqual({ home: 0, away: 0 });
  });

  it("returns zeroes for no games", () => {
    expect(countGamesWon([])).toEqual({ home: 0, away: 0 });
  });
});
