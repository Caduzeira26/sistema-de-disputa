import { describe, expect, it } from "vitest";
import { sumPointsByTeam } from "./points";

describe("sumPointsByTeam", () => {
  it("sums points per side by team id", () => {
    const result = sumPointsByTeam(
      [
        { teamId: "home", points: 2 },
        { teamId: "away", points: 3 },
        { teamId: "home", points: 1 },
        { teamId: "home", points: 2 },
      ],
      "home",
      "away"
    );
    expect(result).toEqual({ home: 5, away: 3 });
  });

  it("returns zeroes when there are no baskets", () => {
    expect(sumPointsByTeam([], "home", "away")).toEqual({ home: 0, away: 0 });
  });
});
