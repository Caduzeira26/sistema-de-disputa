import { describe, expect, it } from "vitest";
import { formatBRL, isSportAllowed, isWithinTeamLimit, isWithinTournamentLimit, type PlanLimits } from "./plans";

const startLimits: PlanLimits = {
  plan: "START",
  maxTeamsPerTournament: 16,
  maxActiveTournaments: 2,
  tournamentCountMode: "ACTIVE_ONLY",
  tournamentCountSince: null,
  allowedSports: ["FUTEBOL_CAMPO", "FUTSAL"],
  canChargeRegistration: false,
  canWhiteLabel: false,
};

const unlimitedLimits: PlanLimits = {
  ...startLimits,
  plan: "PRO",
  maxTeamsPerTournament: null,
  maxActiveTournaments: null,
  allowedSports: ["FUTEBOL_CAMPO", "FUTSAL", "FUTEBOL_7", "HANDEBOL", "VOLEIBOL", "BASQUETE", "TENIS_DE_MESA"],
  canChargeRegistration: true,
};

describe("isSportAllowed", () => {
  it("allows sports in the plan's allow-list", () => {
    expect(isSportAllowed(startLimits, "FUTSAL")).toBe(true);
  });

  it("blocks sports outside the plan's allow-list", () => {
    expect(isSportAllowed(startLimits, "BASQUETE")).toBe(false);
  });

  it("allows anything when the plan has no sport restriction", () => {
    expect(isSportAllowed(unlimitedLimits, "BASQUETE")).toBe(true);
  });
});

describe("isWithinTournamentLimit", () => {
  it("allows creation below the cap", () => {
    expect(isWithinTournamentLimit(startLimits, 1)).toBe(true);
  });

  it("blocks creation at the cap", () => {
    expect(isWithinTournamentLimit(startLimits, 2)).toBe(false);
  });

  it("blocks creation above the cap", () => {
    expect(isWithinTournamentLimit(startLimits, 3)).toBe(false);
  });

  it("never blocks when the plan has no cap", () => {
    expect(isWithinTournamentLimit(unlimitedLimits, 999)).toBe(true);
  });
});

describe("isWithinTeamLimit", () => {
  it("allows registration below the cap", () => {
    expect(isWithinTeamLimit(startLimits, 15)).toBe(true);
  });

  it("blocks registration at the cap", () => {
    expect(isWithinTeamLimit(startLimits, 16)).toBe(false);
  });

  it("never blocks when the plan has no cap", () => {
    expect(isWithinTeamLimit(unlimitedLimits, 999)).toBe(true);
  });
});

describe("formatBRL", () => {
  it("formats cents as Brazilian currency", () => {
    expect(formatBRL(2990)).toBe("R$ 29,90");
  });

  it("formats whole reais without cents drift", () => {
    expect(formatBRL(19700)).toBe("R$ 197,00");
  });
});
