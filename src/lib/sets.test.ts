import { describe, expect, it } from "vitest";
import { countSetsWon } from "./sets";

describe("countSetsWon", () => {
  it("counts sets won by each side", () => {
    expect(
      countSetsWon([
        { homePoints: 25, awayPoints: 20 },
        { homePoints: 22, awayPoints: 25 },
        { homePoints: 25, awayPoints: 18 },
      ])
    ).toEqual({ home: 2, away: 1 });
  });

  it("returns zeroes for no sets", () => {
    expect(countSetsWon([])).toEqual({ home: 0, away: 0 });
  });

  it("ignores an (invalid) tied set for both sides", () => {
    expect(countSetsWon([{ homePoints: 10, awayPoints: 10 }])).toEqual({ home: 0, away: 0 });
  });
});
