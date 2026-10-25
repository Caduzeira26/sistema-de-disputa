import { describe, expect, it } from "vitest";
import { decideWinnerSide, toPenalties } from "./winner";

describe("decideWinnerSide", () => {
  it("picks the higher score", () => {
    expect(decideWinnerSide(2, 1)).toBe("HOME");
    expect(decideWinnerSide(0, 3)).toBe("AWAY");
  });

  it("ignores penalties when the score is not level", () => {
    expect(decideWinnerSide(2, 1, { home: 0, away: 5 })).toBe("HOME");
  });

  it("falls back to the shootout when the score is level", () => {
    expect(decideWinnerSide(1, 1, { home: 4, away: 3 })).toBe("HOME");
    expect(decideWinnerSide(0, 0, { home: 2, away: 5 })).toBe("AWAY");
  });

  it("stays undecided when level with no shootout or a level shootout", () => {
    expect(decideWinnerSide(1, 1)).toBeNull();
    expect(decideWinnerSide(1, 1, null)).toBeNull();
    expect(decideWinnerSide(1, 1, { home: 3, away: 3 })).toBeNull();
  });

  it("stays undecided when scores aren't recorded", () => {
    expect(decideWinnerSide(null, null)).toBeNull();
    expect(decideWinnerSide(1, null)).toBeNull();
  });
});

describe("toPenalties", () => {
  it("returns a value only when both columns exist", () => {
    expect(toPenalties(4, 3)).toEqual({ home: 4, away: 3 });
    expect(toPenalties(0, 0)).toEqual({ home: 0, away: 0 });
    expect(toPenalties(4, null)).toBeNull();
    expect(toPenalties(undefined, undefined)).toBeNull();
  });
});
