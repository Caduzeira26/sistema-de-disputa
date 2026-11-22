import { describe, expect, it } from "vitest";
import {
  CORPORATE_PLAN,
  FREE_PLAN,
  formatBRL,
  getEffectiveMonthlyPriceCents,
  getSubscriptionPriceCents,
  isPromoActive,
  isSportAllowed,
  isWithinTeamLimit,
  isWithinTournamentLimit,
  type PlanCatalogEntry,
  type PlanLimits,
} from "./plans";

const startLimits: PlanLimits = {
  plan: "START",
  maxTeamsPerTournament: 16,
  maxActiveTournaments: 2,
  tournamentCountMode: "ACTIVE_ONLY",
  tournamentCountSince: null,
  allowedSports: ["FUTEBOL_CAMPO", "FUTSAL"],
  canChargeRegistration: false,
  canWhiteLabel: false,
  canManageAthleteRegistry: false,
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

const proWithPromo: PlanCatalogEntry = {
  tier: "PRO",
  label: "Pro",
  priceMonthlyCents: 14700,
  promoPriceMonthlyCents: 8700,
  promoEndsAt: new Date("2026-09-17T00:00:00Z"),
  maxTeamsPerTournament: null,
  maxActiveTournaments: null,
  allowedSports: [],
  canChargeRegistration: true,
  canWhiteLabel: false,
  canManageAthleteRegistry: false,
  features: [],
};

describe("getEffectiveMonthlyPriceCents", () => {
  it("charges the promo price while the promo is running", () => {
    const now = new Date("2026-09-12T00:00:00Z");
    expect(getEffectiveMonthlyPriceCents(proWithPromo, now)).toBe(8700);
  });

  it("charges the regular price once the promo ends", () => {
    const now = new Date("2026-09-18T00:00:00Z");
    expect(getEffectiveMonthlyPriceCents(proWithPromo, now)).toBe(14700);
  });

  it("charges the regular price for a plan with no promo configured", () => {
    const noPromo: PlanCatalogEntry = { ...proWithPromo, promoPriceMonthlyCents: undefined, promoEndsAt: undefined };
    expect(getEffectiveMonthlyPriceCents(noPromo, new Date("2026-09-12T00:00:00Z"))).toBe(14700);
  });
});

describe("isPromoActive", () => {
  it("is true before the promo end date", () => {
    expect(isPromoActive(proWithPromo, new Date("2026-09-12T00:00:00Z"))).toBe(true);
  });

  it("is false after the promo end date", () => {
    expect(isPromoActive(proWithPromo, new Date("2026-09-18T00:00:00Z"))).toBe(false);
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

describe("getSubscriptionPriceCents", () => {
  const afterPromo = new Date("2099-01-01T00:00:00Z");

  it("charges the avulso price for a one-off Start purchase", () => {
    expect(getSubscriptionPriceCents("START", "PER_TOURNAMENT", afterPromo)).toBe(2500);
  });

  it("charges the monthly price otherwise", () => {
    expect(getSubscriptionPriceCents("START", "MONTHLY", afterPromo)).toBe(2990);
    expect(getSubscriptionPriceCents("PRO", "MONTHLY", afterPromo)).toBe(14700);
    expect(getSubscriptionPriceCents("LIGA", "MONTHLY", afterPromo)).toBe(19700);
  });

  it("falls back to the monthly price when a plan has no avulso option", () => {
    expect(getSubscriptionPriceCents("PRO", "PER_TOURNAMENT", afterPromo)).toBe(14700);
  });
});

describe("FREE_PLAN", () => {
  it("matches what the free trial really allows", () => {
    expect(FREE_PLAN.priceCents).toBe(0);
    expect(FREE_PLAN.maxTournaments).toBe(1);
    expect(FREE_PLAN.maxTeamsPerTournament).toBe(16);
    expect([...FREE_PLAN.allowedSports]).toEqual(["FUTEBOL_CAMPO", "FUTSAL"]);
  });

  it("only advertises the sports and team cap it enforces", () => {
    const text = FREE_PLAN.features.join(" | ");
    expect(text).toContain("Até 16 equipes");
    expect(text).toContain("Futebol de campo e futsal");
    expect(text).toContain("Sem cartão de crédito");
  });
});

describe("CORPORATE_PLAN", () => {
  it("costs R$ 1.200 to install plus R$ 200 a month", () => {
    expect(CORPORATE_PLAN.setupPriceCents).toBe(120000);
    expect(CORPORATE_PLAN.priceMonthlyCents).toBe(20000);
    expect(formatBRL(CORPORATE_PLAN.setupPriceCents).replace(/ /g, " ")).toBe("R$ 1.200,00");
    expect(formatBRL(CORPORATE_PLAN.priceMonthlyCents).replace(/ /g, " ")).toBe("R$ 200,00");
  });

  it("includes everything from the other plans and the own-domain site", () => {
    const text = CORPORATE_PLAN.features.join(" | ");
    expect(text).toContain("Tudo dos planos Start, Pro e Liga");
    expect(text).toContain("domínio");
  });
});
