import { describe, expect, it } from "vitest";
import {
  goalValue,
  kingsPhases,
  kingsScore,
  parseHalfMinutes,
  phaseAt,
  suggestGoalKind,
  validateDice,
  validatePresidentPenalty,
  validateSecretCard,
} from "./kings";

describe("kingsPhases", () => {
  it("matches the official minutes with 20 + 16", () => {
    const p = kingsPhases();
    expect(p).toMatchObject({ staggeredEnd: 5, doubleStart: 17, halfTime: 20, diceEnd: 23, end: 36 });
  });

  it("scales the phases for a shorter amateur game", () => {
    const p = kingsPhases(10, 8);
    expect(p.staggeredEnd).toBe(3); // 2,5 arredonda para 3
    expect(p.doubleStart).toBe(8); // últimos 2 minutos (1,5 arredonda para 2)
    expect(p.halfTime).toBe(10);
    expect(p.diceEnd).toBe(12);
    expect(p.end).toBe(18);
  });

  it("keeps every phase at least one minute long", () => {
    const p = kingsPhases(4, 4);
    expect(p.staggeredEnd).toBeGreaterThanOrEqual(1);
    expect(p.doubleStart).toBeLessThan(p.halfTime);
    expect(p.diceEnd).toBeGreaterThan(p.halfTime);
    expect(p.diceEnd).toBeLessThanOrEqual(p.end);
  });
});

describe("phaseAt and suggestGoalKind", () => {
  const p = kingsPhases();
  it("finds the phase of each official minute", () => {
    expect(phaseAt(0, p)).toBe("STAGGERED");
    expect(phaseAt(4, p)).toBe("STAGGERED");
    expect(phaseAt(5, p)).toBe("CARDS_1");
    expect(phaseAt(17, p)).toBe("DOUBLE");
    expect(phaseAt(19, p)).toBe("DOUBLE");
    expect(phaseAt(20, p)).toBe("DICE");
    expect(phaseAt(23, p)).toBe("CARDS_2");
    expect(phaseAt(36, p)).toBe("MATCHBALL");
  });

  it("suggests a double goal between 17' and 20'", () => {
    expect(suggestGoalKind(18, p)).toBe("DOUBLE_PHASE");
    expect(suggestGoalKind(10, p)).toBe("NORMAL");
    expect(suggestGoalKind(37, p)).toBe("MATCHBALL");
  });
});

describe("goalValue", () => {
  it("counts double goals, Gol x2 and the star player's goal as 2", () => {
    expect(goalValue("DOUBLE_PHASE")).toBe(2);
    expect(goalValue("CARD_DOUBLE")).toBe(2);
    expect(goalValue("STAR_PLAYER")).toBe(2);
    expect(goalValue("NORMAL")).toBe(1);
    expect(goalValue("PENALTY")).toBe(1);
    expect(goalValue("SHOOTOUT")).toBe(1);
    expect(goalValue("MATCHBALL")).toBe(1);
  });
});

describe("validateSecretCard", () => {
  const p = kingsPhases();
  it("only allows the card inside the card windows", () => {
    expect(validateSecretCard(10, "A", [], p)).toBeNull();
    expect(validateSecretCard(30, "A", [], p)).toBeNull();
    expect(validateSecretCard(3, "A", [], p)).toMatch(/entre 5' e 17'/);
    expect(validateSecretCard(18, "A", [], p)).not.toBeNull();
    expect(validateSecretCard(21, "A", [], p)).not.toBeNull();
    expect(validateSecretCard(36, "A", [], p)).not.toBeNull();
  });

  it("allows one card per team", () => {
    const used = [{ type: "SECRET_CARD" as const, teamId: "A" }];
    expect(validateSecretCard(10, "A", used, p)).toMatch(/já usou/);
    expect(validateSecretCard(10, "B", used, p)).toBeNull();
  });
});

describe("validatePresidentPenalty", () => {
  const p = kingsPhases();
  it("is blocked in the staggered, double, dice and matchball phases", () => {
    expect(validatePresidentPenalty(2, "A", [], p)).not.toBeNull();
    expect(validatePresidentPenalty(18, "A", [], p)).not.toBeNull();
    expect(validatePresidentPenalty(21, "A", [], p)).not.toBeNull();
    expect(validatePresidentPenalty(36, "A", [], p)).not.toBeNull();
    expect(validatePresidentPenalty(35, "A", [], p)).toBeNull();
  });

  it("lets the other team answer, but each team only once", () => {
    const used = [{ type: "PRESIDENT_PENALTY" as const, teamId: "A" }];
    expect(validatePresidentPenalty(12, "B", used, p)).toBeNull();
    expect(validatePresidentPenalty(12, "A", used, p)).toMatch(/já usou/);
  });
});

describe("validateDice", () => {
  it("accepts 1, 2 or 3 once per match", () => {
    expect(validateDice(2, [])).toBeNull();
    expect(validateDice(4, [])).not.toBeNull();
    expect(validateDice(1, [{ type: "DICE", teamId: null }])).toMatch(/já foi registrado/);
  });
});

describe("kingsScore", () => {
  it("adds goal values and goals awarded by events", () => {
    const score = kingsScore(
      [
        { teamId: "A", value: 1 },
        { teamId: "A", value: 2 },
        { teamId: "B", value: 1 },
      ],
      [
        { teamId: "B", goalsAwarded: 1 }, // pênalti do presidente convertido
        { teamId: "A", goalsAwarded: 0 }, // carta sem gol
        { teamId: null, goalsAwarded: 0 }, // dado
      ],
      "A",
      "B"
    );
    expect(score).toEqual({ home: 3, away: 2 });
  });
});

describe("parseHalfMinutes", () => {
  it("treats empty as official and rejects odd values", () => {
    expect(parseHalfMinutes("")).toBeNull();
    expect(parseHalfMinutes(null)).toBeNull();
    expect(parseHalfMinutes("12")).toBe(12);
    expect(parseHalfMinutes("2")).toBe("invalid");
    expect(parseHalfMinutes("7.5")).toBe("invalid");
    expect(parseHalfMinutes("abc")).toBe("invalid");
  });
});
