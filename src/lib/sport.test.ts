import { describe, expect, it } from "vitest";
import { getSportFamily, SPORT_LABELS, SPORT_TYPES } from "./sport";

describe("getSportFamily", () => {
  it("groups goal-based sports together", () => {
    expect(getSportFamily("FUTEBOL_CAMPO")).toBe("GOALS_CARDS");
    expect(getSportFamily("FUTSAL")).toBe("GOALS_CARDS");
    expect(getSportFamily("FUTEBOL_7")).toBe("GOALS_CARDS");
    expect(getSportFamily("HANDEBOL")).toBe("GOALS_CARDS");
  });

  it("maps vôlei to sets, basquete to periods, tênis de mesa to ties", () => {
    expect(getSportFamily("VOLEIBOL")).toBe("SETS_CARDS");
    expect(getSportFamily("BASQUETE")).toBe("PERIODS_FOULS");
    expect(getSportFamily("TENIS_DE_MESA")).toBe("TABLE_TENNIS_TIES");
  });

  it("has a label for every sport type", () => {
    for (const sport of SPORT_TYPES) {
      expect(SPORT_LABELS[sport]).toBeTruthy();
    }
  });
});
