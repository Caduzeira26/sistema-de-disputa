import { describe, expect, it } from "vitest";
import {
  getSportFamily,
  MAX_PLAYERS_PER_TEAM,
  MIN_PLAYERS_PER_TEAM,
  SPORT_LABELS,
  SPORT_TYPES,
  supportsPenalties,
} from "./sport";

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

  it("maps the electronic games to the score-only family", () => {
    expect(getSportFamily("FIFA")).toBe("SCORE_ONLY");
    expect(getSportFamily("JUST_DANCE")).toBe("SCORE_ONLY");
  });

  it("has a label for every sport type", () => {
    for (const sport of SPORT_TYPES) {
      expect(SPORT_LABELS[sport]).toBeTruthy();
    }
  });
});

describe("MIN_PLAYERS_PER_TEAM", () => {
  it("matches the real minimum starting lineup for each field/court sport", () => {
    expect(MIN_PLAYERS_PER_TEAM.FUTEBOL_CAMPO).toBe(11);
    expect(MIN_PLAYERS_PER_TEAM.FUTSAL).toBe(5);
    expect(MIN_PLAYERS_PER_TEAM.FUTEBOL_7).toBe(7);
    expect(MIN_PLAYERS_PER_TEAM.HANDEBOL).toBe(7);
    expect(MIN_PLAYERS_PER_TEAM.VOLEIBOL).toBe(6);
    expect(MIN_PLAYERS_PER_TEAM.BASQUETE).toBe(5);
  });

  it("has a minimum for every sport type", () => {
    for (const sport of SPORT_TYPES) {
      expect(MIN_PLAYERS_PER_TEAM[sport]).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("electronic games", () => {
  it("are played 1x1, so a single player is a valid team", () => {
    expect(MIN_PLAYERS_PER_TEAM.FIFA).toBe(1);
    expect(MIN_PLAYERS_PER_TEAM.JUST_DANCE).toBe(1);
  });

  it("only FIFA goes to a penalty shootout", () => {
    expect(supportsPenalties("FIFA")).toBe(true);
    expect(supportsPenalties("JUST_DANCE")).toBe(false);
    expect(supportsPenalties("FUTSAL")).toBe(false);
  });
});

describe("Free Fire", () => {
  it("is played in quedas, not head-to-head", () => {
    expect(getSportFamily("FREE_FIRE")).toBe("LOBBY_POINTS");
  });

  it("takes squads of 4 to 5 players (4 starters + 1 reserve)", () => {
    expect(MIN_PLAYERS_PER_TEAM.FREE_FIRE).toBe(4);
    expect(MAX_PLAYERS_PER_TEAM.FREE_FIRE).toBe(5);
  });
});
